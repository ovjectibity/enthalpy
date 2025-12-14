import { 
    CUServerToClientEvents, CUClientToServerEvents, 
    CuInitiationRequestResult, CTInput } from "@enthalpy/shared";
import { io, Socket } from "socket.io-client";

interface ComputerUseService {
    performAction(actionId: string, input: CTInput): Promise<string>
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

    async performAction(actionId: string, input: CTInput): Promise<string> {
        if(this.cuServerSocket && this.cuServerToken) {
            let res = await this.cuServerSocket.emitWithAck("perform_action",{
                token: this.cuServerToken,
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
                new Error(`CuConnector not initialised, skipping performAction ${input}`));
        }
    }
}

const cuConnector: ComputerUseService = new CuConnector();

export { cuConnector, ComputerUseService };