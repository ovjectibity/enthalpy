import { Server } from "socket.io";
import {
    CUServerToClientEvents,
    CUClientToServerEvents,
    CuAction,
    CuActionResult
} from "@enthalpy/shared";

const PORT = 3000;
const CU_SECRET = process.env.CU_SECRET;

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
        console.log(`Received perform_action: actionId=${action.actionId}, token=${action.token}`);

        try {
            // TODO: Implement actual computer use actions here
            // For now, return a placeholder response

            const result: CuActionResult = {
                actionId: action.actionId,
                token: action.token,
                result: "error",
                errorReason: "Action implementation pending"
            };

            ack(result);
        } catch (error) {
            const errorResult: CuActionResult = {
                actionId: action.actionId,
                token: action.token,
                result: "error",
                errorReason: error instanceof Error ? error.message : String(error)
            };

            ack(errorResult);
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
});

console.log(`Computer Use Service WebSocket server listening on port ${PORT}`);
console.log(`Namespace: /cuinstance`);
