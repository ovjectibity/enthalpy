import { z } from 'zod';

const ObjectiveContextSchema = z.object({
  description: z.string().describe("This is the project objective. All existing user workflow analysis, problem and opportunity identification within that, hypotheses generation and experiment designs will be oriented towards this objective. The objective is a clear 1-line statement usually aligning with some clear goal such as increasing conversions, engagement, retention, growing revenue etc.")
});

const ObjectiveContextGatheringSchema = z.object({
  contexts: z.array(ObjectiveContextSchema)
});

// Export the Zod schema for validation
export const objectiveContextGatheringZodSchema = ObjectiveContextGatheringSchema;

// Export JSON Schema
export const objectiveContextGatheringSchema = z.toJSONSchema(ObjectiveContextGatheringSchema);
