import { prompts } from "../../schemas/mcprompts.js";
import { objectiveContextGatheringZodSchema } from "../../schemas/objectiveContextGatheringSchema.js";
import { productContextGatheringZodSchema } from "../../schemas/productContextGatheringSchema.js";
import { metricAssetGenerationZodSchema } from "../../schemas/metricAssetGenerationSchema.js";
import {
  ObjectiveO as ObjectiveContext,
  ProductContextO as ProductContext,
  MetricO as Metric,
  Contexts,
  Assets
} from "@enthalpy/shared";
import { Agent, WorkflowNode, WorkflowContext } from "./core.js";
import { ContextGatheringWorkflow } from "./contextgatheringworkflow.js";
import { AssetGenerationWorkflow } from "./assetgenerationworkflow.js";

class AgentService {
  agentMap: Map<string,Agent<any>>;

  public constructor() {
    this.agentMap = new Map<string,Agent<any>>();
    this.initiateAgents();
  }

  initiateAgents() {
    this.agentMap.set("mc", new MCAgent());
  }

  runAgentWorkflow(agentName: string) {
    this.agentMap.get(agentName)?.runAgentWorkflow();
  }

  public ingestUserInput(msg: any) {
    if(msg.agentName && this.agentMap.get(msg.agentName)) {
      this.agentMap.get(msg.agentName)?.ingestUserInput(msg);
    } else if (msg.agentName) {
      console.log("No ${msg.agent_name} agent available, doing nothing.");
    } else {
      console.log("No agent name provided to AgentService, doing nothing.");
    }
  }

  //Callback independent of the user input cb needed to handle independent output from the agent
  public registerUserOutputCallback(agentName: string, cb: (msg: string) => Promise<void>) {
    this.agentMap.get(agentName)?.registerUserOutputCallback(cb);
  }

  public registerFinalisedProductContextCallback(
    agentName: string, 
    cb: (productContexts: Contexts<ProductContext>) => Promise<void>) {
    this.agentMap.get(agentName)?.registerFinalisedProductContextCallback(cb);
  }

  public registerFinalisedObjContextCallback(
    agentName: string, 
    cb: (productContexts: Contexts<ObjectiveContext>) => Promise<void>) {
    this.agentMap.get(agentName)?.registerFinalisedObjContextCallback(cb);
  }

  public registerFinalisedMetricsCallback(
    agentName: string, 
    cb: (metrics: Assets<Metric>) => Promise<void>) {
    this.agentMap.get(agentName)?.registerFinalisedMetricsCallback(cb);
  }
}

class MCAgent extends Agent<void> { 
  introNode: SimpleOutputNode;
  objNode: ContextGatheringWorkflow<ObjectiveContext>;
  prdCtxNode: ContextGatheringWorkflow<ProductContext>;
  metricsGenNode: AssetGenerationWorkflow<Metric>;
  productCtxCb?: (productContexts: Contexts<ProductContext>) => Promise<void>;
  objCtxCb?: (productContexts: Contexts<ObjectiveContext>) => Promise<void>;
  meticsAssetCb?: (metrics: Assets<Metric>) => Promise<void>;

  constructor() {
    super("mc",[
      prompts["base-workflow-instruction"],
      prompts["model-message-schema"]
    ]);
    this.introNode = MCAgent.createIntroNode();
    this.objNode = MCAgent.createObjectiveGatheringNode(this.introNode);
    this.prdCtxNode = MCAgent.createProductGatheringNode(this.objNode);
    this.metricsGenNode = MCAgent.createMetricsGenerationNode(this.prdCtxNode);
    this.workNodes.push(this.introNode);
    this.workNodes.push(this.objNode);
    this.workNodes.push(this.prdCtxNode);
    this.workNodes.push(this.metricsGenNode);
  }

  static createIntroNode(): SimpleOutputNode {
    let introNode = new SimpleOutputNode("project-intro", prompts["project-intro-prompt"]);
    return introNode;
  }

  static createObjectiveGatheringNode(parent: WorkflowNode): 
  ContextGatheringWorkflow<ObjectiveContext> {
    let objNode = new ContextGatheringWorkflow<ObjectiveContext>(
      "objective-gathering",objectiveContextGatheringZodSchema,parent);
    return objNode;
  }

  static createProductGatheringNode(parent: WorkflowNode): 
  ContextGatheringWorkflow<ProductContext> {
    let prdCtxNode = new ContextGatheringWorkflow<ProductContext>(
      "product-context-gathering",productContextGatheringZodSchema,parent);
    return prdCtxNode;
  }

  static createMetricsGenerationNode(parent: WorkflowNode): 
  AssetGenerationWorkflow<Metric> {
    let metricsGenNode = new AssetGenerationWorkflow<Metric>(
      "metrics-generation",metricAssetGenerationZodSchema,parent);
    return metricsGenNode;
  }

  runAgentWorkflow(): Promise<void> {
    this.currentNode = this.introNode;
    return this.introNode.run(this.ctx).then(async () => {
      this.currentNode = this.objNode;
      let finalisedObj = await this.objNode.run(this.ctx);
      this.objCtxCb?.(finalisedObj);
      return finalisedObj;
    }).then(async (finalisedObj: Contexts<ObjectiveContext>) => {
      this.currentNode = this.prdCtxNode;
      let finalisedPrdCtx = await this.prdCtxNode.run(this.ctx);
      this.productCtxCb?.(finalisedPrdCtx);
      return finalisedPrdCtx;
    }).then(async (finalisedPrdCtx: Contexts<ProductContext>) => {
      this.currentNode = this.metricsGenNode;
      let finalisedMetrics = await this.metricsGenNode.run(this.ctx);
      this.meticsAssetCb?.(finalisedMetrics);
      // return finalisedMetrics;
      return Promise.resolve();
    }).catch(err => {
      console.log(`Agent workflow error: ${err}`);
      return Promise.reject(new Error(`Agent workflow error: ${err}`));
    });
  }

  registerFinalisedProductContextCallback(
    cb: (productContexts: Contexts<ProductContext>) => Promise<void>) {
      this.productCtxCb = cb;
  }

  registerFinalisedObjContextCallback(
    cb: (productContexts: Contexts<ObjectiveContext>) => Promise<void>) {
      this.objCtxCb = cb;
  }

  registerFinalisedMetricsCallback(
    cb: (metrics: Assets<Metric>) => Promise<void>) {
      this.meticsAssetCb = cb;
  }
}

class SimpleOutputNode extends WorkflowNode {
  output: string = "";

  constructor(name: string,output: string,parent?: WorkflowNode) {
    super(name, parent);
    this.output = output;
  }

  async run(ctx: WorkflowContext): Promise<any> {
    if(this.state !== "idle") {
      console.log(`SimpleOutputNode ${this.name} not in idle state, doing nothing for run call`);
      return Promise.reject(`SimpleOutputNode ${this.name} not in idle state, doing nothing for run call`);
    }
    if(ctx.userOutputCb) {
      await ctx.userOutputCb(this.output);
    }
    //Add the output provided to the project message,
    // so that it can be traced later by the LLM if needed
    ctx.messages.push({
      role: "user",
      contents: [{
        type: "output_to_user",
        content: this.output
      }]
    });
    this.state = "closed";
    return Promise.resolve();
  }

  ingestUserInput(ctx: WorkflowContext, msg: string) {
    //Doing nothing
  }
}

export { AgentService };
