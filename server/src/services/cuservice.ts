import {
    CUServerToClientEvents, CUClientToServerEvents,
    CTInput, CuInitiationRequestResult, CuExpiryNotification } from "@enthalpy/shared";
import { io, Socket } from "socket.io-client";
import { exec } from "child_process";
import { promisify } from "util";
import * as crypto from "crypto";
import { NodeSSH } from "node-ssh";
import * as os from "os";
import * as path from "path";

const execAsync = promisify(exec);

interface ComputerUseService {
    initiateInstance(onExpiry?: (notification: CuExpiryNotification) => void): Promise<CuInitiationRequestResult>;
    performAction(actionId: string, input: CTInput): Promise<string>;
    closeInstance(): void;
}

class CuInstance implements ComputerUseService {
    cuInstanceSocket?: Socket<CUServerToClientEvents, CUClientToServerEvents>;
    cuServerId: string;
    cuServerExpiry?: Date;
    private cuMode: 'local' | 'remote';
    private remoteHost?: string;
    private remoteUser: string;
    private sshKeyPath: string;
    private ssh?: NodeSSH;

    constructor() {
        this.cuServerId = crypto.randomBytes(16).toString('hex');
        this.cuMode = (process.env.CU_MODE || 'local') as 'local' | 'remote';
        this.remoteHost = process.env.CU_REMOTE_HOST;
        this.remoteUser = process.env.CU_REMOTE_USER || 'ubuntu';
        this.sshKeyPath = process.env.CU_SSH_KEY_PATH || path.join(os.homedir(), '.ssh', 'id_rsa');

        // Validate remote mode configuration
        if (this.cuMode === 'remote' && !this.remoteHost) {
            throw new Error('CU_REMOTE_HOST must be set when CU_MODE=remote');
        }
    }

    closeInstance(): void {
        // Close websocket connection
        if (this.cuInstanceSocket) {
            this.cuInstanceSocket.disconnect();
            this.cuInstanceSocket = undefined;
        }

        // Stop and remove Docker container
        if (this.cuServerId) {
            if (this.cuMode === 'remote') {
                this.closeRemoteContainer();
            } else {
                this.closeLocalContainer();
            }
        }
    }

    private closeLocalContainer(): void {
        execAsync(`docker stop ${this.cuServerId}`)
            .then(() => execAsync(`docker rm ${this.cuServerId}`))
            .then(() => {
                console.log(`Docker container ${this.cuServerId} stopped and removed`);
            })
            .catch((error) => {
                console.error(`Failed to stop/remove container ${this.cuServerId}:`, error);
            });
    }

    private async closeRemoteContainer(): Promise<void> {
        try {
            const ssh = new NodeSSH();
            await ssh.connect({
                host: this.remoteHost!,
                username: this.remoteUser,
                privateKeyPath: this.sshKeyPath
            });

            await ssh.execCommand(`docker stop ${this.cuServerId} && docker rm ${this.cuServerId}`);
            console.log(`Remote Docker container ${this.cuServerId} stopped and removed`);
            ssh.dispose();
        } catch (error) {
            console.error(`Failed to stop/remove remote container ${this.cuServerId}:`, error);
        }
    }

    async initiateInstance(onExpiry?: (notification: CuExpiryNotification) => void):
    Promise<CuInitiationRequestResult> {
        if (this.cuMode === 'remote') {
            return this.initiateRemoteInstance(onExpiry);
        } else {
            return this.initiateLocalInstance(onExpiry);
        }
    }

