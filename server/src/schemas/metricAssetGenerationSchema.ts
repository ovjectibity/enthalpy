import { z } from 'zod';

const MetricAssetSchema = z.object({
  name: z.string(),
  formula: z.string(),
  description: z.string(),
  priority: z.string(),
  metricTimeframe: z.string().nullable(),
  retrievalPolicy: z.string().nullable()
});

const MetricAssetGenerationSchema = z.object({
  assets: z.array(MetricAssetSchema)
});

// Export the Zod schema for validation
export const metricAssetGenerationZodSchema = MetricAssetGenerationSchema;

// Export JSON Schema
export const metricAssetGenerationSchema = z.toJSONSchema(MetricAssetGenerationSchema);
