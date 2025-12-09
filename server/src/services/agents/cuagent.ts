import { WorkflowNode, WorkflowContext, Agent, WorkflowNodeState } from "./core.js";
import {
  ObjectiveO as ObjectiveContext,
  ProductContextO as ProductContext,
  MetricO as Metric,
  Contexts,
  Assets
} from "@enthalpy/shared";

interface ComputerUseService {
    getScreenshot(): string;
    performLeftClick(x: number,y: number): string;
    performRightClick(x: number,y: number): string; 
    performScroll(x: number,y: number): string;
}

interface FGContext {
    productName: string, 
    url: string,
    scope: string,
    testAccountCredentials: string
}

interface FlowGraphNode {
    screngrab: string,
    description?: string,
    next?: FlowGraphNode
}

class FGAgent extends Agent<FlowGraphNode> {
  flowContext: FGContext;
  pathsNode: Pathways;

  constructor(name: string, flowContext: FGContext) {
    super(name,[]);
    this.flowContext = flowContext;
    this.pathsNode = new Pathways("");
  }

  ingestUserInput(msg: string) {
    this.currentNode?.ingestUserInput(this.ctx,msg);
  }

  async runAgentWorkflow(): Promise<FlowGraphNode> {
    this.currentNode = this.pathsNode;
    return this.pathsNode.run(this.ctx).then(
    async (fg: FlowGraphNode) => {
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

class Pathways extends WorkflowNode {
  constructor(name: string,parent?: WorkflowNode) {
    super(name,parent);
  }

  async run(state: WorkflowContext): Promise<any> {
    if(this.state === "idle") {
        console.log(`Running the Pathways node ${this.name}`);
        // state.model?.input();
    } else return Promise.reject(new Error(`WorkflowNode Pathways ${this.name} not in idle state`));
  }

  async processModelOutput() {

  }

  ingestUserInput(ctx: WorkflowContext, msg: string): void {
    //Do nothing; no user input can be accepted at this stage
  }
}