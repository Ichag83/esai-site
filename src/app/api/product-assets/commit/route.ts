import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "product-images";

const CommitSchema = z.object({
  asset_id: z.string().uuid(),
  paths: z.array(z.string().min(1)).min(1).max(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CommitSchema.safeParse(body);

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

    const { asset_id, paths } = parsed.data;

    // Verify ownership + status
    const { data: asset, error: assetErr } = await supabase
      .from("product_assets")
      .select("id, status")
      .eq("id", asset_id)
      .eq("user_id", user.id)
      .single();

    if (assetErr || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    if (asset.status !== "PENDING") {
      return NextResponse.json(
        { error: "Asset is already committed" },
        { status: 409 }
      );
    }

    // Convert storage paths → public URLs
    const image_urls = paths.map((p) => {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(p);
      return data.publicUrl;
    });

    // Mark READY
    const { data: updated, error: updateErr } = await supabase
      .from("product_assets")
      .update({
        status: "READY",
        storage_paths: paths,
        image_urls,
      })
      .eq("id", asset_id)
      .select("id, image_urls, status")
      .single();

    if (updateErr || !updated) {
      console.error("[commit]", updateErr);
      return NextResponse.json({ error: "Failed to commit asset" }, { status: 500 });
    }

    return NextResponse.json({
      asset_id: updated.id,
      image_urls: updated.image_urls,
      status: updated.status,
    });
  } catch (err) {
    console.error("[commit] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
