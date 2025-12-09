import { prompts } from "../../schemas/mcprompts.js";
import { objectiveContextGatheringZodSchema } from "../../schemas/objectiveContextGatheringSchema.js";
import { productContextGatheringZodSchema } from "../../schemas/productContextGatheringSchema.js";
import { metricAssetGenerationZodSchema } from "../../schemas/metricAssetGenerationSchema.js";
import util from 'util';
import { z } from 'zod';
import {
  ObjectiveO as ObjectiveContext,
  ProductContextO as ProductContext,
  MetricO as Metric,
  Contexts,
  Assets,
  ModelMessage
} from "@enthalpy/shared";
import { Agent, WorkflowNode, WorkflowContext } from "./core.js";

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
  objNode: ContextGatheringNode<ObjectiveContext>;
  prdCtxNode: ContextGatheringNode<ProductContext>;
  metricsGenNode: AssetGenerationNode<Metric>;
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
  ContextGatheringNode<ObjectiveContext> {
    let objNode = new ContextGatheringNode<ObjectiveContext>(
      "objective-gathering",objectiveContextGatheringZodSchema,parent);
    return objNode;
  }

  static createProductGatheringNode(parent: WorkflowNode): 
  ContextGatheringNode<ProductContext> {
    let prdCtxNode = new ContextGatheringNode<ProductContext>(
      "product-context-gathering",productContextGatheringZodSchema,parent);
    return prdCtxNode;
  }

  static createMetricsGenerationNode(parent: WorkflowNode): 
  AssetGenerationNode<Metric> {
    let metricsGenNode = new AssetGenerationNode<Metric>(
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

// This state is responsible for obtaining some context
// Anything asked to the agent at this state basically
// results in the agent should result in it asking for this context
// Context is gathered in some specified order
// Once it is obtained, proceed to the next node by adding it to the context
class ContextGatheringNode<T> extends WorkflowNode {
  neededContextSchema: any;
  gatheredContext: {
    actual: Contexts<T>,
    finalise?: (actual: Contexts<T>) => void;
    abort?: (err: any) => void;
  };
  
  constructor(
    name: string, 
    neededContextSchema: any, 
    parent?: WorkflowNode) {
    super(name, parent);
    this.gatheredContext = {
      actual: {
        contexts: []
      }
    };
    this.neededContextSchema = neededContextSchema;
  }

  updateMessagesContext(ctx: WorkflowContext) {
    // 1. keep the system prompt, message history & the LLM provider
    // 2. Update with some workflow context telling
    // the llm about the context gathering process
    ctx.messages.push({
      role: "user",
      contents: [
        {
          type: "workflow_instruction",
          content: prompts["context-gathering-meta-instruction"],
        },
        {
          type: "workflow_instruction",
          content: JSON.stringify(z.toJSONSchema(this.neededContextSchema)),
        },
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
        contents: [{
          type: "workflow_instruction",
          content: prompts["prompt-user-to-gather-context-from-user"]
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
    let parsedContext = this.neededContextSchema.safeParse(gatheredContext);
    if(parsedContext.success) {
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
      if(msg.role && msg.role === "assistant" && msg.contents) {
        ctx.messages.push(msg);
        for(const m of msg.contents) {
          if(m.type === "workflow_context") {
            //Add to the context if available
            //TODO: Validation of provided context here
            try {
              let gatheredContext = JSON.parse(m.content);
              this.scrapeContext(gatheredContext);
              //TODO: Add context items to the DB
            } catch(error) {
              console.log("Failure when processing the LLM gathered context",error);
            }
          } else if(m.type === "workflow_instruction") {
            //TODO: The stop condition is expected to be the last block, add this to prompt
            let stopCondition = JSON.parse(m.content);
            if(stopCondition.stop && stopCondition.stopReason) {
              this.state = "closed";
              //TODO: Handle changing of active node here
              // Surface gathered context + record stopReason
              console.log(`Exiting the ContextGatheringNode ${this.name} due to ${stopCondition.stopReason}`);
              if(this.gatheredContext.finalise)
                this.gatheredContext.finalise(this.gatheredContext.actual);
            }
          } else if(m.type === "output_to_user" && ctx.userOutputCb) {
            //Surface message to the user:
            await ctx.userOutputCb(m.content);
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
        contents: [{
          type: "input_from_user",
          content: msg
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
  neededAssetsSchema: any;
  generatedAssets: {
    actual: Assets<T>,
    finalise?: (actual: Assets<T>) => void,
    abort?: (err: any) => void
  }

  constructor(name: string,
    neededAssetsSchema: any,
    parent?: WorkflowNode,
    dependentContexts?: any) {
    super(name,parent);
    this.generatedAssets = {
      actual: {
        assets: []
      }
    };
    this.neededAssetsSchema = neededAssetsSchema;
    this.dependentContexts = dependentContexts;
  }

  updateMessagesContext(ctx: WorkflowContext) {
    ctx.messages.push({
      role: "user",
      contents: [
        {
          type: "workflow_instruction",
          content: prompts["assets-gen-meta-instruction"]
        },
        {
          type: "workflow_instruction",
          content: JSON.stringify(z.toJSONSchema(this.neededAssetsSchema))
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
    let parsedAssets = this.neededAssetsSchema.safeParse(generatedAssets);
    if(parsedAssets.success) {
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
        contents: [{
          type: "workflow_instruction",
          content: prompts["prompt-asset-gen"]  
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
      if(msg.role && msg.role === "assistant" && msg.contents) {
        ctx.messages.push(msg);
        for(let m of msg.contents) {
          if(m.type === "workflow_gen_asset") {
            //Add to the context if available
            //TODO: Validation of provided context here
            try {
              let generatedAssets = JSON.parse(m.content);
              this.scrapeAssets(generatedAssets);
            } catch(error) {
              console.log("Failure when processing the LLM generated assets",error);
            }
          } else if(m.type === "workflow_instruction") {
            //TODO: The stop condition is expected to be the last block, add this to prompt
            let stopCondition = JSON.parse(m.content);
            if(stopCondition.stop && stopCondition.stopReason) {
              this.state = "closed";
              //TODO: Handle changing of active node here
              // Surface gathered context + record stopReason
              console.log(`Exiting the AssetGenerationNode ${this.name} due to ${stopCondition.stopReason}`);
              if(this.generatedAssets.finalise)
                this.generatedAssets.finalise(this.generatedAssets.actual);
            }
          } else if(m.type === "output_to_user" && ctx.userOutputCb) {
            //Surface message to the user:
             await ctx.userOutputCb(m.content);
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
        contents: [{
          type: "input_from_user",
          content: msg
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
