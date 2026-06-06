import { NextResponse } from "next/server";
import { getSessionContext } from "../../../lib/auth";

const ALLOWED_BOOLEAN = ["show_social", "show_in_directory"];
const ALLOWED_TEXT    = ["social_handle", "pronouns", "superpower"];
const ALLOWED_ENUM    = { cotl_color: ["blue", "green", "gold", "orange"] };
const TEXT_MAX        = { social_handle: 120, pronouns: 60, superpower: 30 };
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
      const maxLen = TEXT_MAX[key] ?? MAX_TEXT_LENGTH;
      const value = body[key] === null ? null : String(body[key]).trim().slice(0, maxLen) || null;
      updates[key] = value;
    }
  }

  for (const [key, allowed] of Object.entries(ALLOWED_ENUM)) {
    if (key in body) {
      const value = body[key] === null ? null : String(body[key]).trim();
      if (value !== null && !allowed.includes(value)) {
        return NextResponse.json({ error: `${key} must be one of: ${allowed.join(", ")}` }, { status: 400 });
      }
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
