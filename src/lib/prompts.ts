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
- Platforms: TikTok and Meta (Instagram/Facebook)
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
- visual_plan.shots must be concrete and filmable directions; do NOT invent product attributes not listed.
- If product images are provided (URLs listed), reference their real visual elements in the visual_plan.
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
  /** Public URLs of uploaded product photos. Empty array = no photos. */
  product_image_urls: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// UGC Blueprint prompt — generate a full video blueprint JSON
// ─────────────────────────────────────────────────────────────────────────────

export const UGC_BLUEPRINT_SYSTEM_PROMPT = `You are a UGC (User-Generated Content) video director specializing in Brazilian performance ads for TikTok, Meta, and YouTube.
Your task is to produce a complete video blueprint for a single UGC video.
Return ONLY valid JSON matching the exact schema below. No markdown, no commentary, no extra keys.

The output must describe a realistic UGC-style video with:
- Smartphone aesthetic (not cinematic)
- A Brazilian creator featuring the product (not a real person; original description only)
- Natural ambient lighting, slight handheld feel, authentic Brazilian environment
- Dialogue entirely in pt-BR
- Specific scene-by-scene breakdown where each scene's "seconds" is "start-end" (integers)

REQUIRED JSON SCHEMA:
{
  "video": {
    "duration_s": <integer 8-60>,
    "format": "9:16" | "16:9",
    "style": "UGC selfie" | "UGC tripod" | "POV demo",
    "language": "pt-BR"
  },
  "cast": [
    {
      "role": "creator",
      "description": "<Brazilian-identifiable features; not a real person>",
      "wardrobe": "<casual Brazilian everyday clothing>",
      "voice": {
        "gender": "female" | "male",
        "accent": "br",
        "energy": "calm" | "excited" | "serious"
      }
    }
  ],
  "product": {
    "name": "<string>",
    "category": "<string>",
    "claims": ["<string>"],
    "must_show": ["<what must appear on camera>"]
  },
  "scenes": [
    {
      "scene_id": "<s1, s2, ...>",
      "seconds": "<start-end e.g. 0-3>",
      "camera": {
        "shot": "close-up" | "medium" | "wide",
        "rig": "handheld selfie" | "tripod" | "overhead",
        "movement": "static" | "slight shake" | "pan" | "push-in",
        "lens": "smartphone"
      },
      "environment": "<specific Brazilian location/room description>",
      "action": "<what the creator does in this scene>",
      "dialogue": "<spoken pt-BR lines>",
      "on_screen_text": "<overlay text or null>",
      "audio_notes": "<background music style or null>",
      "editing": "<cut timing or effects or null>"
    }
  ]
}

Rules:
- All scenes must together cover exactly video.duration_s seconds (±2s allowed).
- scene_id must be "s1", "s2", ... in sequence.
- "seconds" format: "start-end" (integers, start < end, end ≤ duration_s).
- Dialogue must be natural spoken pt-BR for a young Brazilian creator — conversational, not scripted-sounding.
- Do NOT embed on_screen_text into the video prompt; keep it as a separate field for overlays.
- Cast description must be original and must not reference any real person.
- Anti-cinematic rules: no dramatic lighting, no slow motion, no heavy camera movements.
Return JSON only.`;

export interface BlueprintContext {
  product_name: string;
  category: string;
  claims: string[];
  must_show: string[];
  persona_description: string;
  wardrobe?: string;
  voice_gender?: "female" | "male";
  voice_energy?: "calm" | "excited" | "serious";
  platform: "tiktok" | "meta" | "youtube";
  format: "9:16" | "16:9";
  duration_s: number;
  creative_dna?: Record<string, unknown> | null;
}

export function buildBlueprintUserMessage(ctx: BlueprintContext): string {
  const dnaSection = ctx.creative_dna
    ? `\nCREATIVE DNA (from a successful ad — mimic its structure and hook patterns):\n${JSON.stringify(ctx.creative_dna, null, 2)}`
    : "";

  return `Create a UGC video blueprint for the following product:

PRODUCT: ${ctx.product_name}
CATEGORY: ${ctx.category}
KEY CLAIMS: ${ctx.claims.join(", ")}
MUST SHOW ON CAMERA: ${ctx.must_show.length > 0 ? ctx.must_show.join(", ") : "the product clearly"}

CREATOR PERSONA:
- Description: ${ctx.persona_description}
- Wardrobe: ${ctx.wardrobe ?? "casual everyday Brazilian clothing"}
- Voice gender: ${ctx.voice_gender ?? "female"}
- Energy: ${ctx.voice_energy ?? "excited"}

VIDEO SPECS:
- Platform: ${ctx.platform}
- Format: ${ctx.format}
- Duration: ${ctx.duration_s} seconds
- Style: UGC selfie (preferred for ${ctx.platform})
${dnaSection}
Return ONLY the JSON blueprint.`;
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

  const imagesSection =
    input.product_image_urls.length > 0
      ? `\nPRODUCT IMAGES (${input.product_image_urls.length} photo(s) uploaded by seller):
${input.product_image_urls.map((u, i) => `  Image ${i + 1}: ${u}`).join("\n")}
When writing visual_plan, reference the real product photos above. Do NOT invent visual details not supported by the product description.`
      : "\nPRODUCT IMAGES: None provided. Base visual_plan on product description and category conventions.";

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
${imagesSection}

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
      "visual_plan": {
        "shots": ["string","string","string"],
        "image_usage": "string",
        "recommended_angle": "closeup|overhead|eye_level|45deg"
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
