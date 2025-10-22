import express from "express";
import path from "path";
import { fileURLToPath } from "url"; // Import for ES Modules
// import cors from "cors"; // TODO: Add after installing dependency
// import { ComputerTool, Tool } fro../../computer-use-service/tools.js.js";
import hypothesesRoutes from "./routes/hypotheses.js";
import { threadsRouter } from "./routes/threads.js";
import { MongoDBConnections } from "./services/mongoConnect.js";
import { MongoDBInitializer } from "./services/mongoInit.js";
import { Server } from 'socket.io';
import { AgentService, UserOutputMessage } from "./services/agent.js";
import http from "http";

const app = express();
const port = process.env.APP_PORT;
const server = http.createServer(app);
const io = new Server(server); // attach socket.io to the server
const agentchat = io.of("/agent");
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
  aserv.registerOutputCallback("mc",(msg: UserOutputMessage) => {
    let wrappedMsg = (msg as any);
    wrappedMsg.agentName = "mc";
    socket.emit("agent_message",wrappedMsg);
  });

  socket.on("user_message", (msg) => {
    console.log("Message received:", msg);
    if(msg.projectId) {
      aserv.ingestUserInput(msg);
    } else {
      console.log("No project_id with the message sent, not doing anything")
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    socket.disconnect();
  });
});

server.listen(process.env.AGENT_CHAT_PORT,
  () => console.log("Listening on http://localhost:${process.env.AGENT_CHAT_PORT}"));
