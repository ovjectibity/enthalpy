import { z } from 'zod';
import { CTInput } from '@enthalpy/shared';

// Computer Tool Input schemas matching CTInput type
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
}).describe("Perform a scroll action");

const CTTypeSchema = z.object({
  action: z.literal("type"),
  input: z.string().describe("Text to type")
}).describe("Type text input");

const CTScreenshotSchema = z.object({
  action: z.literal("screenshot")
}).describe("Take a screenshot");

// CTInput union type
export const CTInputZodSchema = z.union([
  CTLeftClickSchema,
  CTRightClickSchema,
  CTScrollSchema,
  CTTypeSchema,
  CTScreenshotSchema
]) satisfies z.ZodType<CTInput>;

// Export JSON Schema for Anthropic API
export const computerUseToolInputSchema = z.toJSONSchema(CTInputZodSchema as any) as any;
