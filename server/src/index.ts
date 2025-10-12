import express from "express";
import path from "path";
import { fileURLToPath } from "url"; // Import for ES Modules
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, "client", "build"))); // Assuming client build output is in the 'client/dist' directory relative to the project root

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

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../client/build/index.html'));
// });

app.use(express.static(path.join(__dirname, '../../client/build')));

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
