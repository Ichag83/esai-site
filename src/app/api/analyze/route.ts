import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { callLLM, parseLLMJson } from "@/lib/llm";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisUserMessage,
} from "@/lib/prompts";

const AnalyzeBodySchema = z.object({
  creative_id: z.string().uuid("creative_id must be a valid UUID"),
  // Optional: n8n or external caller can pass raw snapshot text directly
  raw_snapshot: z
    .object({
      caption: z.string().optional(),
      on_screen_text: z.string().optional(),
      dialogue: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AnalyzeBodySchema.safeParse(body);

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

    const { creative_id, raw_snapshot } = parsed.data;

    // Load the creative
    const { data: creative, error: fetchError } = await supabase
      .from("creatives")
      .select("*")
      .eq("id", creative_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !creative) {
      return NextResponse.json({ error: "Creative not found" }, { status: 404 });
    }

    // Build prompt input — use raw_snapshot if provided, otherwise use stored fields
    const snapshotData = raw_snapshot ?? creative.raw_snapshot ?? {};

    const userMessage = buildAnalysisUserMessage({
      platform: creative.source_platform,
      marketplace_context: creative.marketplace_context,
      caption: snapshotData.caption ?? null,
      on_screen_text: snapshotData.on_screen_text ?? null,
      dialogue: snapshotData.dialogue ?? null,
      notes: snapshotData.notes ?? null,
    });

    // Call LLM
    let llmResult: Record<string, unknown>;
    try {
      const response = await callLLM(ANALYSIS_SYSTEM_PROMPT, userMessage);
      llmResult = parseLLMJson<Record<string, unknown>>(response.content);
    } catch (llmErr) {
      console.error("[analyze] LLM error:", llmErr);

      await supabase
        .from("creatives")
        .update({ status: "FAILED" })
        .eq("id", creative_id);

      return NextResponse.json({ error: "LLM analysis failed" }, { status: 502 });
    }

    // Update creative with extracted fields
    const updatePayload = {
      status: "DONE",
      product_category: llmResult.product_category ?? creative.product_category,
      marketplace_context:
        llmResult.marketplace_context ?? creative.marketplace_context,
      hook_text: llmResult.hook_text ?? null,
      hook_type: llmResult.hook_type ?? null,
      angle: llmResult.angle ?? null,
      structure: llmResult.structure ?? null,
      proof_type: llmResult.proof_type ?? null,
      objections: llmResult.objections ?? [],
      cta_type: llmResult.cta_type ?? null,
      cta_text: llmResult.cta_text ?? null,
      editing_notes: llmResult.editing_notes ?? null,
      script_skeleton: llmResult.script_skeleton ?? null,
    };

    const { data: updated, error: updateError } = await supabase
      .from("creatives")
      .update(updatePayload)
      .eq("id", creative_id)
      .select()
      .single();

    if (updateError) {
      console.error("[analyze] DB update error:", updateError);
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    return NextResponse.json({ creative: updated });
  } catch (err) {
    console.error("[analyze] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
