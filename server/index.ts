import express from "express";
import Anthropic, { BaseAnthropic } from "@anthropic-ai/sdk";
import { Tool, ToolUseBlock, ContentBlock } from "@anthropic-ai/sdk/resources";
import { exec } from "child_process";
import { BlockList } from "net";
// const { exec } = require('node:child_process');

const app = express();
const port = 3001;

app.get("/", (_req, res) => {
  res.send();
});

app.get("/generate_flow_graph", (_req, res) => {
  let gphgen = new FlowGraphGenerator();
  gphgen.generateFlowGraph();
});

app.listen(port, () => {
  console.log("Server running at http://localhost:${port}");
});

class Model {
  maxTokens: number;
  model: string;
  apiKey: string;

  constructor() {
    this.maxTokens = 1024;
    this.model = "claude-sonnet-4-20250514";
    this.apiKey = require("app_config.json").anthropic_api_key;
  }

  async generateResponse(
    tools: Tool[],
    prompt: string,
  ): Promise<Array<ContentBlock>> {
    const client = new Anthropic({
      apiKey: process.env[this.apiKey],
    });
    let acc: Tool[] = [];
    let serialisedTools: Tool[] = tools.reduce(
      (prevTool, curTool, index, acc) => {
        // acc.push(curTool.serialise());
        return acc;
      },
      acc,
    );

    const message = await client.messages.create({
      max_tokens: this.maxTokens,
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      tools: serialisedTools,
    });
    return message.content;
  }

  addTools(): Tool[] {
    return [new ComputerTool()];
  }
}

class ComputerTool implements Tool {
  name: string;
  input_schema: Tool.InputSchema;
  type: "custom";
  display_width_px: number;
  display_height_px: number;
  display_number: number;

  constructor() {
    this.name = "computer";
    this.type = "custom";
    this.display_width_px = 1024;
    this.display_height_px = 768;
    this.display_number = 1;
    this.input_schema = {
      type: "object",
    };
  }

  async getScreenshot(): string {
    let cmd: string = "scrot";
    return new Promise((res, rej) => {
      exec("scrot", (error, stdout, stderr) => {
        //Pass it along to the agent
        res(stdout);
      });
    });
  }

  act(action: Object): string {
    if (action == "screenshot") {
      return this.getScreenshot();
    } else if ((action = "left_click")) {
    } else if ((action = "type")) {
    } else if ((action = "key")) {
    } else if ((action = "mouse_move")) {
    } else if ((action = "scroll")) {
    } else if ((action = "left_click_drag")) {
    } else if ((action = "right_click")) {
    } else if ((action = "middle_click")) {
    } else if ((action = "double_click")) {
    } else if ((action = "triple_click")) {
    } else if ((action = "left_mouse_down")) {
    } else if ((action = "left_mouse_up")) {
    } else if ((action = "hold_key")) {
    } else if ((action = "wait")) {
    } else if ((action = "terminal")) {
    }
  }
}

class FlowGraphGenerator {
  iterationCap: number;
  basePrompt: string;
  specificPrompt: string;
  tools: Tool[];
  model: Model;

  constructor() {
    this.iterationCap = 20;
    this.basePrompt = "";
    this.specificPrompt = "";
    this.tools = [];
    this.model = new Model();
  }

  async generateFlowGraph(): Promise<FlowGraph> {
    let graph = new FlowGraph();
    //agent loop to generate the flow graph
    for (let i = 0; i < this.iterationCap; i++) {
      let response: Array<ContentBlock> = await this.model.generateResponse(
        this.tools,
        "",
      );
      for (const block of response) {
        if(block.type == "tool_use" {

        }
      }
    }
    return graph;
  }
}

class FlowNode {
  screengrabs: Number[][];
  //event-based, user-based
  analytics: Object; //Refine this?

  constructor() {
    this.screengrabs = [];
    this.analytics = {};
  }
}

//Handles construction of the actions taken by the comp agent;
class FlowGraph {
  systemContext: String;
  nodeChain: Node[];

  constructor() {
    this.systemContext = "";
    this.nodeChain = [];
  }

  addNode(node: Node) {}

  executeAction() {}

  genAction() {}
}

// The action graph to be used for any agent's active
// work,
class AgentActionGraph {}