    private async initiateLocalInstance(onExpiry?: (notification: CuExpiryNotification) => void):
    Promise<CuInitiationRequestResult> {
        try {
            // Step 1: Launch Docker container
            const dockerCommand = `docker run -d \
                -p 0:3000 \
                --name ${this.cuServerId} \
                -e VNC_PORT=${process.env.VNC_PORT || '5900'} \
                -e CU_SECRET=${process.env.CU_SECRET} \
                computer-use-service:latest`;

            await execAsync(dockerCommand);

            // Step 2: Get the assigned port
            const { stdout: portOutput} = await execAsync(`docker port ${this.cuServerId} 3000`);
            const assignedPort = portOutput.trim().split(':')[1];

            if (!assignedPort) {
                throw new Error('Failed to retrieve assigned port from Docker');
            }

            // Step 3: Connect to the websocket server
            await this.connectToWebSocket('localhost', assignedPort, onExpiry);

            // Set expiry time and timer
            this.setupExpiryTimer(onExpiry);

            return {
                result: "success",
                token: this.cuServerId,
                expiry: this.cuServerExpiry
            };
        } catch (error) {
            return {
                result: "error",
                errorReason: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private async initiateRemoteInstance(onExpiry?: (notification: CuExpiryNotification) => void):
    Promise<CuInitiationRequestResult> {
        try {
            // Step 1: Connect to remote host via SSH
            const ssh = new NodeSSH();
            await ssh.connect({
                host: this.remoteHost!,
                username: this.remoteUser,
                privateKeyPath: this.sshKeyPath
            });

            // Step 2: Launch Docker container on remote host
            const dockerCommand = `docker run -d -p 0:3000 --name ${this.cuServerId} \
                -e VNC_PORT=${process.env.VNC_PORT || '5900'} \
                -e CU_SECRET=${process.env.CU_SECRET} \
                computer-use-service:latest`;

            await ssh.execCommand(dockerCommand);

            // Step 3: Get the assigned port from remote host
            const portResult = await ssh.execCommand(`docker port ${this.cuServerId} 3000`);
            const assignedPort = portResult.stdout.trim().split(':')[1];

            if (!assignedPort) {
                throw new Error('Failed to retrieve assigned port from remote Docker');
            }

            ssh.dispose();

            // Step 4: Connect to the remote websocket server
            await this.connectToWebSocket(this.remoteHost!, assignedPort, onExpiry);

            // Set expiry time and timer
            this.setupExpiryTimer(onExpiry);

            return {
                result: "success",
                token: this.cuServerId,
                expiry: this.cuServerExpiry
            };
        } catch (error) {
            return {
                result: "error",
                errorReason: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private async connectToWebSocket(
        host: string,
        port: string,
        onExpiry?: (notification: CuExpiryNotification) => void
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.cuInstanceSocket = io(`http://${host}:${port}/cuinstance`, {
                transports: ['websocket'],
                auth: { role: "user", secret: process.env.CU_SECRET }
            });

            this.cuInstanceSocket.on('connect', () => {
                resolve();
            });

            this.cuInstanceSocket.on('connect_error', (error) => {
                reject(new Error(`WebSocket connection failed: ${error.message}`));
            });

            // Handle disconnection as a failure expiry
            this.cuInstanceSocket.on('disconnect', () => {
                if (onExpiry) {
                    onExpiry({
                        token: this.cuServerId,
                        reason: 'failure'
                    });
                }
                // Automatically close the instance on unexpected disconnect
                this.closeInstance();
            });

            // Set a timeout for connection
            setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000);
        });
    }

    private setupExpiryTimer(onExpiry?: (notification: CuExpiryNotification) => void): void {
        // Set expiry time (1 hour from now)
        this.cuServerExpiry = new Date(Date.now() + 60 * 60 * 1000);

        // Set up expiry timer
        setTimeout(() => {
            if (onExpiry) {
                onExpiry({
                    token: this.cuServerId,
                    reason: 'time_expired'
                });
            }
            // Automatically close the instance after expiry
            this.closeInstance();
        }, 60 * 60 * 1000); // 1 hour
    }

    async performAction(actionId: string, input: CTInput): Promise<string> {
        if(this.cuInstanceSocket && this.cuServerId) {
            let res = await this.cuInstanceSocket.emitWithAck("perform_action",{
                token: this.cuServerId,
                actionId: actionId,
                action: input
            });
            if(res.result === "success" && res.screengrab) {
                return Promise.resolve(res.screengrab);
            } else {
                return Promise.reject(
                    new Error(`Failure to performAction ${input}`));
            }
        } else {
            return Promise.reject(
                new Error(`CuInstance not initialised, skipping performAction ${input}`));
        }
    }
}

const cuInstance: ComputerUseService = new CuInstance();

export { cuInstance, ComputerUseService };