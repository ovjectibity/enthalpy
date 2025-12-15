import { Agent } from "./core.js";
import {
  ObjectiveO as ObjectiveContext,
  ProductContextO as ProductContext,
  MetricO as Metric,
  Contexts,
  Assets,
} from "@enthalpy/shared";
import { cuInstance } from "../cuservice.js";
import { CuNode, FlowGraph } from "./cuworkflow.js"

interface FlowGraphContext {
    productName: string, 
    url: string,
    scope: string,
    testAccountCredentials: string
}

class FGAgent extends Agent<FlowGraph> {
  flowContext: FlowGraphContext;
  pathsNode: CuNode;

  constructor(name: string, flowContext: FlowGraphContext) {
    super(name,[]);
    this.flowContext = flowContext;
    this.pathsNode = new CuNode("User journey mapper", cuInstance);
  }

  ingestUserInput(msg: string) {
    this.currentNode?.ingestUserInput(this.ctx,msg);
  }

  async runAgentWorkflow(): Promise<FlowGraph> {
    this.currentNode = this.pathsNode;
    return this.pathsNode.run(this.ctx).then(
    async (fg: FlowGraph) => {
        return Promise.resolve(fg);
    }).catch(err => {
    console.log(`Agent workflow error: ${err}`);
    return Promise.reject(new Error(`Agent workflow error: ${err}`));
    });
  }

  registerUserOutputCallback(cb: (msg: string) => Promise<void>) {
  }

  registerFinalisedProductContextCallback(
    cb: (productContexts: Contexts<ProductContext>) => Promise<void>) {
  }

  registerFinalisedObjContextCallback(
    cb: (productContexts: Contexts<ObjectiveContext>) => Promise<void>) {
  }

  registerFinalisedMetricsCallback(
    cb: (metrics: Assets<Metric>) => Promise<void>) {
  }
}