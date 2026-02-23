import { z } from "zod";

/**
 * Schema for the JSON returned by ANALYSIS_SYSTEM_PROMPT.
 * All fields are nullable/optional as the LLM may not always populate them.
 */
export const AnalysisOutputSchema = z.object({
  product_category: z.string().nullable().default(null),
  marketplace_context: z.string().nullable().default(null),
  hook_text: z.string().nullable().default(null),
  hook_type: z.string().nullable().default(null),
  angle: z.string().nullable().default(null),
  structure: z.string().nullable().default(null),
  proof_type: z.string().nullable().default(null),
  objections: z.array(z.string()).default([]),
  cta_type: z.string().nullable().default(null),
  cta_text: z.string().nullable().default(null),
  editing_notes: z
    .object({
      captions: z.string().default("unknown"),
      pacing: z.string().default("unknown"),
      cuts: z.string().default("unknown"),
      framing: z.string().default("unknown"),
      style: z.array(z.string()).default(["unknown"]),
    })
    .nullable()
    .default(null),
  script_skeleton: z.string().nullable().default(null),
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
