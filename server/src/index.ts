import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthTool,
  ToolUseBlock,
  ContentBlock,
  MessageParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources";
import { exec } from "child_process";
import * as fs from "fs";
const sharp = require("sharp");

const app = express();
const port = 3001;

app.get("/", (_req, res) => {
  res.send();
});

app.get("/generate_flow_graph", (_req, res) => {
  let gphgen = new FlowGraphGenerator();
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
    messages: Array<MessageParam>,
  ): Promise<Array<ContentBlock>> {
    const client = new Anthropic({
      apiKey: process.env[this.apiKey],
    });
    console.log("Got this prompt & tools: ", messages, tools);
    const message = await client.messages
      .create({
        max_tokens: this.maxTokens,
        messages: messages,
        model: this.model,
        tools: tools,
      })
      .catch((error) => {
        console.log(error);
      });
    console.log("Got this message from the model", message);
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
  act: (action: unknown, id: string) => Promise<ToolResultBlockParam>;
  getProviderTool: () => AnthTool;
}

class ComputerTool implements AnthTool, Tool {
  name: string;
  input_schema: AnthTool.InputSchema;
  type: "custom";
  // display_width_px: number;
  // display_height_px: number;
  // display_number: number;
  description: string;

  constructor() {
    this.name = "computer";
    this.type = "custom";
    // this.display_width_px = 1024;
    // this.display_height_px = 768;
    // this.display_number = 1;
    this.description =
      "Use this tool to use & navigate the local computer instance. " +
      "You can use the tool to perform specific actions such as" +
      " taking a screenshot of the current view," +
      "scrolling up or down or left-clicking or right-clicking on a particular coordinate (x,y).";
    this.input_schema = {
      type: "object",
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
    // let cmd: string = "scrot";
    // Impl for mac
    let file = "./tmp/abc.png";
    let file2 = "./tmp/abc2.png";
    let cmd: string = 'screencapture -tpng "' + file + '"';
    return new Promise((res, rej) => {
      exec(cmd, (error, stdout, stderr) => {
        //Pass it along to the agent
        console.log("Running screencapture", error, stdout, stderr);
        if (error) {
          rej();
        } else {
          sharp(file)
            .resize({ width: 1200 }) // adjust dimensions as needed
            .png() // convert to JPEG and compress
            .toFile(file2)
            .then(() => {
              fs.readFile(file2, (err: any, data: any) => {
                if (err) {
                  console.log("Running screencapture");
                  console.error("Error reading file:", err);
                  rej();
                }
                let base64encoded = Buffer.from(data).toString("base64");
                // console.log("File content:", base64encoded);
                res(base64encoded);
              });
            });
        }
      });
    });
  }

  async executeClick(
    x: number,
    y: number,
    clickType: "left" | "right" = "left",
  ): Promise<string> {
    // macOS implementation using osascript
    let clickCommand = clickType === "right" ? "right click" : "click";
    let cmd = `osascript -e "tell application \"System Events\" to ${clickCommand} at {${x}, ${y}}"`;

    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        console.log(
          `Executing ${clickType} click at (${x}, ${y})`,
          error,
          stdout,
          stderr,
        );
        if (error) {
          resolve(`Error executing ${clickType} click: ${error.message}`);
        } else {
          resolve(
            `Successfully ${clickType} clicked at coordinates (${x}, ${y})`,
          );
        }
      });
    });
  }

  getProviderTool(): AnthTool {
    return this;
  }

  async act(input: unknown, id: string): Promise<ToolResultBlockParam> {
    let action = (input as { action: string })?.action;
    if (action === "screenshot") {
      console.log("Printing screenshot");
      let ss = await this.getScreenshot();
      return {
        tool_use_id: id,
        type: "tool_result",
        content: [
          {
            type: "image",
            source: {
              data: ss,
              media_type: "image/png",
              type: "base64",
            },
          },
        ],
      };
    } else if (action === "left_click") {
      let coordinates = (input as { coordinates: { x: number; y: number } })
        ?.coordinates;
      if (coordinates) {
        let result = await this.executeClick(
          coordinates.x,
          coordinates.y,
          "left",
        );
        return {
          tool_use_id: id,
          type: "tool_result",
          content: result,
        };
      } else {
        return {
          tool_use_id: id,
          type: "tool_result",
          content: "Error: coordinates required for left_click action",
        };
      }
    } else if (action === "type") {
    } else if (action === "key") {
    } else if (action === "mouse_move") {
    } else if (action === "scroll") {
    } else if (action === "left_click_drag") {
    } else if (action === "right_click") {
      let coordinates = (input as { coordinates: { x: number; y: number } })
        ?.coordinates;
      if (coordinates) {
        let result = await this.executeClick(
          coordinates.x,
          coordinates.y,
          "right",
        );
        return {
          tool_use_id: id,
          type: "tool_result",
          content: result,
        };
      } else {
        return {
          tool_use_id: id,
          type: "tool_result",
          content: "Error: coordinates required for right_click action",
        };
      }
    } else if (action === "middle_click") {
    } else if (action === "double_click") {
    } else if (action === "triple_click") {
    } else if (action === "left_mouse_down") {
    } else if (action === "left_mouse_up") {
    } else if (action === "hold_key") {
    } else if (action === "wait") {
    } else if (action === "terminal") {
    }
    return Promise.reject();
  }
}

class FlowGraphGenerator {
  iterationCap: number;
  basePrompt: string;
  tools: Map<string, Tool>;
  model: Model;
  ctxManager: ContextManager;

  constructor() {
    this.iterationCap = 2;
    this.basePrompt =
      "You're an agent responsible for generating a user journey map for any given website or webapp. The user journey map is a detailed graph (in the sense of a graph with nodes & edges) which maps out the user’s experience with the product. The nodes are particular states of the digital product which is relatively stable (i.e. not changing much). The nodes also capture various other forms of information including screenshot(s) of the state, metrics or absolute numbers on how many users land at this state, observations on issues faced with usability/UI/UX/functionality & observations on any UX/UI opportunities. The edges are basically the distinct pathways the user can take between two different states either automatically triggered upon the user or due to the users own choice (by clicking on any intractable UI). The edges capture these information items: action taken by the user or automated reason for the edge being triggered. Now your job is to build this graph out, for now by only capturing the screenshots info for the nodes & the action / reason info for the edges. You would be doing this by using a sandboxed computer environment where you’d be able to use the browser. I want you to use the tools that are provided to you to do this. The main tool is the computer tool with which you should have the ability to take the screenshot of the current screen, perform left- or right-click with the mouse, scroll up or down by a certain amount, input keys. I will provide you with the URL of the product for which this needs to be done, any credentials that are needed to access any UX behind logins & the scope of this journey map in the sense of the URL to start from & what should be your terminating condition. I will also give you a scope in sense of particular functionality within the product that you need to follow in order to build out the graph. ";
    this.tools = new Map<string, Tool>();
    this.tools.set("computer", new ComputerTool());
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

class ContextManager {
  context_chain: Array<MessageParam>;

  constructor() {
    this.context_chain = [];
  }

  addToChain(message: MessageParam) {
    this.context_chain.push(message);
  }
}
