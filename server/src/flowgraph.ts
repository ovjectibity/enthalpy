import {
  Tool as AnthTool,
  ToolUseBlock,
  ContentBlock,
  MessageParam,
} from "@anthropic-ai/sdk/resources";
import { Model, ContextManager } from "./model.js";
import { Tool } from "./tools.js";

export class FlowGraphGenerator {
  iterationCap: number;
  basePrompt: string;
  tools: Map<string, Tool>;
  model: Model;
  ctxManager: ContextManager;

  constructor(tools: Map<string, Tool>) {
    const prompts = require("./prompts/prompts.json");
    const config = require("./prompts/fg-config.json");
    this.iterationCap = 2;
    this.basePrompt =
      prompts.basePrompt +
      " " +
      prompts.productName +
      config.productName +
      " " +
      prompts.productURL +
      config.productURL +
      " " +
      prompts.loginUsername +
      config.loginUsername +
      " " +
      prompts.loginPassword +
      config.loginPassword +
      " " +
      prompts.productScope +
      config.productScope;

    this.tools = tools;
    this.model = new Model();
    this.ctxManager = new ContextManager();
    this.ctxManager.context_chain.push({
      content: this.basePrompt,
      role: "user",
    });
  }

  getSerialisedTools(): AnthTool[] {
    let serialisedTools: AnthTool[] = [];
    this.tools.forEach((value, key, map) => {
      serialisedTools.push(value.getProviderTool());
    });
    return serialisedTools;
  }

  async generateFlowGraph(): Promise<FlowGraph> {
    let graph = new FlowGraph();
    //agent loop to generate the flow graph
    console.log("Generating flow graph: ");
    for (let i = 0; i < this.iterationCap; i++) {
      let response: Array<ContentBlock> = await this.model.generateResponse(
        this.getSerialisedTools(),
        this.ctxManager.context_chain,
      );
      this.ctxManager.addToChain({
        role: "assistant",
        content: response,
      });
      console.log("got response:", response);
      for (const block of response) {
        if (block.type == "tool_use") {
          let toolblock = block as ToolUseBlock;
          switch (block.name) {
            case "computer": {
              let toolresponse = await this.tools
                .get("computer")
                ?.act(toolblock.input, toolblock.id)
                .catch((e) => {
                  console.log(e);
                });
              console.log(toolresponse);
              if (toolresponse !== undefined) {
                this.ctxManager.addToChain({
                  role: "user",
                  content: [toolresponse],
                });
              }
            }
            case "text": {
            }
          }
        }
      }
    }
    return graph;
  }
}

class FlowNode {
  screengrabs: string[][];
  description: string;
  inAction: string;
  nextNode: null | FlowNode[];

  constructor() {
    this.screengrabs = [];
    this.description = "";
    this.nextNode = null;
    this.inAction = "";
  }
}

//Handles construction of the actions taken by the comp agent;
export class FlowGraph {
  nodeChain: FlowNode[];

  constructor() {
    this.nodeChain = [];
  }

  addNode(node: FlowNode) {}

  executeAction() {}

  genAction() {}
}

// The action graph to be used for any agent's active
// work,
export class AgentActionGraph {}
