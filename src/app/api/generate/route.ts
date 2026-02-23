import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { callLLM, parseLLMJson } from "@/lib/llm";
import {
  GENERATION_SYSTEM_PROMPT,
  buildGenerationUserMessage,
  PatternSummary,
} from "@/lib/prompts";

const GenerateBodySchema = z.object({
  target_platform: z.enum(["tiktok", "meta", "instagram", "youtube", "universal"]),
  marketplace_context: z.enum([
    "mercado_livre",
    "shopee",
    "tiktok_shop",
    "instagram",
    "none",
  ]),
  product_category: z.string().min(1),
  product_name: z.string().min(1),
  product_description: z.string().min(1),
  product_bullets: z.array(z.string()).min(1),
  price: z.string().min(1),
  offer_terms: z.record(z.unknown()).default({}),
  target_audience: z.string().min(1),
  constraints: z.record(z.unknown()).default({}),
  output_count: z.number().int().min(1).max(20).default(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GenerateBodySchema.safeParse(body);

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

    const data = parsed.data;

    // Fetch matching patterns (platform + category; also include "universal" and "geral")
    const { data: patterns } = await supabase
      .from("patterns")
      .select(
        "pattern_name, hook_formula, structure, script_skeleton, why_it_works"
      )
      .or(
        `platform.eq.${data.target_platform},platform.eq.universal`
      )
      .or(
        `product_category.eq.${data.product_category},product_category.eq.geral`
      )
      .limit(6);

    const patternList: PatternSummary[] = (patterns ?? []).map((p) => ({
      pattern_name: p.pattern_name ?? "",
      hook_formula: p.hook_formula ?? "",
      structure: p.structure ?? "",
      script_skeleton: p.script_skeleton ?? "",
      why_it_works: p.why_it_works ?? "",
    }));

    // Insert generation request record (status=PENDING)
    const { data: genRequest, error: insertError } = await supabase
      .from("generation_requests")
      .insert({
        user_id: user.id,
        target_platform: data.target_platform,
        marketplace_context: data.marketplace_context,
        product_category: data.product_category,
        product_name: data.product_name,
        product_description: data.product_description,
        product_bullets: data.product_bullets,
        price: data.price,
        offer_terms: data.offer_terms,
        target_audience: data.target_audience,
        constraints: data.constraints,
        output_count: data.output_count,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (insertError || !genRequest) {
      console.error("[generate] DB insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create generation request" },
        { status: 500 }
      );
    }

    // Build and call LLM
    const userMessage = buildGenerationUserMessage({
      output_count: data.output_count,
      target_platform: data.target_platform,
      product_name: data.product_name,
      product_category: data.product_category,
      marketplace_context: data.marketplace_context,
      product_description: data.product_description,
      product_bullets: data.product_bullets,
      price: data.price,
      offer_terms: data.offer_terms,
      target_audience: data.target_audience,
      constraints: data.constraints,
      patterns: patternList,
    });

    let output: unknown;
    try {
      const response = await callLLM(GENERATION_SYSTEM_PROMPT, userMessage);
      output = parseLLMJson(response.content);
    } catch (llmErr) {
      console.error("[generate] LLM error:", llmErr);

      await supabase
        .from("generation_requests")
        .update({ status: "FAILED" })
        .eq("id", genRequest.id);

      return NextResponse.json({ error: "LLM generation failed" }, { status: 502 });
    }

    // Save output
    const { data: updatedRequest, error: updateError } = await supabase
      .from("generation_requests")
      .update({ output, status: "DONE" })
      .eq("id", genRequest.id)
      .select()
      .single();

    if (updateError) {
      console.error("[generate] DB update error:", updateError);
      return NextResponse.json({ error: "Failed to save output" }, { status: 500 });
    }

    return NextResponse.json({
      generation_id: genRequest.id,
      output,
      request: updatedRequest,
    });
  } catch (err) {
    console.error("[generate] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
