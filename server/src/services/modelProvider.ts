import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthTool,
  ContentBlock,
  MessageParam,
} from "@anthropic-ai/sdk/resources";

export interface LLMProvider {
  providerName: string,
  modelName: string;
  initConnection: () => void,
  input: (msg: any,cb: (msg: any) => void) => Promise<any>
}

export class ClaudeIntf implements LLMProvider {
  providerName: string = "claude"
  modelName: string = "claude-haiku"

  initConnection() {

  }

  async input(msg: any, cb: (msg: any) => void): Promise<any> {
    return msg;
  }
}
