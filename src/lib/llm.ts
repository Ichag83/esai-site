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

  // First parse + validate
  let raw: unknown;
  try {
    raw = parseLLMJson(resp.content);
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
    raw2 = parseLLMJson(resp2.content);
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
