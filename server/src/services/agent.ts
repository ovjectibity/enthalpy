import { ClaudeIntf, LLMIntf } from "./modelProvider.js";
import { prompts } from "../contexts/mcprompts.js";
import { objectiveContextGatheringSchema } from "../contexts/objectiveContextGatheringSchema.js";
import { productContextGatheringSchema } from "../contexts/productContextGatheringSchema.js";
import { metricAssetGenerationSchema } from "../contexts/metricAssetGenerationSchema.js";
import Ajv, { JSONSchemaType } from "ajv";
import util from 'util';
import {
  ObjectiveO as ObjectiveContext,
  ProductContextO as ProductContext,
  MetricO as Metric,
  Contexts,
  Assets
} from "@enthalpy/shared";

type WorkflowNodeState = "waiting_on_llm" |
                          "waiting_on_user" |
                          "idle" |
                          "closed";

class AgentService {
  agentMap: Map<string,Agent>;

  public constructor() {
    this.agentMap = new Map<string,Agent>();
    this.initiateAgents();
  }

  initiateAgents() {
    this.agentMap.set("mc", new MCAgent());
  }

  initAgentWorkflow(agentName: string) {
    this.agentMap.get(agentName)?.initAgentWorkflow();
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

abstract class Agent {
  name: string;
  workNodes = new Array<WorkflowNode>();
  ctx: WorkflowContext;
  currentNode?: WorkflowNode;

  constructor(name: string) {
    this.name = name;
    this.ctx = new WorkflowContext();
  }

  ingestUserInput(msg: string) {
    this.currentNode?.ingestUserInput(this.ctx,msg);
  }

  abstract initAgentWorkflow(): void;

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

class MCAgent extends Agent { 
  introNode: SimpleOutputNode;
  objNode: ContextGatheringNode<ObjectiveContext>;
  prdCtxNode: ContextGatheringNode<ProductContext>;
  metricsGenNode: AssetGenerationNode<Metric>;
  productCtxCb?: (productContexts: Contexts<ProductContext>) => Promise<void>;
  objCtxCb?: (productContexts: Contexts<ObjectiveContext>) => Promise<void>;
  meticsAssetCb?: (metrics: Assets<Metric>) => Promise<void>;

  constructor() {
    super("mc");
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
  ContextGatheringNode<ObjectiveContext> {
    const schema: JSONSchemaType<Contexts<ObjectiveContext>> = objectiveContextGatheringSchema;
    let objNode = new ContextGatheringNode<ObjectiveContext>(
      "objective-gathering",schema,parent);
    return objNode;
  }

  static createProductGatheringNode(parent: WorkflowNode): 
  ContextGatheringNode<ProductContext> {
    const schema: JSONSchemaType<Contexts<ProductContext>> = productContextGatheringSchema;
    let prdCtxNode = new ContextGatheringNode<ProductContext>(
      "product-context-gathering",schema,parent);
    return prdCtxNode;
  }

  static createMetricsGenerationNode(parent: WorkflowNode): 
  AssetGenerationNode<Metric> {
    const schema: JSONSchemaType<Assets<Metric>> = metricAssetGenerationSchema;
    let metricsGenNode = new AssetGenerationNode<Metric>(
      "metrics-generation",schema,parent);
    return metricsGenNode;
  }

  initAgentWorkflow() {
    this.currentNode = this.introNode;
    this.introNode.run(this.ctx).then(async () => {
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
      return finalisedMetrics;
    }).catch(err => {
      console.log(`Agent workflow error: ${err}`);
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

// This state is responsible for obtaining some context
// Anything asked to the agent at this state basically
// results in the agent should result in it asking for this context
// Context is gathered in some specified order
// Once it is obtained, proceed to the next node by adding it to the context
class ContextGatheringNode<T> extends WorkflowNode {
  neededContextSchema: JSONSchemaType<Contexts<T>>;
  gatheredContext: {
    actual: Contexts<T>,
    finalise?: (actual: Contexts<T>) => void;
    abort?: (err: any) => void;
  };
  schemaValidation: any;
  

  constructor(
    name: string, 
    needed: JSONSchemaType<Contexts<T>>, 
    parent?: WorkflowNode) {
    super(name, parent);
    this.neededContextSchema = needed;
    this.gatheredContext = {
      actual: {
        contexts: []
      }
    };
    const ajv = new Ajv();
    this.schemaValidation = ajv.compile(needed);
  }

  updateMessagesContext(ctx: WorkflowContext) {
    // 1. keep the system prompt, message history & the LLM provider
    // 2. Update with some workflow context telling
    // the llm about the context gathering process
    ctx.messages.push({
      role: "user",
      messages: [
        {
          workflowContent: {
            content: prompts["context-gathering-meta-instruction"],
            type: "workflow_instruction"
          }
        },
        {
          workflowContent: {
            content: JSON.stringify(this.neededContextSchema),
            type: "workflow_instruction"
          }
        }
      ]
    });
  }

  async run(ctx: WorkflowContext): Promise<Contexts<T>> {
    if(this.state !== "idle") {
      console.log(`ContextGatheringNode ${this.name} not in idle state, doing nothing for run call`);
      return Promise.reject(new Error(`ContextGatheringNode ${this.name} not in idle state`));
    } else {
      console.log(`Running the ContextGatheringNode ${this.name}`);
      //Update the context before the process
      this.updateMessagesContext(ctx);
      //Trigger a pre-defined response here by asking the LLM to summarise it.
      // TODO: This can perhaps be optimised via some automated way of create
      // the user output without LLM call
      ctx.messages.push({
        role: "user",
        messages: [{
          workflowContent: {
            content: prompts["prompt-user-to-gather-context-from-user"],
            type: "workflow_instruction"
          }
        }]
      });
      if(!ctx.model) {
        return Promise.reject(new Error("No model available for the ContextGatheringNode."));
      } else {
        //TODO: LLM provider call needed here
        // Once the output from the user is available,
        // TODO: the LLM should be able to help this node proceed (even this can be perhaps optimised)
        this.state = "waiting_on_llm";
        let modelResponse = await ctx.model?.input(ctx.messages);
        await this.processLLMOutput(ctx, modelResponse);
        return new Promise((res,rej) => {
          this.gatheredContext.finalise = res;
          this.gatheredContext.abort = rej;
        });
      }
    }
  }

  scrapeContext(gatheredContext: any) {
    if(this.schemaValidation(gatheredContext)) {
      let vgc = gatheredContext.contexts as T[];
      console.debug("DEBUG: VGC = ",vgc);
      //TODO: Possible accumulation of duplicates here,
      // Should we override duplicates?
      this.gatheredContext.actual.contexts = this.gatheredContext.actual.contexts.concat(vgc);
    } else {
      console.log("Schema validation did not pass when trying to scrape LLM provided gathered context");
    }
  }

  async processLLMOutput(ctx: WorkflowContext, msg: ModelMessage) {
    //TODO: What to do for the other states
    // msg here should conform to the ModelMessage schema.
    //Check the workflow node state here before proceeding
    // If the user has provided the needed context, set it up
    console.log("Got LLM output: ", util.inspect(msg, { depth: null, colors: true }));
    if(this.state === "idle") {
      //TODO: Do nothing, but something might be wrong here
    } else if(this.state === "waiting_on_user") {
      //TODO: this shouldn't happen, throw error
      throw new Error("Waiting on user in ContextGatheringNode ${this.name}.");
    } else if(this.state === "waiting_on_llm") {
      //TODO: Parse the msg here to see if any
      // context has been added by the user
      // or if the LLM wants this node to stop or
      // if any message needs to be surfaced to the user
      console.log("Processing LLM output while waiting on LLM");
      if(msg.role && msg.role === "assistant" && msg.messages) {
        ctx.messages.push(msg);
        for(const m of msg.messages) {
          if(m.workflowContent && m.workflowContent.type === "workflow_context") {
            //Add to the context if available
            //TODO: Validation of provided context here
            try {
              let gatheredContext = JSON.parse(m.workflowContent.content);
              this.scrapeContext(gatheredContext);
              //TODO: Add context items to the DB
            } catch(error) {
              console.log("Failure when processing the LLM gathered context",error);
            }
          }
          if(m.workflowContent && m.workflowContent.type === "workflow_instruction") {
            //TODO: The stop condition is expected to be the last block, add this to prompt
            let stopCondition = JSON.parse(m.workflowContent.content);
            if(stopCondition.stop && stopCondition.stopReason) {
              this.state = "closed";
              //TODO: Handle changing of active node here
              // Surface gathered context + record stopReason
              console.log(`Exiting the ContextGatheringNode ${this.name} due to ${stopCondition.stopReason}`);
              if(this.gatheredContext.finalise)
                this.gatheredContext.finalise(this.gatheredContext.actual);
            }
          }
          if(m.userContent && ctx.userOutputCb) {
            //Surface message to the user:
            await ctx.userOutputCb(m.userContent);
            //Assume that if a message is surfaced to the user
            //then we're now waiting on them
            this.state = "waiting_on_user"
          }
        }
      }
    } else if(this.state === "closed") {
      //Do nothing
    }
  }

  async ingestUserInput(ctx: WorkflowContext, msg: string) {
    //TODO: What to do for the other states?
    //Check the workflow node state here before proceeding
    // Pass it onto the LLM
    if(this.state === "idle") {
      //TODO: Do nothing, but something might be wrong here
    } else if(this.state === "waiting_on_user") {
      ctx.messages.push({
        role: "user",
        messages: [{
          userContent: msg
        }]
      });
      if(!ctx.model) {
        throw new Error("No model available for the ContextGatheringNode.");
      } else {
        //TODO: LLM provider call needed here
        // Once the output from the user is available,
        // TODO: the LLM should be able to help this node proceed (even this can be perhaps optimised)
        this.state = "waiting_on_llm";
        let modelResponse = await ctx.model?.input(ctx.messages);
        await this.processLLMOutput(ctx, modelResponse);
      }
    } else if(this.state === "waiting_on_llm") {
      //TODO: interrupt LLM in case of user input
    } else if(this.state === "closed") {
      //Do nothing
    }
  }
}

class AssetGenerationNode<T> extends WorkflowNode {
  dependentContexts: any;
  neededAssetsSchema: JSONSchemaType<Assets<T>>;
  generatedAssets: {
    actual: Assets<T>,
    finalise?: (actual: Assets<T>) => void,
    abort?: (err: any) => void
  }
  neededAssetsSchemaValidator: any;

  constructor(name: string,
    needed: JSONSchemaType<Assets<T>>,
    parent?: WorkflowNode,
    dependentContexts?: any) {
    super(name,parent);
    this.neededAssetsSchema = needed;
    this.generatedAssets = {
      actual: {
        assets: []
      }
    };
    this.dependentContexts = dependentContexts;
    const ajv = new Ajv();
    this.neededAssetsSchemaValidator = ajv.compile(needed);
  }

  updateMessagesContext(ctx: WorkflowContext) {
    ctx.messages.push({
      role: "user",
      messages: [
        {
          workflowContent: {
            content: prompts["assets-gen-meta-instruction"],
            type: "workflow_instruction"
          }
        },
        {
          workflowContent: {
            content: JSON.stringify(this.neededAssetsSchema),
            type: "workflow_instruction"
          }
        },
        // {
        //   workflowContent: {
        //     content: prompts["assets-gen-available-context-meta-instruction"],
        //     type: "workflow_instruction"
        //   }
        // },
        // {
        //   workflowContent: {
        //     content: JSON.stringify(this.dependentContexts),
        //     type: "workflow_instruction"
        //   }
        // },
      ]
    });
  }

  scrapeAssets(generatedAssets: any) {
    if(this.neededAssetsSchemaValidator(generatedAssets)) {
      let vga = generatedAssets as Assets<T>;
      console.debug(`Scraping the following assets: ${util.inspect(generatedAssets, false, null, true)}`);
      //TODO: Possible accumulation of duplicates here,
      // Should we override duplicates?
      this.generatedAssets.actual.assets.push(...vga.assets);
    } else {
      console.log("Error: Schema validation did not pass when trying to scrape LLM provided generated assets");
    }
  }

  async run(ctx: WorkflowContext): Promise<Assets<T>> {
    if(this.state !== "idle") {
      console.log(`AssetGenerationNode ${this.name} not in idle state, doing nothing for run call`);
      return Promise.reject(new Error(`AssetGenerationNode ${this.name} not in idle state`));
    } else {
      console.log(`Running the AssetGenerationNode ${this.name}`);
      //Update the context before the process
      this.updateMessagesContext(ctx);
      //Trigger a pre-defined response here by asking the LLM to summarise it.
      // TODO: This can perhaps be optimised via some automated way of create
      // the user output without LLM call
      ctx.messages.push({
        role: "user",
        messages: [{
          workflowContent: {
            content: prompts["prompt-asset-gen"],
            type: "workflow_instruction"
          }
        }]
      });
      if(!ctx.model) {
        return Promise.reject(new Error("No model available for the AssetGenerationNode."));
      } else {
        //TODO: LLM provider call needed here
        // Once the output from the user is available,
        // TODO: the LLM should be able to help this node proceed (even this can be perhaps optimised)
        this.state = "waiting_on_llm";
        let modelResponse = await ctx.model?.input(ctx.messages);
        await this.processLLMOutput(ctx, modelResponse);
        return new Promise((res,rej) => {
          this.generatedAssets.finalise = res;
          this.generatedAssets.abort = rej;
        });
      }
    }
  }

  async processLLMOutput(ctx: WorkflowContext, msg: ModelMessage) {
    //TODO: What to do for the other states
    if(this.state === "idle") {
      //TODO: Do nothing, but something might be wrong here
    } else if(this.state === "waiting_on_user") {
      //TODO: this shouldn't happen, throw error
      throw new Error("Waiting on user in ContextGatheringNode ${this.name}.");
    } else if(this.state === "waiting_on_llm") {
      if(msg.role && msg.role === "assistant" && msg.messages) {
        ctx.messages.push(msg);
        for(let m of msg.messages) {
          if(m.workflowContent && m.workflowContent.type === "workflow_gen_asset") {
            //Add to the context if available
            //TODO: Validation of provided context here
            try {
              let generatedAssets = JSON.parse(m.workflowContent.content);
              this.scrapeAssets(generatedAssets);
            } catch(error) {
              console.log("Failure when processing the LLM generated assets",error);
            }
          } 
          if(m.workflowContent && m.workflowContent.type === "workflow_instruction") {
            //TODO: The stop condition is expected to be the last block, add this to prompt
            let stopCondition = JSON.parse(m.workflowContent.content);
            if(stopCondition.stop && stopCondition.stopReason) {
              this.state = "closed";
              //TODO: Handle changing of active node here
              // Surface gathered context + record stopReason
              console.log(`Exiting the AssetGenerationNode ${this.name} due to ${stopCondition.stopReason}`);
              if(this.generatedAssets.finalise)
                this.generatedAssets.finalise(this.generatedAssets.actual);
            }
          }
          if(m.userContent && ctx.userOutputCb) {
            //Surface message to the user:
             await ctx.userOutputCb(m.userContent);
            //Assume that if a message is surfaced to the user
            //then we're waiting on them
            this.state = "waiting_on_user"
          }
        }
      }
    } else if(this.state === "closed") {
      //Do nothing
    }
  }

  async ingestUserInput(ctx: WorkflowContext, msg: string) {
    //TODO: What to do for the other states?
    if(this.state === "idle") {
      //TODO: Do nothing, but something might be wrong here
    } else if(this.state === "waiting_on_user") {
      ctx.messages.push({
        role: "user",
        messages: [{
          userContent: msg
        }]
      });
      if(!ctx.model) {
        throw new Error("No model available for the ContextGatheringNode.");
      } else {
        this.state = "waiting_on_llm";
        let modelResponse = await ctx.model?.input(ctx.messages);
        await this.processLLMOutput(ctx, modelResponse);
      }
    } else if(this.state === "waiting_on_llm") {
      //TODO: interrupt LLM in case of user input
    } else if(this.state === "closed") {
      //Do nothing
    }
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
      messages: [{
        workflowContent: {
          content: this.output,
          type: "output_to_user"
        }
      }]
    });
    this.state = "closed";
    return Promise.resolve();
  }

  ingestUserInput(ctx: WorkflowContext, msg: string) {
    //Doing nothing
  }
}

class WorkflowContext {
  messages: Array<ModelMessage> = new Array<ModelMessage>();
  model?: LLMIntf;
  userOutputCb?: (msg: string) => Promise<void>;

  constructor() {
    this.model = new ClaudeIntf();
    //Add base instructions
    this.addContextOnWorkflows();
  }

  addContextOnWorkflows() {
    this.messages.push(
      {
        role: "user",
        messages: [
          {
            workflowContent: {
              content: prompts["base-workflow-instruction"],
              type: "workflow_instruction"
            }
          },
          {
            workflowContent: {
              content: prompts["model-message-schema"],
              type: "workflow_instruction"
            }
          }
        ]
      }
    )
  }
}

// Same schema to be used for both input to the LLM
// and for the output the LLM generates
interface ModelMessage {
  role: "user" | "assistant";
  messages: {
      //TODO: Extra info here as a JSON??
      // TODO: Rich text support
      userContent?: string,
      workflowContent?: {
        type: "output_to_user" | "workflow_context" |
              "workflow_instruction" | "workflow_gen_asset",
        // TODO: Rich text support
        // TODO: Add further structure here, to be handled by the provider.
        content: string
      }
    }[]
};

export {AgentService, ModelMessage};
