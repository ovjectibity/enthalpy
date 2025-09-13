import express from "express";
import { FlowGraphGenerator } from "./flowgraph.js";
import { ComputerTool, Tool } from "./tools.js";

const app = express();
const port = 3001;

app.get("/", (_req, res) => {
  res.send();
});

app.get("/generate_flow_graph", (_req, res) => {
  const tools = new Map<string, Tool>();
  tools.set("computer", new ComputerTool());
  let gphgen = new FlowGraphGenerator(tools);
  gphgen.generateFlowGraph();
  res.send({
    response: "doing something",
  });
});

app.listen(port, () => {
  console.log("Server running at http://localhost:${port}");
});
