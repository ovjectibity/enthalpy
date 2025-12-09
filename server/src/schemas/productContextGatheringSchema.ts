import { z } from 'zod';

const ProductContextItemSchema = z.object({
  type: z.enum(["product-page-url", "product-documentation", "product-context", "product-name"]),
  format: z.enum(["url", "text", "doc"]),
  description: z.string().nullable(),
  content: z.string()
});

const ProductContextGatheringSchema = z.object({
  contexts: z.array(ProductContextItemSchema)
});

// Export the Zod schema for validation
export const productContextGatheringZodSchema = ProductContextGatheringSchema;

// Export JSON Schema
export const productContextGatheringSchema = z.toJSONSchema(ProductContextGatheringSchema);
