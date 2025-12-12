interface Tool {
  id: string, 
  name: string;
}

interface ComputerTool extends Tool {
  input: CTInput,
  name: "computer_use"
}

type CTInput = CTLeftClick | CTRightClick | CTScroll | CTType | CTScreenshot;

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

interface ToolResult {
  name: string,
  id: string,
}

interface CTResult extends ToolResult {
  name: "computer_use",
  screengrab?: string,
  error?: string
}

interface ToolUseResult {
  type: "tool_use_result",
  content: CTResult
}

interface ToolUse {
  type: "tool_use",
  content: ComputerTool
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

export { ModelMessage, Tool, ToolUse, ComputerTool, AssistantModelMessage, UserModelMessage, CTInput };
export { CTLeftClick, CTRightClick, CTResult, ToolUseResult, ToolResult, CTScroll, CTType, CTScreenshot };