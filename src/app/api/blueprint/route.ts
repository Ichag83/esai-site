import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { callLLM, callLLMMultiTurn, parseLLMJson } from "@/lib/llm";
import {
  UGC_BLUEPRINT_SYSTEM_PROMPT,
  buildBlueprintUserMessage,
  type BlueprintContext,
} from "@/lib/prompts";
import { UGCBlueprintSchema } from "@/lib/schemas/ugcBlueprint";

const BlueprintBodySchema = z.object({
  creative_id: z.string().uuid().optional(),
  generation_request_id: z.string().uuid().optional(),
  product: z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    claims: z.array(z.string()),
    must_show: z.array(z.string()).optional(),
  }),
  persona: z.object({
    description: z.string().min(1),
    wardrobe: z.string().optional(),
    voice: z
      .object({
        gender: z.enum(["female", "male"]),
        energy: z.enum(["calm", "excited", "serious"]),
      })
      .optional(),
  }),
  platform: z.enum(["tiktok", "meta", "youtube"]),
  format: z.enum(["9:16", "16:9"]),
  duration_s: z.number().int().min(8).max(60),
});

function tryParseAndValidate(
  raw: string
): { success: true; data: unknown } | { success: false; error: string } {
  try {
    const json = parseLLMJson(raw);
    const result = UGCBlueprintSchema.safeParse(json);
    if (result.success) return { success: true, data: result.data };
    return { success: false, error: JSON.stringify(result.error.flatten()) };
  } catch (e) {
    return { success: false, error: `JSON parse error: ${String(e)}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BlueprintBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      creative_id,
      generation_request_id,
      product,
      persona,
      platform,
      format,
      duration_s,
    } = parsed.data;

    // Optionally fetch creative DNA to inform the blueprint
    let creative_dna: Record<string, unknown> | null = null;
    if (creative_id) {
      const { data: creative } = await supabase
        .from("creatives")
        .select(
          "hook_type, angle, structure, proof_type, editing_notes, script_skeleton"
        )
        .eq("id", creative_id)
        .eq("user_id", user.id)
        .single();
      if (creative) creative_dna = creative as Record<string, unknown>;
    }

    const ctx: BlueprintContext = {
      product_name: product.name,
      category: product.category,
      claims: product.claims,
      must_show: product.must_show ?? [],
      persona_description: persona.description,
      wardrobe: persona.wardrobe,
      voice_gender: persona.voice?.gender,
      voice_energy: persona.voice?.energy,
      platform,
      format,
      duration_s,
      creative_dna,
    };

    const userMsg = buildBlueprintUserMessage(ctx);

    // First LLM attempt
    const resp1 = await callLLM(UGC_BLUEPRINT_SYSTEM_PROMPT, userMsg);
    let validation = tryParseAndValidate(resp1.content);

    if (!validation.success) {
      // Auto-reprompt once with Zod error summary
      const repromptMsg = `The JSON you returned was invalid. Fix it to match the schema exactly. Return ONLY valid JSON, no markdown.\nErrors: ${validation.error}`;
      const resp2 = await callLLMMultiTurn(UGC_BLUEPRINT_SYSTEM_PROMPT, [
        { role: "user", content: userMsg },
        { role: "assistant", content: resp1.content },
        { role: "user", content: repromptMsg },
      ]);
      validation = tryParseAndValidate(resp2.content);
      if (!validation.success) {
        return NextResponse.json(
          { error: "LLM returned invalid blueprint after reprompt", details: validation.error },
          { status: 502 }
        );
      }
    }

    const blueprint = validation.data;

    // Snapshot the input context
    const input = {
      product,
      persona,
      platform,
      format,
      duration_s,
      creative_id: creative_id ?? null,
      generation_request_id: generation_request_id ?? null,
    };

    const { data: row, error: insertErr } = await supabase
      .from("video_blueprints")
      .insert({
        user_id: user.id,
        creative_id: creative_id ?? null,
        generation_request_id: generation_request_id ?? null,
        input,
        blueprint,
        status: "DONE",
      })
      .select("id")
      .single();

    if (insertErr || !row) {
      console.error("[blueprint] insert error:", insertErr);
      return NextResponse.json({ error: "Failed to save blueprint" }, { status: 500 });
    }

    return NextResponse.json({ blueprint_id: row.id, blueprint });
  } catch (err) {
    console.error("[blueprint] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
