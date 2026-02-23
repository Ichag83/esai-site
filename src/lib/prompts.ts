/**
 * LLM prompt templates for Creative Brain BR.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Analysis prompt — rotulagem (labeling) of an existing ad
// ─────────────────────────────────────────────────────────────────────────────

export const ANALYSIS_SYSTEM_PROMPT = `You are an expert performance creative strategist for Brazilian ads (pt-BR).
Extract a structured "creative DNA" from the ad content.
Return ONLY valid JSON that matches the provided schema. No extra keys. No markdown.

Context:
- Country focus: Brazil
- Language: pt-BR (even if ad has mixed language)
- Platforms: TikTok and Instagram/Facebook (Meta)
- Goal: classify hooks, angles, structure, proof, CTAs, objections, editing style.

JSON SCHEMA:
{
  "product_category": "string|null",
  "marketplace_context": "mercado_livre|shopee|tiktok_shop|instagram|none|null",
  "hook_text": "string|null",
  "hook_type": "pergunta|promessa|choque|prova|comparacao|lista|historia|urgencia|curiosidade|null",
  "angle": "string|null",
  "structure": "PAS|AIDA|DEMO|REVIEW|UNBOXING|ANTES_DEPOIS|LISTA_3|COMPARATIVO|PROVA_SOCIAL|TUTORIAL|null",
  "proof_type": "demo|social|numeros|autoridade|garantia|ugc|comparativo|nenhuma|null",
  "objections": ["string"],
  "cta_type": "direto|suave|urgencia|cupom|frete|estoque|whatsapp|link_bio|null",
  "cta_text": "string|null",
  "editing_notes": {
    "captions": "always|sometimes|none|unknown",
    "pacing": "fast|medium|slow|unknown",
    "cuts": "many|some|few|unknown",
    "framing": "closeup|medium|wide|mixed|unknown",
    "style": ["ugc","demo","unboxing","review","voiceover","text_only","screen_recording","unknown"]
  },
  "script_skeleton": "string|null"
}

Rules:
- If unsure, use null or "unknown" where allowed.
- "objections" should be inferred carefully from content (e.g., price, durability, trust, delivery, warranty, pix).
- "hook_text" must be the first attention-grabbing line/frame as text.
- script_skeleton should be a short outline with 4-7 beats, in pt-BR, no emojis.
Return JSON only.`;

export interface AnalysisInput {
  platform: string;
  marketplace_context: string;
  caption?: string | null;
  on_screen_text?: string | null;
  dialogue?: string | null;
  notes?: string | null;
}

export function buildAnalysisUserMessage(input: AnalysisInput): string {
  return `INPUT AD CONTENT:
Platform: ${input.platform}
Marketplace context: ${input.marketplace_context}
Ad text/caption: ${input.caption ?? "(not provided)"}
On-screen text (if any): ${input.on_screen_text ?? "(not provided)"}
Spoken dialogue (if any): ${input.dialogue ?? "(not provided)"}
Other notes: ${input.notes ?? "(none)"}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generation prompt — create ad variation batches from patterns + product
// ─────────────────────────────────────────────────────────────────────────────

export const GENERATION_SYSTEM_PROMPT = `You are a Brazilian performance creative generator for short-form ads.
You must create multiple distinct variations designed for testing.
Return ONLY JSON. No markdown.

RULES:
- Hooks must be meaningfully different across variations.
- Scripts must be short, spoken-natural pt-BR, no slang heavy.
- Mention BR objections when relevant (Pix, frete, garantia, original, confiança), but don't overstuff.
- Keep it compliant: do not invent certifications, medical claims, or impossible guarantees.
- Captions must be short and readable.
Return JSON only.`;

export interface PatternSummary {
  pattern_name: string;
  hook_formula: string;
  structure: string;
  script_skeleton: string;
  why_it_works: string;
}

export interface GenerationInput {
  output_count: number;
  target_platform: string;
  product_name: string;
  product_category: string;
  marketplace_context: string;
  product_description: string;
  product_bullets: string[];
  price: string;
  offer_terms: Record<string, unknown>;
  target_audience: string;
  constraints: Record<string, unknown>;
  patterns: PatternSummary[];
}

export function buildGenerationUserMessage(input: GenerationInput): string {
  const patternsList =
    input.patterns.length > 0
      ? input.patterns
          .map(
            (p, i) =>
              `Pattern ${i + 1}: ${p.pattern_name}\n  Hook formula: ${p.hook_formula}\n  Structure: ${p.structure}\n  Skeleton: ${p.script_skeleton}\n  Why it works: ${p.why_it_works}`
          )
          .join("\n\n")
      : "No patterns available — use general Brazilian ecom ad best practices.";

  return `GOAL:
Generate ${input.output_count} ad variations for ${input.target_platform} with Brazilian tone (pt-BR),
optimized for the first 3 seconds hook, quick pacing, clear benefit, proof, and CTA.

PRODUCT INFO:
Name: ${input.product_name}
Category: ${input.product_category}
Marketplace context: ${input.marketplace_context}
Description: ${input.product_description}
Bullets: ${input.product_bullets.join(", ")}
Price: ${input.price}
Offer terms: ${JSON.stringify(input.offer_terms)}
Audience: ${input.target_audience}
Constraints: ${JSON.stringify(input.constraints)}

AVAILABLE PATTERNS (use these as inspiration; do not copy verbatim):
${patternsList}

OUTPUT JSON SCHEMA:
{
  "variations": [
    {
      "variation_id": "v1",
      "hook": {
        "text": "string",
        "type": "pergunta|promessa|choque|prova|comparacao|lista|historia|urgencia|curiosidade"
      },
      "script": {
        "beats": ["string","string","string","string","string"],
        "duration_s": 20
      },
      "on_screen_captions": ["string","string","string"],
      "editing_direction": {
        "pacing": "fast|medium",
        "cuts": "many|some",
        "framing": "closeup|mixed",
        "notes": "string"
      },
      "cta": {
        "type": "direto|suave|urgencia|cupom|frete|estoque|whatsapp|link_bio",
        "text": "string"
      },
      "claims_to_avoid": ["string"]
    }
  ]
}`;
}
