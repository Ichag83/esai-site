import { z } from "zod";

/**
 * Strict Zod schema mirroring the JSON SCHEMA block inside ANALYSIS_SYSTEM_PROMPT.
 * Field names, enum values, and nullable rules all match the prompt exactly.
 * .strict() on every object ensures unknown keys returned by the LLM fail fast
 * and trigger the callLLMJson auto-retry with an error summary.
 */

const EditingNotesSchema = z
  .object({
    captions: z.enum(["always", "sometimes", "none", "unknown"]),
    pacing: z.enum(["fast", "medium", "slow", "unknown"]),
    cuts: z.enum(["many", "some", "few", "unknown"]),
    framing: z.enum(["closeup", "medium", "wide", "mixed", "unknown"]),
    style: z.array(
      z.enum([
        "ugc",
        "demo",
        "unboxing",
        "review",
        "voiceover",
        "text_only",
        "screen_recording",
        "unknown",
      ])
    ),
  })
  .strict();

export const AnalysisOutputSchema = z
  .object({
    product_category: z.string().nullable().default(null),
    marketplace_context: z
      .enum(["mercado_livre", "shopee", "tiktok_shop", "instagram", "none"])
      .nullable()
      .default(null),
    hook_text: z.string().nullable().default(null),
    hook_type: z
      .enum([
        "pergunta",
        "promessa",
        "choque",
        "prova",
        "comparacao",
        "lista",
        "historia",
        "urgencia",
        "curiosidade",
      ])
      .nullable()
      .default(null),
    angle: z.string().nullable().default(null),
    structure: z
      .enum([
        "PAS",
        "AIDA",
        "DEMO",
        "REVIEW",
        "UNBOXING",
        "ANTES_DEPOIS",
        "LISTA_3",
        "COMPARATIVO",
        "PROVA_SOCIAL",
        "TUTORIAL",
      ])
      .nullable()
      .default(null),
    proof_type: z
      .enum([
        "demo",
        "social",
        "numeros",
        "autoridade",
        "garantia",
        "ugc",
        "comparativo",
        "nenhuma",
      ])
      .nullable()
      .default(null),
    objections: z.array(z.string()).default([]),
    cta_type: z
      .enum([
        "direto",
        "suave",
        "urgencia",
        "cupom",
        "frete",
        "estoque",
        "whatsapp",
        "link_bio",
      ])
      .nullable()
      .default(null),
    cta_text: z.string().nullable().default(null),
    editing_notes: EditingNotesSchema.nullable().default(null),
    script_skeleton: z.string().nullable().default(null),
  })
  .strict();

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
