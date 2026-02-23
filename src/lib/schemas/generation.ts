import { z } from "zod";

/**
 * Strict Zod schema mirroring the OUTPUT JSON SCHEMA block inside
 * buildGenerationUserMessage() in prompts.ts.
 * Field names, enum values, and array types all match the prompt exactly.
 * .strict() on every object ensures unknown keys fail fast and trigger
 * the callLLMJson auto-retry.
 */

const HookSchema = z
  .object({
    text: z.string(),
    type: z.enum([
      "pergunta",
      "promessa",
      "choque",
      "prova",
      "comparacao",
      "lista",
      "historia",
      "urgencia",
      "curiosidade",
    ]),
  })
  .strict();

const ScriptSchema = z
  .object({
    beats: z.array(z.string()),
    duration_s: z.number(),
  })
  .strict();

const EditingDirectionSchema = z
  .object({
    pacing: z.enum(["fast", "medium"]),
    cuts: z.enum(["many", "some"]),
    framing: z.enum(["closeup", "mixed"]),
    notes: z.string(),
  })
  .strict();

const VisualPlanSchema = z
  .object({
    shots: z.array(z.string()),
    image_usage: z.string(),
    recommended_angle: z.enum(["closeup", "overhead", "eye_level", "45deg"]),
  })
  .strict();

const CtaSchema = z
  .object({
    type: z.enum([
      "direto",
      "suave",
      "urgencia",
      "cupom",
      "frete",
      "estoque",
      "whatsapp",
      "link_bio",
    ]),
    text: z.string(),
  })
  .strict();

const VariationSchema = z
  .object({
    variation_id: z.string(),
    hook: HookSchema,
    script: ScriptSchema,
    on_screen_captions: z.array(z.string()),
    editing_direction: EditingDirectionSchema,
    visual_plan: VisualPlanSchema,
    cta: CtaSchema,
    claims_to_avoid: z.array(z.string()),
  })
  .strict();

export const GenerationOutputSchema = z
  .object({
    variations: z.array(VariationSchema).min(1),
  })
  .strict();

export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;
export type Variation = z.infer<typeof VariationSchema>;
