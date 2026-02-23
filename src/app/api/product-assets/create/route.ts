import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("product_assets")
      .insert({ user_id: user.id, status: "PENDING" })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[product-assets/create]", error);
      return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
    }

    return NextResponse.json({ asset_id: data.id }, { status: 201 });
  } catch (err) {
    console.error("[product-assets/create] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
