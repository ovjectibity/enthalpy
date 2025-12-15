import { WorkflowNode, WorkflowContext } from "./core.js";
import {
  ModelMessage
} from "@enthalpy/shared";
import { computerUseToolInputSchema } from "../../schemas/toolSchemas.js";
import { ComputerUseService } from "../cuservice.js";
import Graph from "graphology";

export interface FlowGraphNode {
    screngrab: string,
    description?: string
}

export class FlowGraph {
  graph: Graph;
  fgNodeMap: Map<number,FlowGraphNode>;

  constructor() {
    this.graph = new Graph({type: "directed"});
    this.fgNodeMap = new Map();
  }

  addNode(node: FlowGraphNode) {
    this.fgNodeMap.keys
  }

  connectEdge(node1: FlowGraphNode, node2: FlowGraphNode) {

  }
}

export class CuNode extends WorkflowNode {
  cuService: ComputerUseService;
  finalisedFlow: {
    actual: FlowGraph,
    finalise?: (actual: FlowGraph) => void;
    abort?: (err: any) => void;
  }

  constructor(name: string, cuService: ComputerUseService, parent?: WorkflowNode) {
    super(name,parent);
    this.finalisedFlow = {
      actual: new FlowGraph()
    }
    this.cuService = cuService;
  }

  addWorkflowContext(state: WorkflowContext) {
    state.messages.push({
        role: "user",
        contents: [
          {
            type: "workflow_instruction",
            content: ""
          }
        ]
      });
  }

  run(state: WorkflowContext): Promise<FlowGraph> {
    if(this.state === "idle") {
      console.log(`Running the Pathways node ${this.name}`);
      this.addWorkflowContext(state);
      this.state = "waiting_on_llm";
      state.model?.input(state.messages,
        new Map([
        ["computer_use",computerUseToolInputSchema]
      ])).then(
        (modelResponse: ModelMessage) => {
        this.processModelOutput(state, modelResponse);
      });
      return new Promise((res,rej) => {
        this.finalisedFlow.finalise = res;
        this.finalisedFlow.abort = rej;
      });
    } else return Promise.reject(new Error(`WorkflowNode Pathways ${this.name} not in idle state`));
  }

  //TODO: add stop condition + finalise
  async processModelOutput(state: WorkflowContext,modelResponse: ModelMessage) {
    if(this.state === "waiting_on_llm" && modelResponse.role === "assistant") {
      for(let content of modelResponse.contents) {
        if(content.type === "tool_use" && content.content.name === "computer_use") {
          if(content.content.name === "computer_use") {
            try {
              let screengrab = await this.cuService.performAction(content.content.id,
                                                content.content.input);
              
              state.messages.push({
                role: "user",
                contents: [
                  {
                    type: "tool_use_result",
                    content: {
                      name: "computer_use",
                      id: content.content.id,
                      screengrab: screengrab
                    }
                  }
                ]
              });
            } catch(error) {
              console.error(error);
            }
            state.model?.input(state.messages,new Map([
              ["computer_use",computerUseToolInputSchema]
            ]));
          }
        } else if(content.type === "workflow_instruction" && content.content === "stop") {
          let stopCondition = JSON.parse(content.content);
            if(stopCondition.stop && stopCondition.stopReason) {
              this.state = "closed";
              //TODO: Handle changing of active node here
              // Surface gathered context + record stopReason
              console.log(`Exiting the CuNode ${this.name} due to ${stopCondition.stopReason}`);
              if(this.finalisedFlow.finalise)
                this.finalisedFlow.finalise(this.finalisedFlow.actual);
            }
        } else {
          console.warn(`Got unexpected content block from computer use agent ${content.content}`)
        }
      }
    } else {
      console.warn(`Did not find the Pathways node ${this.name} in waiting_on_llm state when running porcessModelOutput`);
    }
  }

  ingestUserInput(ctx: WorkflowContext, msg: string): void {
    //Do nothing; no user input can be accepted at this stage
    console.log(`Not user input supported for Pathways node, ${this.name}`);
  }
}