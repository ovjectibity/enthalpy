import express from "express";
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

// Routes
app.use("/api/hypotheses", hypothesesRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "Enthalpy API Server",
    version: "1.0.0",
    endpoints: {
      hypotheses: "/api/hypotheses",
      flowGraph: "/generate_flow_graph",
      agentThreads: "/get_agent_threads",
    },
  });
});

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

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
