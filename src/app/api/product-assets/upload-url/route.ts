import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "product-images";
const MAX_FILES = 5;

const UploadUrlSchema = z.object({
  asset_id: z.string().uuid(),
  filename: z.string().min(1).max(200),
  content_type: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

/** Strip everything that is not alphanumeric, dash, underscore, or dot. */
function sanitizeFilename(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);
  return `${base}.${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = UploadUrlSchema.safeParse(body);

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

    const { asset_id, filename, content_type } = parsed.data;

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
    if ((asset.storage_paths ?? []).length >= MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} images allowed` },
        { status: 422 }
      );
    }

    // Build storage path: {user_id}/{asset_id}/{sanitized_filename}
    const safe = sanitizeFilename(filename);
    const path = `${user.id}/${asset_id}/${safe}`;

    // Use service client so bucket policies are bypassed server-side
    // (we already validated ownership above)
    const service = await createServiceClient();
    const { data: signedData, error: signErr } = await service.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (signErr || !signedData) {
      console.error("[upload-url] signed URL error:", signErr);
      return NextResponse.json(
        { error: "Could not create upload URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      signed_url: signedData.signedUrl,
      path,
      content_type,
    });
  } catch (err) {
    console.error("[upload-url] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
