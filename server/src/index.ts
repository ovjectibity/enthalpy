import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthTool,
  ToolUseBlock,
  ContentBlock,
} from "@anthropic-ai/sdk/resources";
import { exec } from "child_process";
// const { exec } = require('node:child_process');

const app = express();
const port = 3001;

app.get("/", (_req, res) => {
  res.send();
});

app.get("/generate_flow_graph", (_req, res) => {
  let gphgen = new FlowGraphGenerator("");
  gphgen.generateFlowGraph();
  res.send({
    response: "doing something",
  });
});

app.listen(port, () => {
  console.log("Server running at http://localhost:${port}");
});

class Model {
  maxTokens: number;
  model: string;
  apiKey: "ANTHROPIC_KEY";

  constructor() {
    this.maxTokens = 1024;
    this.model = "claude-sonnet-4-20250514";
    if (process.env.ANTHROPIC_KEY === undefined) {
      console.log("Set the env variable ANTHROPIC_KEY");
    }
    this.apiKey = "ANTHROPIC_KEY";
  }

  async generateResponse(
    tools: AnthTool[],
    prompt: string,
  ): Promise<Array<ContentBlock>> {
    const client = new Anthropic({
      apiKey: process.env[this.apiKey],
    });
    const message = await client.messages
      .create({
        max_tokens: this.maxTokens,
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        tools: tools,
      })
      .catch((error) => {
        console.log(error);
      });
    if (message === undefined || message === null) {
      return Promise.resolve(new Array<ContentBlock>());
    } else {
      return message.content;
    }
  }

  addTools(): AnthTool[] {
    return [new ComputerTool()];
  }
}

interface Tool {
  act: (action: string) => string;
  getProviderTool: () => AnthTool;
}

class ComputerTool implements AnthTool, Tool {
  name: string;
  input_schema: AnthTool.InputSchema;
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
      description:
        "Use this tool to use & navigate the local computer instance. " +
        "You can use the tool to perform specific actions such as" +
        " taking a screenshot of the current view," +
        "scrolling up or down or left-clicking or right-clicking on a particular coordinate (x,y).",
      properties: {
        action: {
          type: "string",
          description:
            "Possible actions: screenshot, left_click, right_click, scroll-down, scroll-up",
        },
        coordinates: {
          type: "object",
          description:
            "X & Y screen coordinates over which the click needs to be made.",
          properties: {
            x: {
              type: "number",
              description:
                "The X coordinate over which a click needs to be made.",
            },
            y: {
              type: "number",
              description:
                "The Y coordinate over which a click needs to be made.",
            },
          },
        },
      },
      required: ["action"],
    };
  }

  async getScreenshot(): Promise<string> {
    let cmd: string = "scrot";
    return new Promise((res, rej) => {
      exec("scrot", (error, stdout, stderr) => {
        //Pass it along to the agent
        res(stdout);
      });
    });
  }

  getProviderTool(): AnthTool {
    return this;
  }

  act(action: string): string {
    if (action == "screenshot") {
      // return this.getScreenshot();
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
    return "";
  }
}

class FlowGraphGenerator {
  iterationCap: number;
  basePrompt: string;
  tools: Map<string, Tool>;
  model: Model;

  constructor(basePrompt: string) {
    this.iterationCap = 1;
    this.basePrompt = basePrompt;
    this.tools = new Map<string, Tool>();
    this.model = new Model();
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
        "",
      );
      console.log("got response:", response);
      for (const block of response) {
        if (block.type == "tool_use") {
          switch (block.name) {
            case "computer": {
              this.tools.get("computer")?.act("");
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

// class FlowNode {
//   screengrabs: Number[][];
//   //event-based, user-based
//   analytics: Object; //Refine this?

//   constructor() {
//     this.screengrabs = [];
//     this.analytics = {};
//   }
// }

//Handles construction of the actions taken by the comp agent;
class FlowGraph {
  systemContext: String;
  // nodeChain: Node[];

  constructor() {
    this.systemContext = "";
    // this.nodeChain = [];
  }

  addNode(node: Node) {}

  executeAction() {}

  genAction() {}
}

// The action graph to be used for any agent's active
// work,
class AgentActionGraph {}
