import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthTool,
  ContentBlock,
  MessageParam,
  ContentBlockParam,
  Model,
} from "@anthropic-ai/sdk/resources";
import { ModelMessage } from "./agent"

export interface LLMIntf {
  providerName: string,
  model: string;
  input: (msg: Array<ModelMessage>) => Promise<ModelMessage>
}

export class ClaudeIntf implements LLMIntf {
  providerName: string = "claude";
  model: string = "claude-haiku-4-5-20251001";
  // model: string = "claude-sonnet-4-5-20250929";
  maxTokens: number = 1024;
  client: Anthropic;

  constructor() {
    if (process.env.ANTHROPIC_KEY === undefined) {
      console.log("Set the env variable ANTHROPIC_KEY");
    }
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_KEY,
    });
  }

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
    msgs.forEach((msg2: ModelMessage) => {
      console.log("DEBUGGING: model message2: ",  JSON.stringify(msg2));
      anthMsgs.push(ClaudeIntf.translateToAnthropicMessage(msg2));
    });
    return anthMsgs;
  }

  async input(msgs: Array<ModelMessage>): Promise<ModelMessage> {
    // TODO/CLEANUP: Temporary test return:
    return {
        role: "assistant",
        messages: [
          {
            workflowContent: 
            {
              type: "output_for_user",
              content: "Some content to be shared with te user shared by the LLM."
            }
          },
          {
            workflowContent: 
            {
              type: "workflow_context",
              content: "Some context gathered by the LLM"
            }
          }]
      };
    // const message = await this.client.messages
    //   .create({
    //     max_tokens: this.maxTokens,
    //     messages: ClaudeIntf.translateToAnthropicMessages(msgs),
    //     model: this.model,
    //     //TODO: provide system prompt here:
    //     system: ""
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });
    // console.log("Got this message from the claude model", message);
    // //TODO: translate the content blocks to ModelMessage format
    // if (message === undefined || message === null) {
    //   return Promise.resolve({
    //     role: "assistant",
    //     messages: []
    //   });
    // } else {
    //   let msg: ModelMessage = {
    //     role: "assistant",
    //     messages: []
    //   };
    //   let contents = message.content as Array<ContentBlock>;
    //   contents.forEach((content: ContentBlock) => {
    //     if(content.type === "text") {
    //       if (content.text) {
    //         msg.messages.push(JSON.parse(content.text));
    //       }
    //     }
    //   });
    //   return msg;
    // }
  }
}
