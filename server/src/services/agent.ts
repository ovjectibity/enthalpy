import { ClaudeIntf, LLMIntf } from "./modelProvider.js";
// Workflows are defined by 2 loops -
// L0 loop - workflow progress nodes, with each having a specific end output
// L1 loop - with multiple LLM iterations towards achieving that output
import { prompts } from "../prompts/mcprompts.js";

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

  initAgentWorkflow() {
    if(this.ctx.currentNode) {
      this.ctx.currentNode.run(this.ctx);
    }
  }
}

class MCAgent extends Agent {
  constructor() {
    super("mc");
    let introNode = MCAgent.createIntroNode();
    let objNode = MCAgent.createObjectiveGatheringNode(introNode);
    this.workNodes.push(introNode);
    this.workNodes.push(objNode);
    this.ctx.currentNode = introNode;
  }

  static createIntroNode(): WorkflowNode {
    let introNode = new SimpleOutputNode("intro", prompts["intro-prompt"]);
    return introNode;
  }

  static createObjectiveGatheringNode(parent: WorkflowNode): WorkflowNode {
    let objNode = new ContextGatheringNode("objective-gathering",[{
      contextName: "objective",
      contextContext: prompts["objective-gathering-context"],
      allowedInput: new Set(["string"])
    }],parent);
    return objNode;
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

  ingestUserInput(ctx: WorkflowContext, msg: string) {
  };
}

// This state is responsible for obtaining some context
// Anything asked to the agent at this state basically
// results in the agent should result in it asking for this context
// Context is gathered in some specified order
// Once it is obtained, proceed to the next node by adding it to the context
class ContextGatheringNode extends WorkflowNode {
  neededContext: ContextSchema[];
  gatheredContext: any;

  constructor(name: string,needed: ContextSchema[], parent?: WorkflowNode) {
    super(name, parent);
    this.neededContext = needed;
    this.gatheredContext = {};
  }

  updateContext(ctx: WorkflowContext) {
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
            //TODO: Add the extra instruction on the schema here
            content: JSON.stringify(this.neededContext),
            type: "workflow_instruction"
          }
        }
      ]
    });
  }

  async run(ctx: WorkflowContext) {
    if(this.state !== "idle") {
      console.log("ContextGatheringNode ${this.name} not in idle state, doing nothing for run call");
    } else {
      //Update the context before the process
      this.updateContext(ctx);
      //Trigger a pre-defined response here by asking the LLM to summarise it.
      // TODO: This can perhaps be optimised via some automated way of create
      // the user output without LLM call
      ctx.messages.push({
        role: "user",
        messages: [{
          workflowContent: {
            //TODO: this prompt should also include the format in which the output is to be provided
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
    this.neededContext.forEach(nc => {
      if(gatheredContext[nc.contextName]) {
        this.gatheredContext[nc.contextName] = gatheredContext[nc.contextName];
      }
    })
  }

  async processLLMOutput(ctx: WorkflowContext, msg: ModelMessage) {
    //TODO: What to do for the other states
    // msg here should conform to the ModelMessage schema.
    //Check the workflow node state here before proceeding
    // If the user has provided the needed context, set it up
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
      if(msg.role && msg.role === "assistant" && msg.messages) {
        ctx.messages.push(msg);
        for(let m of msg.messages) {
          if(m.workflowContent && m.workflowContent.type === "workflow_context") {
            //Add to the context if available
            //TODO: Validation of provided context here
            try {
              let gatheredContext = JSON.parse(m.workflowContent.content);
              this.scrapeContext(gatheredContext);
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
              console.log("Exiting the ContextGatheringNode ${this.name} due to ${stopCondition.stopReason}");
              ctx.gatheredContext.push({
                nodeType: "ContextGatheringNode",
                nodeName: this.name,
                context: this.gatheredContext
              });
              if(this.children.length > 0) {
                ctx.currentNode = this.children[0];
                this.children[0].run(ctx);
              }
            }
          }
          if(m.userContent && ctx.userOutputCb) {
            //Surface message to the user:
             await ctx.userOutputCb(m.userContent);
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
}

class WorkflowContext {
  systemPrompt: string = "";
  messages: Array<ModelMessage> = new Array<ModelMessage>();
  numIterations: number = 5;
  model?: LLMIntf;
  userOutputCb?: (msg: string) => Promise<void>;
  currentNode?: WorkflowNode;
  gatheredContext: {
    nodeType: string,
    nodeName: string,
    context: any
    }[] = [];

  constructor() {
    this.model = new ClaudeIntf();
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
        type: "output_to_user" | "workflow_context" | "workflow_instruction",
        // TODO: Rich text support
        // TODO: Add further structure here, to be handled by the provider.
        content: string
      }
    }[]
};

interface ContextSchema {
  //Objective, documents,
  // Type, string OR documents
  contextName: string,
  contextContext: string,
  allowedInput: Set<"string" | "pdf" | "doc" | "png" | "jpg">
}

export {AgentService, ModelMessage};