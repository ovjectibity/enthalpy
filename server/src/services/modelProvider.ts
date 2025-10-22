import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthTool,
  ContentBlock,
  MessageParam,
} from "@anthropic-ai/sdk/resources";

export interface LLMProvider {
  providerName: string,
  initConnection: () => void,
  input: (msg: any) => Promise<any>
}

export class ClaudeIntf implements LLMProvider {
  providerName: string = "claude"

  initConnection() {

  }

  async input(msg: any): Promise<any> {
    return msg;
  }
}
