import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PreferencesBody = {
  in_app?: boolean;
  push?: boolean;
  email?: boolean;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("in_app, push, email, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    preferences: data ?? { in_app: true, push: true, email: true },
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PreferencesBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = {
    user_id: user.id,
    in_app: body.in_app ?? true,
    push: body.push ?? true,
    email: body.email ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(row, { onConflict: "user_id" })
    .select("in_app, push, email, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferences: data });
}
