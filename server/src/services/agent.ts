import { ClaudeIntf, LLMProvider } from "./modelProvider";
// Workflows are defined by 2 loops -
// L0 loop - workflow progress nodes, with each having a specific end output
// L1 loop - with multiple LLM iterations towards achieving that output
const prompts = require("../prompts/mcprompts.json");

type WorkflowNodeState = "waiting_on_llm" |
                          "waiting_on_user" |
                          "idle" |
                          "closed";

export class AgentService {
  agentMap: Map<string,Agent>;

  public constructor() {
    this.agentMap = new Map<string,Agent>();
  }

  public initiateAgents() {
    this.agentMap.set("mc", new MCAgent());
  }

  public ingestUserInput(msg: any, cb: (msg: string) => void) {
    if(msg.agent_name && this.agentMap.get(msg.agent_name)) {
      this.agentMap.get(msg.agent_name)?.ingestUserInput(msg);
    } else if (msg.agent_name) {
      console.log("No ${msg.agent_name} agent available, doing nothing.");
    } else {
      console.log("No agent name provided to AgentService, doing nothing.");
    }
  }

  //Callback independent of the user input cb needed to handle independent output from the agent
  public registerOutputCallback(agentName: string, cb: (msg: string) => void) {
    this.agentMap.get(agentName)?.registerUserOutputCallback(cb);
  }
}

class Agent {
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

  public registerUserOutputCallback(cb: (msg: string) => void) {
    this.ctx.userOutputCb = cb;
  }
}

class MCAgent extends Agent {
  constructor() {
    super("mc");
    this.currentNode = MCAgent.createIntroNode();
    let objNode = MCAgent.createObjectiveGatheringNode(this.currentNode);
    this.workNodes.push(this.currentNode);
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

  static createModuleChoiceNode(): WorkflowNode {
    let introNode = new SimpleOutputNode("module-choice", "");
    return introNode;
  }

  // ingestUserInput(msg: any) {
  //   this.currentNode?.ingestUserInput(this.ctx,msg);
  // }
}

class WorkflowNode {
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
    }
  }

  public addChild(child: WorkflowNode) {
    this.children.push(child);
  }

  run(state: WorkflowContext) {

  }

  ingestUserInput(ctx: WorkflowContext, msg: string) {

  }
}

// This state is responsible for obtaining some context
// Anything asked to the agent at this state basically
// results in the agent should result in it asking for this context
// Context is gathered in some specified order
// Once it is obtained, proceed to the next node by adding it to the context
//TODO: who's responsible for updating the context?, is it inside or outside
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
      messages: {
        workflowContent: [{
          content: prompts["context-gathering-meta-instruction"],
          type: "workflow_instruction"
        },
        {
          //TODO: Add the extra instruction on the schema here
          content: JSON.stringify(this.neededContext),
          type: "workflow_instruction"
        }]
      }
    });
  }

  run(ctx: WorkflowContext) {
    if(this.state !== "idle") {
      console.log("ContextGatheringNode ${this.name} not in idle state, doing nothing for run call");
      return;
    } else {
      //Update the context before the process
      this.updateContext(ctx);
      //Trigger a pre-defined response here by asking the LLM to summarise it.
      // TODO: This can perhaps be optimised via some automated way of create
      // the user output without LLM call
      ctx.messages.push({
        role: "user",
        messages: {
          workflowContent: [{
            //TODO: this prompt should also include the format in which the output is to be provided
            content: prompts["gather-context-from-user"],
            type: "workflow_instruction"
          }]
        }
      });
      if(!ctx.model) {
        throw new Error("No model available for the ContextGatheringNode.");
      } else {
        //TODO: LLM provider call needed here
        // Once the output from the user is available,
        // TODO: the LLM should be able to help this node proceed (even this can be perhaps optimised)
        this.state = "waiting_on_llm";
        ctx.model?.input(ctx.messages,this.processLLMOutput.bind(this,ctx));
      }
    }
  }

  processLLMOutput(ctx: WorkflowContext, msg: any) {
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
        msg.messages.forEach((m: any) => {
          if(m.workflowContent && m.workflowContent.type === "workflow_context") {
            //Add to the context if available
            //TODO: Validation of provided context here
            let gatheredContext = JSON.parse(m.workflowContent);
            this.scrapeContext(gatheredContext);
          }
          if(m.userContent) {
            //Surface message to the user:
            ctx.userOutputCb ? ctx.userOutputCb(m.userContent) : null;
          }
        });
        //TODO: Handle stop condition here
      }
    } else if(this.state === "closed") {
      //Do nothing
    }
  }

  scrapeContext(gatheredContext: any) {
    this.neededContext.forEach(nc => {
      if(gatheredContext[nc.contextName]) {
        this.gatheredContext[nc.contextName] = gatheredContext[nc.contextName];
      }
    })
  }

  ingestUserInput(ctx: WorkflowContext, msg: string): void {
    //TODO: What to do for the other states?
    //Check the workflow node state here before proceeding
    // Pass it onto the LLM
    if(this.state === "idle") {
      //TODO: Do nothing, but something might be wrong here
    } else if(this.state === "waiting_on_user") {
      ctx.messages.push({
        role: "user",
        messages: {
          userContent: msg
        }
      });
      if(!ctx.model) {
        throw new Error("No model available for the ContextGatheringNode.");
      } else {
        //TODO: LLM provider call needed here
        // Once the output from the user is available,
        // TODO: the LLM should be able to help this node proceed (even this can be perhaps optimised)
        this.state = "waiting_on_llm";
        ctx.model?.input(ctx.messages,this.processLLMOutput.bind(this,ctx));
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

  run(ctx: WorkflowContext) {
    if(this.state !== "idle") {
      console.log("SimpleOutputNode ${this.name} not in idle state, doing nothing for run call");
      return;
    }
    if(ctx.userOutputCb) {
      ctx.userOutputCb(this.output);
    }
    //Add the output provided to the project message,
    // so that it can be traced later by the LLM if needed
    ctx.messages.push({
      role: "user",
      messages: {
        workflowContent: [{
          content: this.output,
          type: "output_for_user"
        }]
      }
    });
    this.state = "closed";
    this.children.forEach(child => child.run(ctx));
  }
}

class WorkflowContext {
  systemPrompt: string = "";
  messages = new Array<ModelMessage>();
  numIterations: number = 5;
  model?: LLMProvider;
  userOutputCb?: (msg: string) => void;
}

interface ModelMessage {
  role: string;
  messages: {
    //TODO: Extra info here as a JSON??
    // TODO: Rich text support
    userContent?: string,
    workflowContent?: {
      type: "output_for_user" | "workflow_context" | "workflow_instruction",
      // TODO: Rich text support
      content: string
    }[]
  }
};

interface ContextSchema {
  //Objective, documents,
  // Type, string OR documents
  contextName: string,
  contextContext: string,
  allowedInput: Set<"string" | "pdf" | "doc" | "png" | "jpg">
}
