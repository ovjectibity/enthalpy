import { prompts } from "../../schemas/mcprompts.js";
import util from 'util';
import { z } from 'zod';
import {
  Contexts,
  ModelMessage
} from "@enthalpy/shared";
import { WorkflowNode, WorkflowContext } from "./core.js";

// This state is responsible for obtaining some context
// Anything asked to the agent at this state basically
// results in the agent should result in it asking for this context
// Context is gathered in some specified order
// Once it is obtained, proceed to the next node by adding it to the context
export class ContextGatheringWorkflow<T> extends WorkflowNode {
  neededContextSchema: any;
  gatheredContext: {
    actual: Contexts<T>,
    finalise?: (actual: Contexts<T>) => void;
    abort?: (err: any) => void;
  };
  
  constructor(
    name: string, 
    neededContextSchema: any, 
    parent?: WorkflowNode) {
    super(name, parent);
    this.gatheredContext = {
      actual: {
        contexts: []
      }
    };
    this.neededContextSchema = neededContextSchema;
  }

  updateMessagesContext(ctx: WorkflowContext) {
    // 1. keep the system prompt, message history & the LLM provider
    // 2. Update with some workflow context telling
    // the llm about the context gathering process
    ctx.messages.push({
      role: "user",
      contents: [
        {
          type: "workflow_instruction",
          content: prompts["context-gathering-meta-instruction"],
        },
        {
          type: "workflow_instruction",
          content: JSON.stringify(z.toJSONSchema(this.neededContextSchema)),
        },
      ]
    });
  }

  async run(ctx: WorkflowContext): Promise<Contexts<T>> {
    if(this.state !== "idle") {
      console.log(`ContextGatheringNode ${this.name} not in idle state, doing nothing for run call`);
      return Promise.reject(new Error(`ContextGatheringNode ${this.name} not in idle state`));
    } else {
      console.log(`Running the ContextGatheringNode ${this.name}`);
      //Update the context before the process
      this.updateMessagesContext(ctx);
      //Trigger a pre-defined response here by asking the LLM to summarise it.
      // TODO: This can perhaps be optimised via some automated way of create
      // the user output without LLM call
      ctx.messages.push({
        role: "user",
        contents: [{
          type: "workflow_instruction",
          content: prompts["prompt-user-to-gather-context-from-user"]
        }]
      });
      if(!ctx.model) {
        return Promise.reject(new Error("No model available for the ContextGatheringNode."));
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
          this.gatheredContext.finalise = res;
          this.gatheredContext.abort = rej;
        });
      }
    }
  }

  scrapeContext(gatheredContext: any) {
    let parsedContext = this.neededContextSchema.safeParse(gatheredContext);
    if(parsedContext.success) {
      let vgc = gatheredContext.contexts as T[];
      console.debug("DEBUG: VGC = ",vgc);
      //TODO: Possible accumulation of duplicates here,
      // Should we override duplicates?
      this.gatheredContext.actual.contexts = this.gatheredContext.actual.contexts.concat(vgc);
    } else {
      console.log("Schema validation did not pass when trying to scrape LLM provided gathered context");
    }
  }

  async processLLMOutput(ctx: WorkflowContext, msg: ModelMessage) {
    //TODO: What to do for the other states
    // msg here should conform to the ModelMessage schema.
    //Check the workflow node state here before proceeding
    // If the user has provided the needed context, set it up
    console.log("Got LLM output: ", util.inspect(msg, { depth: null, colors: true }));
    if(this.state === "idle") {
      //TODO: Do nothing, but something might be wrong here
    } else if(this.state === "waiting_on_user") {
      //TODO: this shouldn't happen, throw error
      throw new Error("Waiting on user in ContextGatheringNode ${this.name}.");
    } else if(this.state === "waiting_on_llm") {
      //TODO: Parse the msg here to see if any
      // context has been added by the user
      // or if the LLM wants this node to stop or
      // if any message needs to be surfaced to the user
      console.log("Processing LLM output while waiting on LLM");
      if(msg.role && msg.role === "assistant" && msg.contents) {
        ctx.messages.push(msg);
        for(const m of msg.contents) {
          if(m.type === "workflow_context") {
            //Add to the context if available
            //TODO: Validation of provided context here
            try {
              let gatheredContext = JSON.parse(m.content);
              this.scrapeContext(gatheredContext);
              //TODO: Add context items to the DB
            } catch(error) {
              console.log("Failure when processing the LLM gathered context",error);
            }
          } else if(m.type === "workflow_instruction") {
            //TODO: The stop condition is expected to be the last block, add this to prompt
            let stopCondition = JSON.parse(m.content);
            if(stopCondition.stop && stopCondition.stopReason) {
              this.state = "closed";
              //TODO: Handle changing of active node here
              // Surface gathered context + record stopReason
              console.log(`Exiting the ContextGatheringNode ${this.name} due to ${stopCondition.stopReason}`);
              if(this.gatheredContext.finalise)
                this.gatheredContext.finalise(this.gatheredContext.actual);
            }
          } else if(m.type === "output_to_user" && ctx.userOutputCb) {
            //Surface message to the user:
            await ctx.userOutputCb(m.content);
            //Assume that if a message is surfaced to the user
            //then we're now waiting on them
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
    //Check the workflow node state here before proceeding
    // Pass it onto the LLM
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
        //TODO: LLM provider call needed here
        // Once the output from the user is available,
        // TODO: the LLM should be able to help this node proceed (even this can be perhaps optimised)
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