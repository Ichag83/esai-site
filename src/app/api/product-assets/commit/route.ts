import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const BUCKET = "product-images";
const SIGNED_URL_TTL = 3600; // seconds

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
      .select("id, status, storage_paths")
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

    // Validate every path starts with the expected prefix
    const prefix = `${user.id}/${asset_id}/`;
    const badPrefix = paths.find((p) => !p.startsWith(prefix));
    if (badPrefix) {
      return NextResponse.json(
        { error: `Path does not belong to this asset: ${badPrefix}` },
        { status: 400 }
      );
    }

    // Validate every committed path was registered during upload
    const registered: string[] = asset.storage_paths ?? [];
    const unregistered = paths.find((p) => !registered.includes(p));
    if (unregistered) {
      return NextResponse.json(
        { error: `Path was not registered via upload-url: ${unregistered}` },
        { status: 400 }
      );
    }

    // Generate signed read URLs via service client (bucket is private)
    const service = await createServiceClient();
    const { data: signedData, error: signErr } = await service.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);

    if (signErr || !signedData) {
      console.error("[commit] createSignedUrls error:", signErr);
      return NextResponse.json(
        { error: "Could not create signed URLs" },
        { status: 502 }
      );
    }

    const image_urls = signedData.map((s) => s.signedUrl);

    // Mark READY and store signed URLs
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
