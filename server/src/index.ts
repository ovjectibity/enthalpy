import express from "express";
import path from "path";
// import cors from "cors"; // TODO: Add after installing dependency
import { FlowGraphGenerator } from "./services/flowgraph.js";
import { ComputerTool, Tool } from "./services/tools.js";
import hypothesesRoutes from "./routes/hypotheses.js";

const app = express();
const port = process.env.APP_PORT;

// Middleware
// app.use(cors()); // TODO: Enable after installing cors
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static client files
const __dirname = path.resolve(); // Get current directory (for ES Modules)
app.use(express.static(path.join(__dirname, "client", "dist"))); // Assuming client build output is in the 'client/dist' directory relative to the project root

// Routes
app.use("/api/hypotheses", hypothesesRoutes);

app.get("/generate_flow_graph", (_req, res) => {
  const tools = new Map<string, Tool>();
  tools.set("computer", new ComputerTool());
  let gphgen = new FlowGraphGenerator(tools);
  gphgen.generateFlowGraph();
  res.json({
    response: "Flow graph generation initiated",
  });
});

app.get("/get_agent_threads", (_req, res) => {
  res.json({
    response: "Agent threads endpoint - implementation needed",
  });
});

// For any other requests, serve the client's index.html
// This MUST come AFTER your API routes so that API calls are not caught by this.
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

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
