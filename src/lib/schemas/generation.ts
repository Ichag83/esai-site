import { z } from "zod";

/**
 * Schema for a single ad variation returned by GENERATION_SYSTEM_PROMPT.
 */
const VariationSchema = z.object({
  variation_id: z.string(),
  hook: z.object({
    text: z.string(),
    type: z.string(),
  }),
  script: z.object({
    beats: z.array(z.string()),
    duration_s: z.number(),
  }),
  on_screen_captions: z.array(z.string()).default([]),
  editing_direction: z.object({
    pacing: z.string(),
    cuts: z.string(),
    framing: z.string(),
    notes: z.string(),
  }),
  visual_plan: z.object({
    shots: z.array(z.string()),
    image_usage: z.string(),
    recommended_angle: z.string(),
  }),
  cta: z.object({
    type: z.string(),
    text: z.string(),
  }),
  claims_to_avoid: z.array(z.string()).default([]),
});

/**
 * Schema for the JSON returned by GENERATION_SYSTEM_PROMPT.
 */
export const GenerationOutputSchema = z.object({
  variations: z.array(VariationSchema).min(1),
});

export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;
export type Variation = z.infer<typeof VariationSchema>;
