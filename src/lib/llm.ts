/**
 * Configurable LLM client.
 * Supports OpenAI and Anthropic based on LLM_PROVIDER env var.
 */

import { type ZodType } from "zod";
import { env } from "./env";

interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface LLMResponse {
  content: string;
}

export async function callLLM(
  systemPrompt: string,
  userMessage: string
): Promise<LLMResponse> {
  const { LLM_PROVIDER: provider, LLM_API_KEY: apiKey, LLM_MODEL: model } = env;

  if (provider === "anthropic") {
    return callAnthropic(systemPrompt, userMessage, apiKey, model);
  } else if (provider === "openai") {
    return callOpenAI(systemPrompt, userMessage, apiKey, model);
  } else {
    throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  }
}

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string
): Promise<LLMResponse> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in Anthropic response");
  }

  return { content: textBlock.text };
}

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string
): Promise<LLMResponse> {
  const { default: OpenAI } = await import("openai");

  const client = new OpenAI({ apiKey });

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  return { content };
}

/**
 * Parse JSON from LLM response, stripping markdown fences if present.
 */
export function parseLLMJson<T = unknown>(raw: string): T {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  return JSON.parse(stripped) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization — fixes common enum variants before Zod validation
// Reduces unnecessary retries without weakening schema strictness.
// Only string leaves under known enum keys are touched; all other values
// (script beats, captions, free-text fields) pass through unchanged.
// ─────────────────────────────────────────────────────────────────────────────

function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Keys whose string value is an enum and should be normalized
const ENUM_STRING_KEYS = new Set([
  "marketplace_context",
  "hook_type",
  "type", // generation: hook.type and cta.type
  "structure",
  "proof_type",
  "cta_type",
  "pacing",
  "cuts",
  "framing",
  "captions",
  "recommended_angle",
]);

// Keys whose value is an array of enum strings
const ENUM_ARRAY_KEYS = new Set(["style"]);

// Per-key synonym maps; lookup is done on the lowercased, accent-stripped value
const ENUM_MAP: Record<string, Record<string, string>> = {
  marketplace_context: {
    "mercadolivre": "mercado_livre",
    "mercado livre": "mercado_livre",
    "ml": "mercado_livre",
    "tiktok shop": "tiktok_shop",
    "tik tok shop": "tiktok_shop",
    "tiktokshop": "tiktok_shop",
    "instagram shop": "instagram",
    "ig": "instagram",
    "insta": "instagram",
    "nenhum": "none",
    "n/a": "none",
  },
  structure: {
    "pas": "PAS",
    "aida": "AIDA",
    "demo": "DEMO",
    "review": "REVIEW",
    "unboxing": "UNBOXING",
    "antes_depois": "ANTES_DEPOIS",
    "antes depois": "ANTES_DEPOIS",
    "lista_3": "LISTA_3",
    "lista3": "LISTA_3",
    "comparativo": "COMPARATIVO",
    "prova_social": "PROVA_SOCIAL",
    "prova social": "PROVA_SOCIAL",
    "tutorial": "TUTORIAL",
  },
  proof_type: {
    "prova social": "social",
  },
  cta_type: {
    "whats": "whatsapp",
    "whats app": "whatsapp",
    "link na bio": "link_bio",
    "link_na_bio": "link_bio",
  },
  // "type" covers generation's hook.type and cta.type (values are disjoint)
  type: {
    "whats": "whatsapp",
    "whats app": "whatsapp",
    "link na bio": "link_bio",
    "link_na_bio": "link_bio",
    "prova social": "prova",
  },
};

function normalizeEnumString(key: string, raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  const lowered = trimmed.toLowerCase();
  const noAccent = removeAccents(lowered);

  const map = ENUM_MAP[key];
  if (map) {
    // Prefer accent-stripped lookup, fall back to lowered-with-accents
    if (map[noAccent] !== undefined) return map[noAccent];
    if (map[lowered] !== undefined) return map[lowered];
  }

  // Default: return accent-stripped lowercase (handles capitalization and
  // accent variants for all other known enum fields like hook_type, pacing, etc.)
  return noAccent;
}

function normalizeFieldValue(key: string, value: unknown): unknown {
  if (Array.isArray(value)) {
    if (ENUM_ARRAY_KEYS.has(key)) {
      return value.map((item) =>
        typeof item === "string" ? normalizeEnumString(key, item) : item
      );
    }
    return value.map(normalizeLLMJsonCandidate);
  }

  if (value !== null && typeof value === "object") {
    return normalizeLLMJsonCandidate(value);
  }

  if (typeof value === "string" && ENUM_STRING_KEYS.has(key)) {
    return normalizeEnumString(key, value);
  }

  return value;
}

/**
 * Recursively walk the parsed LLM JSON and fix common enum variants.
 * Only values under known enum keys are touched; free-text fields are not.
 * Exported for unit testing.
 */
export function normalizeLLMJsonCandidate(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(normalizeLLMJsonCandidate);
  }
  if (input !== null && typeof input === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>
    )) {
      result[key] = normalizeFieldValue(key, value);
    }
    return result;
  }
  return input;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-turn support (used for auto-reprompt on invalid JSON)
