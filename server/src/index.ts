import express from "express";
import path from "path";
import { fileURLToPath } from "url"; // Import for ES Modules
// import cors from "cors"; // TODO: Add after installing dependency
// import { ComputerTool, Tool } fro../../computer-use-service/tools.js.js";
import hypothesesRoutes from "./routes/hypotheses";
import { threadsRouter } from "./routes/threads";
import { MongoDBConnections } from "./services/mongoConnect";
import { MongoDBInitializer } from "./services/mongoInit";
import { Namespace, Server } from 'socket.io';
import { AgentService } from "./services/agent";
import { ThreadsService } from "./services/threadsService";
import { 
  ThreadMessage, 
  AgentClientToServerEvents, 
  AgentServerToClientEvents, 
  ThreadActivation, 
  AppendMessageData
} from "@enthalpy/shared";
import http from "http";
import { wrap } from "module";

const app = express();
const port = process.env.APP_PORT;
const server = http.createServer(app);
const io = new Server(server); // attach socket.io to the server
const agentchat: Namespace<AgentClientToServerEvents,AgentServerToClientEvents> = io.of("/agent");
console.log("Running app at port", port);

// Initialize MongoDB connection
async function initializeMongoDB() {
  try {
    await MongoDBInitializer.initializeDatabase(
      process.env.SEED_MONGO_COLLECTION &&
      process.env.SEED_MONGO_COLLECTION === "1" ? true : false);
    console.log("MongoDB initialized successfully");
  } catch (error) {
    console.error("Failed to initialize MongoDB:", error);
    console.log("Continuing without MongoDB...");
  }
}

// Initialize MongoDB on startup
initializeMongoDB();

// Middleware
// app.use(cors()); // TODO: Enable after installing cors
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static client files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, "client", "build"))); // Assuming client build output is in the 'client/dist' directory relative to the project root

// Routes
app.use("/api/hypotheses", hypothesesRoutes);
app.use("/api/threads", threadsRouter);

app.use(express.static(path.join(__dirname, '../client_dist/build')));

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  },
);

// 404 handler - This might be redundant with the '*' route above, but good to keep for explicit API 404s
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  try {
    await MongoDBConnections.closeConnection();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  try {
    await MongoDBConnections.closeConnection();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

//Hierarchy here: User ID > Project ID > Agent
// Agent type to be handled via the event name
// TODO: Project ID to be handled via the event data json
// TODO: Handle thread ID via the event data json
// User ID to be handled via middleware
agentchat.use((socket, next) => {
  if(socket.handshake.auth.role === "user") {
    socket.data.userId = socket.handshake.auth.userId;
    next();
  }
  else next(new Error("Not a user"));
});

agentchat.on("connection", (socket) => {
  console.log("Client connected for agent chat:", socket.id);
  const aserv = new AgentService();

  socket.on("activate_thread",(msg: ThreadActivation) => {
    let agentName = msg.agentName;
    let threadId = msg.threadId;
    aserv.registerOutputCallback(agentName,
      async (msg: string) => {
          let wrappedMsg = await ThreadsService.appendMessageToThread(threadId,
          {
            agentName: agentName,
            message: msg,
            role: "agent", //TODO: Handle other types here
            messageType: "static", //TODO: Handle other types here,
            threadId: threadId,
            projectId: 1 //TODO: Handle projectId here
          });
          if(wrappedMsg.data) {
            socket.emit("agent_message",wrappedMsg.data);
          } else {
            console.log("Error inserting agent thread message to mongo DB", wrappedMsg);
          }
      });
  })

  socket.on("user_message", async (msg: AppendMessageData) => {
    console.log("Message received:", msg);
    let wrappedMsg = await ThreadsService.appendMessageToThread(msg.threadId,msg);
    if(wrappedMsg.data) {
      socket.emit("add_user_message",wrappedMsg.data);
      aserv.ingestUserInput(msg);
    } else {
      console.log("Error inserting user thread message to mongo DB", wrappedMsg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    socket.disconnect();
  });
});

server.listen(process.env.AGENT_CHAT_PORT,
  () => console.log("Listening on http://localhost:${process.env.AGENT_CHAT_PORT}"));
