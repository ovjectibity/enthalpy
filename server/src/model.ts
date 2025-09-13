import Anthropic from "@anthropic-ai/sdk";
import {
  Tool as AnthTool,
  ContentBlock,
  MessageParam,
} from "@anthropic-ai/sdk/resources";

export class Model {
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
    return [];
  }
}

export class ContextManager {
  context_chain: Array<MessageParam>;

  constructor() {
    this.context_chain = [];
  }

  addToChain(message: MessageParam) {
    this.context_chain.push(message);
  }
}
