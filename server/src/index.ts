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
    const platform = process.env.PLATFORM || "macos";
    let file = "./tmp/abc.png";
    let file2 = "./tmp/abc2.png";
    let cmd: string;

    if (platform === "linux") {
      // Linux implementation using scrot
      cmd = `scrot "${file}"`;
    } else {
      // macOS implementation using screencapture
      cmd = `screencapture -tpng "${file}"`;
    }

    return new Promise((res, rej) => {
      exec(cmd, (error, stdout, stderr) => {
        console.log(`Running screenshot on ${platform}`, error, stdout, stderr);
        if (error) {
          rej(`Error taking screenshot on ${platform}: ${error.message}`);
        } else {
          sharp(file)
            .resize({ width: 1200 }) // adjust dimensions as needed
            .png() // convert to PNG and compress
            .toFile(file2)
            .then(() => {
              fs.readFile(file2, (err: any, data: any) => {
                if (err) {
                  console.log("Error reading screenshot file");
                  console.error("Error reading file:", err);
                  rej(`Error reading screenshot file: ${err.message}`);
                } else {
                  let base64encoded = Buffer.from(data).toString("base64");
                  res(base64encoded);
                }
              });
            })
            .catch((sharpError: any) => {
              console.error("Error processing image with Sharp:", sharpError);
              rej(`Error processing screenshot: ${sharpError.message}`);
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
    const platform = process.env.PLATFORM || "macos";
    let cmd: string;

    if (platform === "linux") {
      // Linux implementation using xdotool
      const button = clickType === "right" ? "3" : "1";
      cmd = `xdotool mousemove ${x} ${y} click ${button}`;
    } else {
      // macOS implementation using osascript
      const clickCommand = clickType === "right" ? "right click" : "click";
      cmd = `osascript -e 'tell application "System Events" to ${clickCommand} at {${x}, ${y}}'`;
    }

    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        console.log(
          `Executing ${clickType} click at (${x}, ${y}) on ${platform}`,
          error,
          stdout,
          stderr,
        );
        if (error) {
          resolve(`Error executing ${clickType} click: ${error.message}`);
        } else {
          resolve(
            `Successfully ${clickType} clicked at coordinates (${x}, ${y}) on ${platform}`,
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
    const prompts = require("./prompts/prompts.json");
    const config = require("./prompts/fg-config.json");
    this.iterationCap = 2;
    this.basePrompt =
      prompts.basePrompt + " " + prompts.productName + config.productName + " ";
    prompts.productURL + config.productURL + " ";
    prompts.loginUsername + config.loginUsername + " ";
    prompts.loginPassword + config.loginPassword;

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
