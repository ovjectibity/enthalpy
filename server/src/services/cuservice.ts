import { 
    CUServerToClientEvents, CUClientToServerEvents, 
    CuInitiationRequestResult } from "@enthalpy/shared";
import { io, Socket } from "socket.io-client";

interface ComputerUseService {
    getScreenshot(actionId: string): Promise<string>;
    performLeftClick(actionId: string, x: number,y: number): Promise<string>;
    performRightClick(actionId: string, x: number,y: number): Promise<string>; 
    performScroll(actionId: string, x: number, y: number): Promise<string>;
    performKeyInput(actionId: string, input: string): Promise<string>;
}

class CuConnector implements ComputerUseService {
    cuServerSocket?: Socket<CUServerToClientEvents, CUClientToServerEvents>;
    cuServerToken?: string;
    cuServerExpiry?: Date;
    
    constructor() {
    }

    async initiateConnector() {
        this.cuServerSocket = io("http://localhost:3000/agent", {
            transports: ['websocket'], // Force WebSocket
            auth: { role: "user", secret: "" }
        });
        await this.cuServerSocket.emit("initiate_instance",{secret: ""},
        (res: CuInitiationRequestResult) => {
            if(res.result === "success") {
                this.cuServerToken = res.token; 
                this.cuServerExpiry = res.expiry; 
            } else {
                console.error(`Failed to initiate CuConnector ${res.errorReason}`);
            }
        });
    }

    async getScreenshot(actionId: string): Promise<string> {
        if(this.cuServerSocket && this.cuServerToken) {
            let res = await this.cuServerSocket.emitWithAck("perform_action",{
                action: {
                    action: "screenshot"
                },
                token: this.cuServerToken,
                actionId: actionId
            });
            if(res.result === "success" && res.screengrab) {
                return Promise.resolve(res.screengrab);
            } else {
                return Promise.reject(
                    new Error(`Failure to getScreenshot`));
            }
        } else {
            return Promise.reject(
                new Error(`CuConnector not initialised, skipping getScreenshot`));
        }
    }

    async performLeftClick(actionId: string, x: number, y: number): Promise<string> {
        if(this.cuServerSocket && this.cuServerToken) {
            let res = await this.cuServerSocket.emitWithAck("perform_action",{
                action: {
                    action: "left_click",
                    x: x,
                    y: y
                },
                token: this.cuServerToken,
                actionId: actionId
            });
            if(res.result === "success" && res.screengrab) {
                return Promise.resolve(res.screengrab);
            } else {
                return Promise.reject(
                    new Error(`Failure to performLeftClick`));
            }
        } else {
            return Promise.reject(
                new Error(`CuConnector not initialised, skipping getScreenshot`));
        }
    }

    async performRightClick(actionId: string, x: number, y: number): Promise<string> {
        if(this.cuServerSocket && this.cuServerToken) {
            let res = await this.cuServerSocket.emitWithAck("perform_action",{
                action: {
                    action: "right_click",
                    x: x,
                    y: y
                },
                token: this.cuServerToken,
                actionId: actionId
            });
            if(res.result === "success" && res.screengrab) {
                return Promise.resolve(res.screengrab);
            } else {
                return Promise.reject(
                    new Error(`Failure to performRightClick`));
            }
        } else {
            return Promise.reject(
                new Error(`CuConnector not initialised, skipping getScreenshot`));
        }
    }

    async performScroll(actionId: string, x: number, y: number): Promise<string> {
        if(this.cuServerSocket && this.cuServerToken) {
            let res = await this.cuServerSocket.emitWithAck("perform_action",{
                action: {
                    action: "scroll",
                    x: x,
                    y: y
                },
                token: this.cuServerToken,
                actionId: actionId
            });
            if(res.result === "success" && res.screengrab) {
                return Promise.resolve(res.screengrab);
            } else {
                return Promise.reject(
                    new Error(`Failure to performScroll`));
            }
        } else {
            return Promise.reject(
                new Error(`CuConnector not initialised, skipping getScreenshot`));
        }
    }

    async performKeyInput(actionId: string, input: string): Promise<string> {
        if(this.cuServerSocket && this.cuServerToken) {
            let res = await this.cuServerSocket.emitWithAck("perform_action",{
                action: {
                    action: "type",
                    input: input
                },
                token: this.cuServerToken,
                actionId: actionId
            });
            if(res.result === "success" && res.screengrab) {
                return Promise.resolve(res.screengrab);
            } else {
                return Promise.reject(
                    new Error(`Failure to performKeyInput`));
            }
        } else {
            return Promise.reject(
                new Error(`CuConnector not initialised, skipping getScreenshot`));
        }
    }
}

export { ComputerUseService };