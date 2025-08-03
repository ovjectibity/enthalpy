import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import {Tool} from '@anthropic-ai/sdk/resources';
import { match } from 'assert';

const app = express();
const port = 3001;

app.get('/',(_req, res) => {
    res.send();
});

app.listen(port, () => {
    console.log("Server running at http://localhost:${port}");
});

class FlowGraphGenerator {
    iterationCap: number;
    basePrompt: string;
    specificPrompt: string;
    
    constructor() {
        this.iterationCap = 20;
        this.basePrompt = "";
        this.specificPrompt = "";
    }

    generateFlowGraph(): FlowGraph {
        let graph = new FlowGraph();
        //agent loop to generate the flow graph
        for(let i = 0;i < this.iterationCap; i++) { 

        }
        return graph;
    }
}

class Model {
    maxTokens: number;
    model: string;
    apiKey: string;

    constructor() {
        this.maxTokens = 1024;
        this.model = 'claude-sonnet-4-20250514';
        this.apiKey = require('app_config.json').anthropic_api_key;
    }

    async generateResponse(tools: Tool[],prompt: string) {
        const client = new Anthropic({
            apiKey: process.env[this.apiKey]
        });
        let acc: Tool[] = [];
        let serialisedTools: Tool[] = tools.reduce(
            (prevTool, curTool, index, acc) => {
            // acc.push(curTool.serialise());
            return acc;
        },acc);

        const message = await client.messages.create({
            max_tokens: this.maxTokens,
            messages: [{ role: 'user', content: prompt }],
            model: this.model,
            tools: serialisedTools
        });
        return message.content
    }

    addTools(): Tool[] {
        return [new ComputerTool()];
    }
}

class ComputerTool implements Tool {
    name: string;
    input_schema: Tool.InputSchema;
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
            type: "object"
        };
    }

    act(action: string) {
        if(action == "screenshot") {

        } else if(action = "left_click") {

        } else if(action = "type") {
            
        } else if(action = "key") {
            
        } else if(action = "mouse_move") {
            
        } else if(action = "scroll") {
            
        } else if(action = "left_click_drag") {
            
        } else if(action = "right_click") {
            
        } else if(action = "middle_click") {
            
        } else if(action = "double_click") {
            
        } else if(action = "triple_click") {
            
        } else if(action = "left_mouse_down") {
            
        } else if(action = "left_mouse_up") {
            
        } else if(action = "hold_key") {
            
        } else if(action = "wait") {
            
        }
    }
}

class Node {
    constructor() {
    }
}

//Handles construction of the actions taken by the comp agent; 
class FlowGraph {
    systemContext: String;
    nodeChain: Node[];
    tools: Tool[];

    constructor() {
        this.systemContext = "";
        this.nodeChain = [];
        this.tools = [];
    }

    addNode(node: Node) {
        
    }

    executeAction() {

    }

    genAction() {

    }
}
