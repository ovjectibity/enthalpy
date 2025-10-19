import express from "express";
import path from "path";
import { fileURLToPath } from "url"; // Import for ES Modules
// import cors from "cors"; // TODO: Add after installing dependency
// import { ComputerTool, Tool } fro../../computer-use-service/tools.js.js";
import hypothesesRoutes from "./routes/hypotheses.js";
import { threadsRouter } from "./routes/threads.js";
import { MongoDBConnections } from "./services/mongoConnect.js";
import {MongoDBInitializer} from "./services/mongoInit.js"

const app = express();
const port = process.env.APP_PORT;
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

// app.get("/generate_flow_graph", (_req, res) => {
//   const tools = new Map<string, Tool>();
//   tools.set("computer", new ComputerTool());
//   let gphgen = new FlowGraphGenerator(tools);
//   gphgen.generateFlowGraph();
//   res.json({
//     response: "Flow graph generation initiated",
//   });
// });

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../client/build/index.html'));
// });

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
