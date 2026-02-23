/**
 * Configurable LLM client.
 * Supports OpenAI and Anthropic based on LLM_PROVIDER env var.
 */

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
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not set");
  }

  if (provider === "anthropic") {
    return callAnthropic(systemPrompt, userMessage, apiKey, model ?? "claude-sonnet-4-5");
  } else if (provider === "openai") {
    return callOpenAI(systemPrompt, userMessage, apiKey, model ?? "gpt-4o");
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
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not set");
  }

  if (provider === "anthropic") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: model ?? "claude-sonnet-4-5",
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
      model: model ?? "gpt-4o",
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
