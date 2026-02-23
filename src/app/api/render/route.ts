import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildProviderPayload, type Provider } from "@/lib/videoProviders";
import type { UGCBlueprint } from "@/lib/schemas/ugcBlueprint";

const RenderBodySchema = z.object({
  blueprint_id: z.string().uuid(),
  provider: z.enum(["sora", "veo", "runway", "kling", "talking_actor"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RenderBodySchema.safeParse(body);

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

    const { blueprint_id, provider } = parsed.data;

    // Fetch the blueprint and verify ownership
    const { data: bpRow, error: bpErr } = await supabase
      .from("video_blueprints")
      .select("id, blueprint, user_id")
      .eq("id", blueprint_id)
      .single();

    if (bpErr || !bpRow) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    if (bpRow.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build provider-specific payload from the blueprint
    const blueprint = bpRow.blueprint as UGCBlueprint;
    const provider_payload = buildProviderPayload(provider as Provider, blueprint);

    // Insert video_jobs row with PENDING status
    const { data: job, error: insertErr } = await supabase
      .from("video_jobs")
      .insert({
        user_id: user.id,
        blueprint_id,
        provider,
        provider_payload,
        status: "PENDING",
      })
      .select("id, status")
      .single();

    if (insertErr || !job) {
      console.error("[render] insert error:", insertErr);
      return NextResponse.json({ error: "Failed to create render job" }, { status: 500 });
    }

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      provider_payload_preview: provider_payload,
    });
  } catch (err) {
    console.error("[render] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
