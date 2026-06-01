import { NextResponse } from "next/server";
import { getSessionContext } from "../../../lib/auth";

const ALLOWED_BOOLEAN = ["show_email", "show_phone", "show_social", "show_in_directory"];
const ALLOWED_TEXT    = ["social_handle", "phone_number"];
const MAX_TEXT_LENGTH = 120;

export async function POST(request) {
  const { supabase, profile } = await getSessionContext();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates = {};

  for (const key of ALLOWED_BOOLEAN) {
    if (key in body) {
      if (typeof body[key] !== "boolean") {
        return NextResponse.json({ error: `${key} must be a boolean` }, { status: 400 });
      }
      updates[key] = body[key];
    }
  }

  for (const key of ALLOWED_TEXT) {
    if (key in body) {
      const value = body[key] === null ? null : String(body[key]).trim().slice(0, MAX_TEXT_LENGTH) || null;
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, updated: Object.keys(updates) });
}
