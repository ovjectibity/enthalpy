import { ClaudeIntf, LLMIntf } from "./modelProvider.js";
import { prompts } from "../contexts/mcprompts.js";
import { objectiveContextGatheringSchema } from "../contexts/objectiveContextGatheringSchema.js";
import { productContextGatheringSchema } from "../contexts/productContextGatheringSchema.js";
import { metricAssetGenerationSchema } from "../contexts/metricAssetGenerationSchema.js";
import Ajv, { JSONSchemaType } from "ajv";
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
  public registerOutputCallback(agentName: string, cb: (msg: string) => Promise<void>) {
    this.agentMap.get(agentName)?.registerUserOutputCallback(cb);
  }

  public registerModelProvidedProductContextCallback(
    agentName: string, 
    cb: (productContexts: Contexts<ProductContext>) => Promise<void>) {
    this.agentMap.get(agentName)?.registerFinaliseProductContext(cb);
  }

  public registerModelProvidedObjectiveCallback(
    agentName: string, 
    cb: (productContexts: Contexts<ObjectiveContext>) => Promise<void>) {
    this.agentMap.get(agentName)?.registerFinaliseObjectiveContext(cb);
  }
}

abstract class Agent {
  name: string;
  workNodes = new Array<WorkflowNode>();
  ctx: WorkflowContext;

  constructor(name: string) {
    this.name = name;
    this.ctx = new WorkflowContext();
  }

  ingestUserInput(msg: string) {
    this.ctx.currentNode?.ingestUserInput(this.ctx,msg);
  }

  public registerUserOutputCallback(cb: (msg: string) => Promise<void>) {
    this.ctx.userOutputCb = cb;
  }

  public registerFinaliseProductContext(cb: (productContexts: Contexts<ProductContext>) => Promise<void>): void {
    //This needs to be handled by the specific agent
  }

  public registerFinaliseObjectiveContext(cb: (productContexts: Contexts<ObjectiveContext>) => Promise<void>): void {
    //This needs to be handled by the specific agent
  }

  abstract initAgentWorkflow(): void;
}

class MCAgent extends Agent { 
  introNode: SimpleOutputNode;
  objNode: ContextGatheringNode<ObjectiveContext>;
  prdCtxNode: ContextGatheringNode<ProductContext>;
  metricsGenNode: AssetGenerationNode<Metric>;

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
    this.ctx.currentNode = this.introNode;
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
    let prdCtxNode = new AssetGenerationNode<Metric>(
      "metrics-generation",schema,parent);
    return prdCtxNode;
  }

  registerFinaliseProductContext(cb: (productContexts: Contexts<ProductContext>) => Promise<void>): void {
    this.prdCtxNode.finaliseContextCb = cb;
  }

  registerFinaliseObjectiveContext(cb: (productContexts: Contexts<ObjectiveContext>) => Promise<void>): void {
    this.objNode.finaliseContextCb = cb;
  }

  initAgentWorkflow() {
    if(this.ctx.currentNode) {
      this.ctx.currentNode.run(this.ctx);
    }
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

  abstract run(state: WorkflowContext): void;

  abstract ingestUserInput(ctx: WorkflowContext, msg: string): void;
}

// This state is responsible for obtaining some context
// Anything asked to the agent at this state basically
// results in the agent should result in it asking for this context
// Context is gathered in some specified order
// Once it is obtained, proceed to the next node by adding it to the context
class ContextGatheringNode<T> extends WorkflowNode {
  neededContextSchema: JSONSchemaType<Contexts<T>>;
  gatheredContext: Contexts<T>;
  schemaValidation: any;
  finaliseContextCb?: (productContexts: Contexts<T>) => Promise<void>;

  constructor(
    name: string, 
    needed: JSONSchemaType<Contexts<T>>, 
    parent?: WorkflowNode,
    finaliseContextCb?: (productContexts: Contexts<T>) => Promise<void>) {
    super(name, parent);
    this.neededContextSchema = needed;
    this.gatheredContext = {
      contexts: []
    };
    const ajv = new Ajv();
    this.schemaValidation = ajv.compile(needed);
    this.finaliseContextCb = finaliseContextCb;
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

  async run(ctx: WorkflowContext) {
    if(this.state !== "idle") {
      console.log(`ContextGatheringNode ${this.name} not in idle state, doing nothing for run call`);
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
      }
    }
  }

