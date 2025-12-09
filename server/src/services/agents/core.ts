import {
  ObjectiveO as ObjectiveContext,
  ProductContextO as ProductContext,
  MetricO as Metric,
  Contexts,
  Assets,
  ModelMessage
} from "@enthalpy/shared";
import { ClaudeIntf, LLMIntf } from "./modelProvider.js";
import { prompts } from "../../schemas/mcprompts.js";

type WorkflowNodeState = "waiting_on_llm" |
                          "waiting_on_user" |
                          "idle" |
                          "closed";

class WorkflowContext {
  messages: Array<ModelMessage> = new Array<ModelMessage>();
  model?: LLMIntf;
  userOutputCb?: (msg: string) => Promise<void>;

  constructor() {
    this.model = new ClaudeIntf();
  }

  addContextOnWorkflows(workflowInstructions: any[]) {
    this.messages.push(
      {
        role: "user",
        contents: [
          {
            type: "workflow_instruction",
            content: prompts["base-workflow-instruction"]
          },
          {
            type: "workflow_instruction",
            content: prompts["model-message-schema"]
          }
        ]
      }
    )
  }
}

abstract class WorkflowNode {
  name: string = "";
  state: WorkflowNodeState = "idle";
  //TODO: Workflow nodes should be able to define their own
  // input & output mandates here via some schema - but how??
  children = new Array<WorkflowNode>();
  parent?: WorkflowNode;

  constructor(name: string,parent?: WorkflowNode) {
    this.name = name;
    if(parent) {
      this.parent = parent;
      this.parent.addChild(this);
    }
  }

  public addChild(child: WorkflowNode) {
    this.children.push(child);
  }

  abstract run(state: WorkflowContext): Promise<any>;

  abstract ingestUserInput(ctx: WorkflowContext, msg: string): void;
}

abstract class Agent<T> {
  name: string;
  workNodes = new Array<WorkflowNode>();
  ctx: WorkflowContext;
  currentNode?: WorkflowNode;

  constructor(name: string, workflowInstructions: any[]) {
    this.name = name;
    this.ctx = new WorkflowContext();
    this.ctx.addContextOnWorkflows(workflowInstructions);
  }

  ingestUserInput(msg: string) {
    this.currentNode?.ingestUserInput(this.ctx,msg);
  }

  abstract runAgentWorkflow(): Promise<T>;

  //Callback independent of the user input cb needed to handle independent output from the agent
  registerUserOutputCallback(cb: (msg: string) => Promise<void>) {
    this.ctx.userOutputCb = cb;
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

export { Agent, WorkflowNodeState, WorkflowNode, WorkflowContext };