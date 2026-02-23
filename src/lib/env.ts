import { z } from "zod";

const EnvSchema = z.object({
  LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("anthropic"),
  LLM_MODEL: z.string().min(1).default("claude-sonnet-4-5"),
  LLM_API_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const msg = `[env] Missing/invalid environment variables:\n${JSON.stringify(
      result.error.flatten().fieldErrors,
      null,
      2
    )}`;

    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    }

    console.warn(msg);

    // In development: return best-effort values so the dev server still starts
    return {
      LLM_PROVIDER: (process.env.LLM_PROVIDER as "openai" | "anthropic") ?? "anthropic",
      LLM_MODEL: process.env.LLM_MODEL ?? "claude-sonnet-4-5",
      LLM_API_KEY: process.env.LLM_API_KEY ?? "",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    };
  }

  return result.data;
}

export const env = loadEnv();