  scrapeContext(gatheredContext: any) {
    if(this.schemaValidation(gatheredContext)) {
      let vgc = gatheredContext.contexts as T[];
      console.debug("DEBUG: VGC = ",vgc);
      //TODO: Possible accumulation of duplicates here,
      // Should we override duplicates?
      this.gatheredContext.contexts = this.gatheredContext.contexts.concat(vgc);
    } else {
      console.log("Schema validation did not pass when trying to scrape LLM provided gathered context");
    }
  }

  async processLLMOutput(ctx: WorkflowContext, msg: ModelMessage) {
    //TODO: What to do for the other states
    // msg here should conform to the ModelMessage schema.
    //Check the workflow node state here before proceeding
    // If the user has provided the needed context, set it up
    console.log("Got LLM output: ", msg);
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
              ctx.gatheredContexts.push({
                nodeType: "ContextGatheringNode",
                nodeName: this.name,
                context: this.gatheredContext
              });
              if(this.finaliseContextCb) {
                console.log(`Finalising gathered context for the ${this.name} node`);
                this.finaliseContextCb(this.gatheredContext);
              }
              if(this.children.length > 0) {
                ctx.currentNode = this.children[0];
                this.children[0].run(ctx);
              }
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
  generatedAssets: Assets<T>;
  neededAssetsSchemaValidator: any;
  finaliseGeneratedAssetCb?: (asset: Assets<T>) => Promise<void>;

  constructor(name: string,
    needed: JSONSchemaType<Assets<T>>,
    dependentContexts: any,
    parent?: WorkflowNode) {
    super(name,parent);
    this.neededAssetsSchema = needed;
    this.generatedAssets = {
      assets: []
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
        {
          workflowContent: {
            content: prompts["assets-gen-available-context-meta-instruction"],
            type: "workflow_instruction"
          }
        },
        {
          workflowContent: {
            content: JSON.stringify(this.dependentContexts),
            type: "workflow_instruction"
          }
        },
      ]
    });
  }

  scrapeAssets(generatedAssets: any) {
    if(this.neededAssetsSchemaValidator(generatedAssets)) {
      let vga = generatedAssets.assets as Assets<T>;
      //TODO: Possible accumulation of duplicates here,
      // Should we override duplicates?
      this.generatedAssets.assets.push(...vga.assets);
    } else {
      console.log("Error: Schema validation did not pass when trying to scrape LLM provided generated assets");
    }
  }

  async run(ctx: WorkflowContext) {
    if(this.state !== "idle") {
      console.log(`AssetGenerationNode ${this.name} not in idle state, doing nothing for run call`);
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
          } else if(m.workflowContent && m.workflowContent.type === "workflow_instruction") {
            //TODO: The stop condition is expected to be the last block, add this to prompt
            let stopCondition = JSON.parse(m.workflowContent.content);
            if(stopCondition.stop && stopCondition.stopReason) {
              this.state = "closed";
              //TODO: Handle changing of active node here
              // Surface gathered context + record stopReason
              console.log(`Exiting the AssetGenerationNode ${this.name} due to ${stopCondition.stopReason}`);
              ctx.generatedAssets.push({
                nodeType: "AssetGenerationNode",
                nodeName: this.name,
                asset: this.generatedAssets
              });
              if(this.finaliseGeneratedAssetCb) {
                this.finaliseGeneratedAssetCb(this.generatedAssets);
              }
              //TODO: Implement branching workflows:
              if(this.children.length > 0) {
                ctx.currentNode = this.children[0];
                this.children[0].run(ctx);
              }
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

  async run(ctx: WorkflowContext) {
    if(this.state !== "idle") {
      console.log("SimpleOutputNode ${this.name} not in idle state, doing nothing for run call");
      return;
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
    if(this.children.length > 0) {
      console.log("Running the next node after the intro node: ", this.children[0].name);
      //Just run for the first next node
      ctx.currentNode = this.children[0];
      this.children[0].run(ctx);
    }
  }

  ingestUserInput(ctx: WorkflowContext, msg: string) {
    //Doing nothing
  }
}

class WorkflowContext {
  systemPrompt: string = "";
  messages: Array<ModelMessage> = new Array<ModelMessage>();
  numIterations: number = 5;
  model?: LLMIntf;
  userOutputCb?: (msg: string) => Promise<void>;
  currentNode?: WorkflowNode;
  gatheredContexts: {
    nodeType: string,
    nodeName: string,
    context: any
    }[] = [];
  generatedAssets: {
    nodeType: string,
    nodeName: string,
    asset: any
    }[] = [];

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
