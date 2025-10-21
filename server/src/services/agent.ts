export class LLMNode {
  //Defines whether an output should be shown to the user or not
  showOutputToUser: boolean = false;
  previousNode?: LLMNode;
  result: string = "";
}

export class Workflow {
  numIterations: number = 0;
}

export class WorkflowNode {
  name: string = "";
  numIterations: number = 0;
  endOutcomeInstruction: string = "";
  //this defines the point at which a workflow should end
  //Outcome can be defined in an outcome in particular format -
  // JSON, MD, special framework, limitations
  endOutcome: string = "";
  basePrompt: boolean = false;
  llmNodes: LLMNode[] = [];

  //L0 loop - workflow progress
  //L1 loop - LLM iteration


  public constructor(name: string) {
    this.name = name;
  }
}
