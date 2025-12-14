import { z } from 'zod';
import { ModelMessage } from '@enthalpy/shared';

// Computer Tool Input schemas (CTInput)
const CTLeftClickSchema = z.object({
  action: z.literal("left_click"),
  x: z.number().describe("X coordinate"),
  y: z.number().describe("Y coordinate")
}).describe("Perform a left mouse click at coordinates");

const CTRightClickSchema = z.object({
  action: z.literal("right_click"),
  x: z.number().describe("X coordinate"),
  y: z.number().describe("Y coordinate")
}).describe("Perform a right mouse click at coordinates");

const CTScrollSchema = z.object({
  action: z.literal("scroll"),
  x: z.number().describe("Horizontal scroll amount"),
  y: z.number().describe("Vertical scroll amount")
}).describe("Perform a scroll action at coordinates");

const CTTypeSchema = z.object({
  action: z.literal("type"),
  input: z.string().describe("Text to type")
}).describe("Type text input");

const CTScreenshotSchema = z.object({
  action: z.literal("screenshot")
}).describe("Take a screenshot");

const CTInputSchema = z.union([
  CTLeftClickSchema,
  CTRightClickSchema,
  CTScrollSchema,
  CTTypeSchema,
  CTScreenshotSchema
]).describe("The specific computer action to perform");

// Computer Tool schema
const ComputerToolSchema = z.object({
  id: z.string().describe("Unique identifier for this tool use"),
  name: z.literal("computer_use").describe("Name of the tool"),
  input: CTInputSchema
}).describe("Computer use tool");

// Assistant content types
const AssistantSimpleWorkflowContentSchema = z.object({
  type: z.enum(["output_to_user", "workflow_context", "workflow_instruction", "workflow_gen_asset"])
    .describe("Type of workflow content from the assistant:\n\n1. **output_to_user:** Message you want to send to the end user.\n2. **workflow_context:** Context you've gathered from the user via interaction which will aid towards some goal. The gathered context is to be in a specific JSON format the schema for which will be shared with you via a `workflow_instruction` message type. Adhere to this schema strictly when sharing this message type. Add no other text.\n3. **workflow_instruction:** Not valid for assistant messages. Will be ignored if provided.\n4. **workflow_gen_asset:** Generated asset content as part of a workflow."),
  content: z.string().describe("Actual contents of the workflow message")
});

const ToolUseSchema = z.object({
  type: z.literal("tool_use").describe("Indicates this content is a tool use request"),
  content: ComputerToolSchema
}).describe("Tool invocation from the assistant");

const AssistantRoleWorkflowContentTypeSchema = z.union([
  AssistantSimpleWorkflowContentSchema,
  ToolUseSchema
]);

// User content types
const CTResultSchema = z.object({
  name: z.literal("computer_use").describe("Tool name"),
  id: z.string().describe("Tool use ID"),
  screengrab: z.string().optional().describe("Base64 encoded screenshot image from the computer use action"),
  error: z.string().optional().describe("Error message if the tool execution failed")
}).describe("Result of the computer tool action");

const ToolUseResultSchema = z.object({
  type: z.literal("tool_use_result").describe("Indicates this content is a tool use result"),
  content: CTResultSchema
}).describe("Result of a computer use tool invocation");

const UserSimpleWorkflowContentSchema = z.object({
  type: z.enum(["output_to_user", "workflow_context", "workflow_instruction", "workflow_gen_asset", "input_from_user"])
    .describe("Type of workflow content from the user/Enthalpy app:\n\n1. **output_to_user:** Message that the Enthalpy app has sent to the end user directly. Usually Enthalpy forwards messages you generate, but at times it sends its own messages and those interactions are captured via this workflow message type.\n2. **input_from_user:** Message that the end user has sent which Enthalpy is forwarding to you.\n3. **workflow_instruction:** Additional instruction pertaining to the objective of the workflow being pursued. It is necessary that you take this context into account for any further tasks. It usually should be consistent with everything that has been said before but in case it is not, consider this an overriding instruction mechanism that you should conform to.\n4. **workflow_context:** Gathered context pertaining to a workflow which adheres to a specific schema as defined separately via a workflow_instruction message type. The gathered context is information provided by the user to Enthalpy which aids the workflow. These are primarily used in workflows aimed at context gathering which is then used in a downstream workflow.\n5. **workflow_gen_asset:** Generated asset content provided as part of a workflow."),
  content: z.string().describe("Actual contents of the workflow message")
});

const UserRoleWorkflowContentTypeSchema = z.union([
  UserSimpleWorkflowContentSchema,
  ToolUseResultSchema
]);

// Model Message schemas
const AssistantModelMessageSchema = z.object({
  role: z.literal("assistant").describe("The role describes that this message content is generated by the assistant i.e. the LLM."),
  contents: z.array(AssistantRoleWorkflowContentTypeSchema).describe("This field is an array of content items of various types. Multiple content items may be included in this array, should be treated as a concurrent stream of ordered information.")
}).describe("Message from the assistant/LLM");

const UserModelMessageSchema = z.object({
  role: z.literal("user").describe("The role describes that this message content is generated by the user i.e. the Enthalpy app."),
  contents: z.array(UserRoleWorkflowContentTypeSchema).describe("This field is an array of content items of various types. Multiple content items may be included in this array, should be treated as a concurrent stream of ordered information.")
}).describe("Message from the user/Enthalpy app");

// Union of assistant and user messages
export const ModelMessageSchema = z.union([
  AssistantModelMessageSchema,
  UserModelMessageSchema
]) satisfies z.ZodType<ModelMessage>;

// Export the Zod schema for validation
export const modelMessageZodSchema = ModelMessageSchema;

// Export JSON Schema for Anthropic API
export const modelMessageSchemaUpdated = z.toJSONSchema(ModelMessageSchema as any) as any;
