import { WorkflowNode, WorkflowContext, Agent } from "./core.js";
import {
  ObjectiveO as ObjectiveContext,
  ProductContextO as ProductContext,
  MetricO as Metric,
  Contexts,
  Assets
} from "@enthalpy/shared";
import { computerUseToolInputSchema } from "../../schemas/toolSchemas.js";

interface ComputerUseService {
    getScreenshot(): string;
    performLeftClick(x: number,y: number): string;
    performRightClick(x: number,y: number): string; 
    performScroll(x: number,y: number): string;
}

interface FlowGraphContext {
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
  flowContext: FlowGraphContext;
  pathsNode: Pathways;

  constructor(name: string, flowContext: FlowGraphContext) {
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
  finalisedFlow: {
    actual?: FlowGraphNode,
    finalise?: (actual: FlowGraphNode) => void;
    abort?: (err: any) => void;
  }

  constructor(name: string,parent?: WorkflowNode) {
    super(name,parent);
    this.finalisedFlow = {
    }
  }

  async run(state: WorkflowContext): Promise<any> {
    if(this.state === "idle") {
      console.log(`Running the Pathways node ${this.name}`);
      state.messages.push({
        role: "user",
        contents: [
          {
            type: "workflow_instruction",
            content: ""
          }
        ]
      });
      await state.model?.input(state.messages,
        new Map([
        ["computer_use",computerUseToolInputSchema]
      ]));
      return new Promise((res,rej) => {
        this.finalisedFlow.finalise = res;
        this.finalisedFlow.abort = rej;
      });
    } else return Promise.reject(new Error(`WorkflowNode Pathways ${this.name} not in idle state`));
  }

  async processModelOutput() {
    
  }

  ingestUserInput(ctx: WorkflowContext, msg: string): void {
    //Do nothing; no user input can be accepted at this stage
  }
}