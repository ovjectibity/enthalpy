import { z } from 'zod';

// Define the Zod schema for computer use tool input
export const ComputerUseToolInputZodSchema = z.object({
  action: z.string().describe("Possible actions: screenshot, left_click, right_click, scroll, type"),
  coordinates: z.object({
    x: z.number().describe("The X coordinate over which a click needs to be made."),
    y: z.number().describe("The Y coordinate over which a click needs to be made.")
  }).describe("X & Y screen coordinates over which the click needs to be made.").optional(),
  scroll_distance: z.object({
    dx: z.number().describe("The dX distance in the horizontal axis over which scroll needs to be made. While this can be any real value, but it is strongly suggested to not use values whose absolute figures are larger than the X screen dimension."),
    dy: z.number().describe("The dY distance in the vertical axis over which scroll needs to be made. While this can be any real value, but it is strongly suggested to not use values whose absolute figures are larger than the Y screen dimension.")
  }).describe("dX & dY distances in screen coordinates over which the scroll needs to be made.").optional(),
  key_input: z.string().describe("The Unicode string that needs to be typed.").optional()
}).describe("Directly interact with a standlone computer system with this tool.");

// Export JSON Schema for Anthropic API
export const computerUseToolInputSchema = z.toJSONSchema(ComputerUseToolInputZodSchema);
