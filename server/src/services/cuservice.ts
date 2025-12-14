import {
    CUServerToClientEvents, CUClientToServerEvents,
    CTInput, CuInitiationRequestResult, CuExpiryNotification } from "@enthalpy/shared";
import { io, Socket } from "socket.io-client";
import { exec } from "child_process";
import { promisify } from "util";
import * as crypto from "crypto";

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

    constructor() {
        this.cuServerId = crypto.randomBytes(16).toString('hex');
    }

    closeInstance(): void {
        // Close websocket connection
        if (this.cuInstanceSocket) {
            this.cuInstanceSocket.disconnect();
            this.cuInstanceSocket = undefined;
        }

        // Stop and remove Docker container
        if (this.cuServerId) {
            execAsync(`docker stop ${this.cuServerId}`)
                .then(() => execAsync(`docker rm ${this.cuServerId}`))
                .then(() => {
                    console.log(`Docker container ${this.cuServerId} stopped and removed`);
                })
                .catch((error) => {
                    console.error(`Failed to stop/remove container ${this.cuServerId}:`, error);
                });
        }
    }

    async initiateInstance(onExpiry?: (notification: CuExpiryNotification) => void): 
    Promise<CuInitiationRequestResult> {
        try {
            // Step 1: Launch Docker container
            const dockerCommand = `docker run -d \
                -p 0:3000 \
                --name ${this.cuServerId} \
                -e COMPUTER_USE_SETUP=${process.env.COMPUTER_USE_SETUP || '0'} \
                -e VNC_PORT=${process.env.VNC_PORT || '5900'} \
                -e CU_SECRET=${process.env.CU_SECRET} \
                computer-use-service`;

            await execAsync(dockerCommand);

            // Step 2: Get the assigned port
            const { stdout: portOutput } = await execAsync(`docker port ${this.cuServerId} 3000`);
            const assignedPort = portOutput.trim().split(':')[1];

            if (!assignedPort) {
                throw new Error('Failed to retrieve assigned port from Docker');
            }

            // Step 3: Connect to the websocket server
            await new Promise<void>((resolve, reject) => {
                this.cuInstanceSocket = io(`http://localhost:${assignedPort}/cuinstance`, {
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