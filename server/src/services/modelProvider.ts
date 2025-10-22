import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthTool,
  ContentBlock,
  MessageParam,
  ContentBlockParam,
} from "@anthropic-ai/sdk/resources";
import { ModelMessage } from "./agent"

export interface LLMIntf {
  providerName: string,
  model: string;
  input: (msg: any) => Promise<any>,
  messages: Array<ModelMessage>
}

export class ClaudeIntf implements LLMIntf {
  providerName: string = "claude";
  model: string = "claude-haiku-4-5-20251001";
  // model: string = "claude-sonnet-4-5-20250929";
  maxTokens: number = 1024;
  client: Anthropic;
  messages: Array<ModelMessage>;

  constructor() {
    if (process.env.ANTHROPIC_KEY === undefined) {
      console.log("Set the env variable ANTHROPIC_KEY");
    }
    this.messages = new Array<ModelMessage>();
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_KEY,
    });
  }

  // async generateResponse(
  //   tools: AnthTool[],
  //   messages: Array<MessageParam>,
  // ): Promise<Array<ContentBlock>> {
  // }

  static translateToAnthropicMessage(msg: ModelMessage): MessageParam {
    let blocks = Array<ContentBlockParam>();
    msg.messages.forEach(m => {
      blocks.push({
        type: "text",
        text: JSON.stringify(m)
      });
    })
    return {
      role: msg.role,
      content: blocks
    }
  }

  static translateToAnthropicMessages(msgs: Array<ModelMessage>):
    Array<MessageParam> {
    let anthMsgs = Array<MessageParam>();
    msgs.forEach(msg => {
      anthMsgs.push(ClaudeIntf.translateToAnthropicMessage(msg));
    })
    return anthMsgs;
  }

  async input(msg: ModelMessage): Promise<any> {
    this.messages.push(msg);

    const message = await this.client.messages
      .create({
        max_tokens: this.maxTokens,
        messages: ClaudeIntf.translateToAnthropicMessages(this.messages),
        model: this.model,
        //TODO: provide system prompt here:
        system: ""
      })
      .catch((error) => {
        console.log(error);
      });
    console.log("Got this message from the claude model", message);
    if (message === undefined || message === null) {
      return Promise.resolve(new Array<ContentBlock>());
    } else {
      return message.content;
    }
  }
}
