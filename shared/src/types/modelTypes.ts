interface Tool {
  id: string, 
  input: ComputerToolInput,
  description: string,
  name: string
}

interface CTLeftClick {
  action: "left_click",
  x: number,
  y: number
}

interface CTRightClick {
  action: "right_click",
  x: number,
  y: number
}

interface CTScroll {
  action: "scroll",
  x: number,
  y: number
}

interface CTType {
  action: "type",
  input: string
}

interface CTScreenshot {
  action: "screenshot"
}

type ComputerToolInput = CTLeftClick | CTRightClick | CTScroll | CTType | CTScreenshot;

class ComputerTool implements Tool {
  name = "computer_use_tool";
  description = "";
  input: ComputerToolInput;
  id: string;

  constructor(id: string, input: ComputerToolInput) {
    this.input = input;
    this.id = id;
  }
}

interface CTResult {
  screengrab: string,
  error?: string
}

interface ToolResult {
  result: CTResult
}

interface ToolUseResult {
  type: "tool_use_result",
  content: ToolResult
}

interface ToolUse {
  type: "tool_use",
  content: Tool
}

interface AssistantRoleWorkflowContentSimpleTypes {
  type: "output_to_user" | 
        "workflow_context" | 
        "workflow_instruction" | 
        "workflow_gen_asset",
  content: string
}

interface UserRoleWorkflowContentSimpleTypes {
  type: "output_to_user" | 
        "workflow_context" |
        "workflow_instruction" | 
        "workflow_gen_asset" | 
        "input_from_user",
  content: string
}

type AssistantRoleWorkflowContentType = AssistantRoleWorkflowContentSimpleTypes | ToolUse; 
type UserRoleWorkflowContentType =  UserRoleWorkflowContentSimpleTypes | ToolUseResult;

interface AssistantModelMessage {
  role: "assistant",
  contents: AssistantRoleWorkflowContentType[]
};

interface UserModelMessage {
  role: "user",
  contents: UserRoleWorkflowContentType[]
};

type ModelMessage = AssistantModelMessage | UserModelMessage;

export { ModelMessage, Tool, ComputerTool, ComputerToolInput, AssistantModelMessage, UserModelMessage }