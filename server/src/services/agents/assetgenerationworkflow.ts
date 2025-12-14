import { prompts } from "../../schemas/mcprompts.js";
import util from 'util';
import { z } from 'zod';
import {
  Assets,
  ModelMessage
} from "@enthalpy/shared";
import { WorkflowNode, WorkflowContext } from "./core.js";

export class AssetGenerationWorkflow<T> extends WorkflowNode {
  dependentContexts: any;
  neededAssetsSchema: any;
  generatedAssets: {
    actual: Assets<T>,
    finalise?: (actual: Assets<T>) => void,
    abort?: (err: any) => void
  }

  constructor(name: string,
    neededAssetsSchema: any,
    parent?: WorkflowNode,
    dependentContexts?: any) {
    super(name,parent);
    this.generatedAssets = {
      actual: {
        assets: []
      }
    };
    this.neededAssetsSchema = neededAssetsSchema;
    this.dependentContexts = dependentContexts;
  }

  updateMessagesContext(ctx: WorkflowContext) {
    ctx.messages.push({
      role: "user",
      contents: [
        {
          type: "workflow_instruction",
          content: prompts["assets-gen-meta-instruction"]
        },
        {
          type: "workflow_instruction",
          content: JSON.stringify(z.toJSONSchema(this.neededAssetsSchema))
        },
        // {
        //   workflowContent: {
        //     content: prompts["assets-gen-available-context-meta-instruction"],
        //     type: "workflow_instruction"
        //   }
        // },
        // {
        //   workflowContent: {
        //     content: JSON.stringify(this.dependentContexts),
        //     type: "workflow_instruction"
        //   }
        // },
      ]
    });
  }

  scrapeAssets(generatedAssets: any) {
    let parsedAssets = this.neededAssetsSchema.safeParse(generatedAssets);
    if(parsedAssets.success) {
      let vga = generatedAssets as Assets<T>;
      console.debug(`Scraping the following assets: ${util.inspect(generatedAssets, false, null, true)}`);
      //TODO: Possible accumulation of duplicates here,
      // Should we override duplicates?
      this.generatedAssets.actual.assets.push(...vga.assets);
    } else {
      console.log("Error: Schema validation did not pass when trying to scrape LLM provided generated assets");
    }
  }

  async run(ctx: WorkflowContext): Promise<Assets<T>> {
    if(this.state !== "idle") {
      console.log(`AssetGenerationNode ${this.name} not in idle state, doing nothing for run call`);
      return Promise.reject(new Error(`AssetGenerationNode ${this.name} not in idle state`));
    } else {
      console.log(`Running the AssetGenerationNode ${this.name}`);
      //Update the context before the process
      this.updateMessagesContext(ctx);
      //Trigger a pre-defined response here by asking the LLM to summarise it.
      // TODO: This can perhaps be optimised via some automated way of create
      // the user output without LLM call
      ctx.messages.push({
        role: "user",
        contents: [{
          type: "workflow_instruction",
          content: prompts["prompt-asset-gen"]  
        }]
      });
      if(!ctx.model) {
        return Promise.reject(new Error("No model available for the AssetGenerationNode."));
      } else {
        //TODO: LLM provider call needed here
        // Once the output from the user is available,
        // TODO: the LLM should be able to help this node proceed (even this can be perhaps optimised)
        this.state = "waiting_on_llm";
        ctx.model?.input(ctx.messages).then(
          (modelResponse: ModelMessage) => {
          this.processLLMOutput(ctx, modelResponse);
        });
        return new Promise((res,rej) => {
          this.generatedAssets.finalise = res;
          this.generatedAssets.abort = rej;
        });
      }
    }
  }

  async processLLMOutput(ctx: WorkflowContext, msg: ModelMessage) {
    //TODO: What to do for the other states
    if(this.state === "idle") {
      //TODO: Do nothing, but something might be wrong here
    } else if(this.state === "waiting_on_user") {
      //TODO: this shouldn't happen, throw error
      throw new Error("Waiting on user in ContextGatheringNode ${this.name}.");
    } else if(this.state === "waiting_on_llm") {
      if(msg.role && msg.role === "assistant" && msg.contents) {
        ctx.messages.push(msg);
        for(let m of msg.contents) {
          if(m.type === "workflow_gen_asset") {
            //Add to the context if available
            //TODO: Validation of provided context here
            try {
              let generatedAssets = JSON.parse(m.content);
              this.scrapeAssets(generatedAssets);
            } catch(error) {
              console.log("Failure when processing the LLM generated assets",error);
            }
          } else if(m.type === "workflow_instruction") {
            //TODO: The stop condition is expected to be the last block, add this to prompt
            let stopCondition = JSON.parse(m.content);
            if(stopCondition.stop && stopCondition.stopReason) {
              this.state = "closed";
              //TODO: Handle changing of active node here
              // Surface gathered context + record stopReason
              console.log(`Exiting the AssetGenerationNode ${this.name} due to ${stopCondition.stopReason}`);
              if(this.generatedAssets.finalise)
                this.generatedAssets.finalise(this.generatedAssets.actual);
            }
          } else if(m.type === "output_to_user" && ctx.userOutputCb) {
            //Surface message to the user:
             await ctx.userOutputCb(m.content);
            //Assume that if a message is surfaced to the user
            //then we're waiting on them
            this.state = "waiting_on_user"
          }
        }
      }
    } else if(this.state === "closed") {
      //Do nothing
    }
  }

  async ingestUserInput(ctx: WorkflowContext, msg: string) {
    //TODO: What to do for the other states?
    if(this.state === "idle") {
      //TODO: Do nothing, but something might be wrong here
    } else if(this.state === "waiting_on_user") {
      ctx.messages.push({
        role: "user",
        contents: [{
          type: "input_from_user",
          content: msg
        }]
      });
      if(!ctx.model) {
        throw new Error("No model available for the ContextGatheringNode.");
      } else {
        this.state = "waiting_on_llm";
        let modelResponse = await ctx.model?.input(ctx.messages);
        await this.processLLMOutput(ctx, modelResponse);
      }
    } else if(this.state === "waiting_on_llm") {
      //TODO: interrupt LLM in case of user input
    } else if(this.state === "closed") {
      //Do nothing
    }
  }
}