import { ClaudeIntf, LLMProvider } from "./modelProvider";

// Workflows are defined by 2 loops -
// L0 loop - workflow progress nodes, with each having a specific end output
// L1 loop - with multiple LLM iterations towards achieving that output
const prompts = require("../prompts/mcprompts.json");

type WorkState = "streaming_llm" | "waiting_on_user_input" | "idle" | "processing" | "closed";

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
      this.agentMap.get(msg.agent_name)?.ingestUserInput(msg,cb);
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
  state: WorkflowContext;
  currentNode?: WorkflowNode;

  constructor(name: string) {
    this.name = name;
    this.state = new WorkflowContext();
  }

  ingestUserInput(msg: any) {
    this.currentNode?.ingestUserInput(msg);
  }

  public registerUserOutputCallback(cb: (msg: string) => void) {
    this.state.userOutputCb = cb;
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

  ingestUserInput(msg: any) {
    this.currentNode?.ingestUserInput(msg);
  }
}

class WorkflowNode {
  name: string = "";
  state: WorkState = "idle";
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

  ingestUserInput(msg: any) {

  }
}

// This state is responsible for obtaining some context
// Anything asked to the agent at this state basically
// results in the agent should result in it asking for this context
// Context is gathered in some specified order
// Once it is obtained, proceed to the next node by adding it to the context
//TODO: who's responsible for updating the context?, is it inside or outside
class ContextGatheringNode extends WorkflowNode {
  contexts: ContextSchema[];

  constructor(name: string,needed: ContextSchema[], parent?: WorkflowNode) {
    super(name, parent);
    this.contexts = needed;
  }

  updateContext(ctx: WorkflowContext) {
    //TODO: 1. keep the system prompt, message history & the LLM provider
    // 2. Update with some workflow context telling
    // the llm about the context gathering process
    ctx.messages.push({
      role: "user",
      message: {
        workflowContent: [{
          content: prompts["context-gathering-meta-instruction"],
          type: "workflow-instruction"
        },
        {
          //TODO: Add the extra instruction on the schema here
          content: JSON.stringify(this.contexts),
          type: "workflow-instruction"
        }]
      }
    });
  }

  run(ctx: WorkflowContext) {
    if(this.state !== "idle") {
      console.log("ContextGatheringNode ${this.name} not in idle state, doing nothing for run call");
      return;
    } else if(this.state) {
      //Update the context before the process
      this.updateContext(ctx);
      //TODO: Should we trigger a pre-defined response here?
    }
  }

  ingestUserInput(msg: any): void {

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
      message: {
        workflowContent: [{
          content: this.output,
          type: "output-for-user"
        }]
      }
    });
    this.state = "closed";
    this.children.forEach(child => child.run(ctx));
  }
}

class WorkflowContext {
  systemPrompt: string = "";
  messages = new Array<Message>();
  numIterations: number = 5;
  llm?: LLMProvider;
  userOutputCb?: (msg: string) => void;
}

interface Message {
  role: string;
  message: {
    userContent?: string,
    workflowContent?: {
      type: "output-for-user" | "workflow-context" | "workflow-instruction",
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