// ─────────────────────────────────────────────────────────────────────────────

export type MultiTurnMessage = { role: "user" | "assistant"; content: string };

/**
 * Call the LLM with a multi-turn conversation (e.g. for auto-reprompt on
 * invalid JSON: user → assistant (bad) → user (fix instructions)).
 */
export async function callLLMMultiTurn(
  systemPrompt: string,
  messages: MultiTurnMessage[]
): Promise<LLMResponse> {
  const { LLM_PROVIDER: provider, LLM_API_KEY: apiKey, LLM_MODEL: model } = env;

  if (provider === "anthropic") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in Anthropic response");
    }
    return { content: textBlock.text };
  } else if (provider === "openai") {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }
    return { content };
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// callLLMJson — validated LLM call with Zod schema + one auto-retry
// ─────────────────────────────────────────────────────────────────────────────

const _debug = process.env.NODE_ENV !== "production";

/**
 * Call the LLM, parse JSON, and validate against a Zod schema.
 * If validation fails, sends a single corrective follow-up prompt.
 * Throws if still invalid after one retry.
 *
 * Logs debug info (provider, model, latency, retry status) outside production.
 */
export async function callLLMJson<T>({
  system,
  user,
  schema,
}: {
  system: string;
  user: string;
  schema: ZodType<T>;
}): Promise<T> {
  const t0 = Date.now();

  const resp = await callLLM(system, user);

  if (_debug) {
    console.debug(
      `[llm] callLLMJson provider=${env.LLM_PROVIDER} model=${env.LLM_MODEL} time=${Date.now() - t0}ms retry=false`
    );
  }

  // First parse + normalize + validate
  let raw: unknown;
  try {
    raw = normalizeLLMJsonCandidate(parseLLMJson(resp.content));
  } catch {
    raw = null;
  }

  const r1 = schema.safeParse(raw);
  if (r1.success) {
    if (_debug) console.debug("[llm] callLLMJson validated OK (attempt 1)");
    return r1.data;
  }

  // Auto-retry once
  if (_debug) {
    console.debug(
      `[llm] callLLMJson provider=${env.LLM_PROVIDER} model=${env.LLM_MODEL} time=${Date.now() - t0}ms retry=true`
    );
    console.debug("[llm] validation errors:", r1.error.flatten());
  }

  const errorSummary = JSON.stringify(r1.error.flatten());
  const fixMsg = `The JSON you returned was invalid. Fix it to match the schema exactly. Return ONLY valid JSON.\n\nValidation errors:\n${errorSummary}`;

  const resp2 = await callLLMMultiTurn(system, [
    { role: "user", content: user },
    { role: "assistant", content: resp.content },
    { role: "user", content: fixMsg },
  ]);

  let raw2: unknown;
  try {
    raw2 = normalizeLLMJsonCandidate(parseLLMJson(resp2.content));
  } catch (e) {
    throw new Error(`LLM returned unparseable JSON after retry: ${String(e)}`);
  }

  const r2 = schema.safeParse(raw2);
  if (r2.success) {
    if (_debug) console.debug("[llm] callLLMJson validated OK (after retry)");
    return r2.data;
  }

  throw new Error(
    `LLM output failed schema validation after 1 retry: ${JSON.stringify(r2.error.flatten())}`
  );
}
