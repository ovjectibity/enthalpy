import { Server } from "socket.io";
import {
    CUServerToClientEvents,
    CUClientToServerEvents,
    CuAction,
    CuActionResult
} from "@enthalpy/shared";
import { ComputerTool } from "./tools.js";
import * as fs from "fs";

const PORT = 3000;
const CU_SECRET = process.env.CU_SECRET;

// Create tmp directory for screenshots
if (!fs.existsSync("./tmp")) {
    fs.mkdirSync("./tmp");
}

// Initialize ComputerTool
const computerTool = new ComputerTool();

// Create Socket.IO server
const io = new Server<CUClientToServerEvents, CUServerToClientEvents>(PORT, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Create /cuinstance namespace
const cuNamespace = io.of("/cuinstance");

// Authentication middleware
cuNamespace.use((socket, next) => {
    const auth = socket.handshake.auth;

    if (!auth || !auth.secret) {
        return next(new Error("Authentication failed: missing secret"));
    }

    if (auth.secret !== CU_SECRET) {
        return next(new Error("Authentication failed: invalid secret"));
    }

    console.log(`Client authenticated: role=${auth.role}`);
    next();
});

// Connection handler
cuNamespace.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle perform_action event
    socket.on("perform_action", async (action: CuAction, ack) => {
        console.log(`Received perform_action: actionId=${action.actionId}, " + 
            "token=${action.token}, action=${action.action.action}`);

        try {
            let responseMessage: string;

            switch (action.action.action) {
                case "screenshot":
                    responseMessage = "Screenshot captured successfully";
                    break;
                case "left_click":
                    responseMessage = await computerTool.executeClick(
                        action.action.x,
                        action.action.y,
                        "left"
                    );
                    break;
                case "right_click":
                    responseMessage = await computerTool.executeClick(
                        action.action.x,
                        action.action.y,
                        "right"
                    );
                    break;
                case "scroll":
                    responseMessage = await computerTool.executeScroll(
                        action.action.x,
                        action.action.y
                    );
                    break;
                case "type":
                    responseMessage = 
                        await computerTool.executeType(action.action.input);
                    break;
                default:
                    throw new Error(`Unknown action: ${(action.action as any).action}`);
            }

            // Take screenshot after every action
            const screengrab = await computerTool.getScreenshot();

            const result: CuActionResult = {
                actionId: action.actionId,
                token: action.token,
                result: "success",
                screengrab: screengrab
            };

            console.log(`Action completed: ${responseMessage}`);
            ack(result);
        } catch (error) {
            const errorResult: CuActionResult = {
                actionId: action.actionId,
                token: action.token,
                result: "error",
                errorReason: error instanceof Error ? error.message : String(error)
            };

            console.error(`Action failed:`, error);
            ack(errorResult);
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
});

console.log(`Computer Use Service WebSocket server listening on port ${PORT}`);
console.log(`Namespace: /cuinstance`);
