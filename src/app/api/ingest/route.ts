import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const IngestBodySchema = z.object({
  source_platform: z.enum(["meta", "tiktok", "youtube", "other"]),
  source_url: z.string().url("source_url must be a valid URL"),
  product_category: z.string().min(1),
  marketplace_context: z.enum([
    "mercado_livre",
    "shopee",
    "tiktok_shop",
    "instagram",
    "none",
  ]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = IngestBodySchema.safeParse(body);

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

    const { source_platform, source_url, product_category, marketplace_context } = parsed.data;

    const { data, error } = await supabase
      .from("creatives")
      .insert({
        user_id: user.id,
        source_platform,
        source_url,
        product_category,
        marketplace_context,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[ingest] DB error:", error);
      return NextResponse.json({ error: "Failed to create creative" }, { status: 500 });
    }

    return NextResponse.json({ creative_id: data.id }, { status: 201 });
  } catch (err) {
    console.error("[ingest] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
