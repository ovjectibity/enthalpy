// Workflows are defined by 2 loops -
// L0 loop - workflow progress nodes, with each having a specific end output
// L1 loop - with multiple LLM iterations towards achieving that output

export class AgentService {
  agentMap: Map<string,Agent>;

  public constructor() {
    this.agentMap = new Map<string,Agent>();
  }

  public initiateAgents() {
    // this.agentMap.set("mc", new Agent());
  }

  public ingestUserInput(msg: any, cb: (msg: string) => void) {
    if(msg.agent_name && this.agentMap.get(msg.agent_name)) {
      this.agentMap.get(msg.agent_name)?.ingestUserInput(msg,cb);
    } else if (msg.agent_name) {
      console.log("No MC agent available, doing nothing.");
    } else {
      console.log("No agent name provided to AgentService, doing nothing.");
    }
  }

  //Callback independent of the user input cb needed to handle independent output from the agent
  public registerOutputCallback(agentNamecb: (msg: string) => void) {

  }
}

class Agent {
  constructor(name: string) {
    let baseNode = new LLMNode();
    let introNode = new WorkflowNode("intro-node", baseNode);
  }

  ingestUserInput(msg: any, cb: (msg: string) => void) {

  }
}

class MCAgent extends Agent {

}

class InteractionNode {
  //TODO: Should each workflow node have linear
  // set of nodes or branching tree can be possible?
  previousNode?: LLMNode;
  nextNode?: LLMNode;
  output: string = "";
  //Defines whether an output should be shown to the user or not
  showOutputToUser: boolean = false;
}

class UserChoiceNode extends InteractionNode {

}

class LLMNode extends InteractionNode {

}

class SimpleNode extends InteractionNode {

}

class Workflow {
  name: string = "";

  workNodes: WorkflowNode[] = [];
  baseNode: WorkflowNode;

  constructor(baseNode: WorkflowNode) {
    this.baseNode = baseNode;
  }
}

class WorkflowNode {
  name: string = "";
  numIterations: number = 0;
  endOutcomeInstruction: string = "";
  //this defines the point at which a workflow should end
  //Outcome can be defined in an outcome in particular format -
  // JSON, MD, special framework, limitations
  // TODO: Is string the most generic thing that can be used here?
  endOutcome: string = "";
  basePrompt: boolean = false;
  interactons: InteractionNode[] = [];
  baseInteraction: InteractionNode;

  public constructor(name: string, baseInteraction: InteractionNode) {
    this.name = name;
    this.baseInteraction = baseInteraction;
  }
}
