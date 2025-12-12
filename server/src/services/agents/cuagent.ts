import { WorkflowNode, WorkflowContext, Agent } from "./core.js";
import {
  ObjectiveO as ObjectiveContext,
  ProductContextO as ProductContext,
  MetricO as Metric,
  Contexts,
  Assets,
  ModelMessage
} from "@enthalpy/shared";
import { computerUseToolInputSchema } from "../../schemas/toolSchemas.js";
import { ComputerUseService } from "../cuservice.js";

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
    this.pathsNode = new Pathways("User journey mapper");
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
  cuService: ComputerUseService;
  finalisedFlow: {
    actual?: FlowGraphNode,
    finalise?: (actual: FlowGraphNode) => void;
    abort?: (err: any) => void;
  }

  constructor(name: string, cuService: ComputerUseService, parent?: WorkflowNode) {
    super(name,parent);
    this.finalisedFlow = {
    }
    this.cuService = cuService;
  }

  addWorkflowContext(state: WorkflowContext) {
    state.messages.push({
        role: "user",
        contents: [
          {
            type: "workflow_instruction",
            content: ""
          }
        ]
      });
  }

  run(state: WorkflowContext): Promise<any> {
    if(this.state === "idle") {
      console.log(`Running the Pathways node ${this.name}`);
      this.addWorkflowContext(state);
      this.state = "waiting_on_llm";
      state.model?.input(state.messages,
        new Map([
        ["computer_use",computerUseToolInputSchema]
      ])).then(
        (modelResponse: ModelMessage) => {
        this.processModelOutput(state, modelResponse);
      });
      return new Promise((res,rej) => {
        this.finalisedFlow.finalise = res;
        this.finalisedFlow.abort = rej;
      });
    } else return Promise.reject(new Error(`WorkflowNode Pathways ${this.name} not in idle state`));
  }

  async processModelOutput(state: WorkflowContext,modelResponse: ModelMessage) {
    if(this.state === "waiting_on_llm" && modelResponse.role === "assistant") {
      for(let content of modelResponse.contents) {
        if(content.type === "tool_use" && content.content.name === "computer_use") {
          if(content.content.name === "computer_use") {
            let screengrab;
            if(content.content.input.action === "right_click") {
              screengrab = this.cuService.performRightClick(content.content.input.x,content.content.input.y);
            } else if(content.content.input.action === "left_click") {
              screengrab = this.cuService.performLeftClick(content.content.input.x,content.content.input.y);
            } else if(content.content.input.action === "type") {
              screengrab = this.cuService.performKeyInput(content.content.input.input);
            } else if(content.content.input.action === "scroll") {
              screengrab = this.cuService.performScroll(content.content.input.x,content.content.input.y);
            } else if(content.content.input.action === "screenshot") {
              screengrab = this.cuService.getScreenshot();
            }
            state.messages.push({
              role: "user",
              contents: [
                {
                  type: "tool_use_result",
                  content: {
                    name: "computer_use",
                    id: content.content.id,
                    screengrab: screengrab
                  }
                }
              ]
            });
            state.model?.input(state.messages,new Map([
              ["computer_use",computerUseToolInputSchema]
            ]));
          }
        } else {
          console.log(`Got unexpected content block from computer use agent ${content.content}`)
        }
      }
    } else {
      console.warn(`Did not find the Pathways node ${this.name} in waiting_on_llm state when running porcessModelOutput`);
    }
  }

  ingestUserInput(ctx: WorkflowContext, msg: string): void {
    //Do nothing; no user input can be accepted at this stage
  }
}