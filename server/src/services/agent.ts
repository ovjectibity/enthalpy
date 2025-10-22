import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthTool,
  ContentBlock,
  MessageParam,
} from "@anthropic-ai/sdk/resources";

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

class WorkflowContext {
  systemPrompt: string = "";
  messages = new Array<Message>();
  numIterations: number = 5;
  llm?: LLMProvider;
  userOutputCb?: (msg: string) => void;
}

class Agent {
  name: string;
  workNodes = new Array<WorkflowNode>();
  state: WorkflowContext;

  constructor(name: string) {
    this.name = name;
    this.state = new WorkflowContext();
  }

  ingestUserInput(msg: any, cb: (msg: string) => void) {
    this.currentNode?.ingestUserInput(msg);
  }

  public registerUserOutputCallback(cb: (msg: string) => void) {
    this.state.userOutputCb = cb;
  }
}

class MCAgent extends Agent {
  currentNode?: WorkflowNode;

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
    let objNode = new ObjectiveGatheringNode("objective-gathering");
    return objNode;
  }

  static createModuleChoiceNode(): WorkflowNode {
    let introNode = new SimpleOutputNode("module-choice", "");
    return introNode;
  }

  ingestUserInput(msg: any, cb: (msg: string) => void) {

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
// results in the agent should result in it asking for the objective
// Once it is obtained, proceed to the next node by adding it to the context
class ContextGatheringNode extends WorkflowNode {
  constructor(name: string,parent?: WorkflowNode) {
    super(name, parent);
  }

  run(state: WorkflowContext) {
    if(this.state !== "idle") {
      console.log("ObjectiveGatheringNode ${this.name} not in idle state, doing nothing for run call");
      return;
    } else if(this.state)
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
        project_context: {
          output_context: this.output,
          output_to_user: true
        }
      }
    });
    this.state = "closed";
    this.children.forEach(child => child.run(ctx));
  }
}

class LLMProvider {

}

interface Message {
  role: string;
  message: {
    user_content?: string,
    project_context?: {
      output_context: string,
      output_to_user: boolean
    }
  }
};
