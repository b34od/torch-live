import { NextResponse } from "next/server";
import { getSessionContext } from "../../../lib/auth";

const ALLOWED_BOOLEAN = ["show_social", "show_in_directory"];
const ALLOWED_TEXT    = ["pronouns", "superpower", "full_name"];
const ALLOWED_ENUM    = { cotl_color: ["blue", "green", "gold", "orange"] };
const TEXT_MAX        = { linkedin_url: 240, pronouns: 60, superpower: 30, full_name: 120 };
const MAX_TEXT_LENGTH = 120;

function normalizeLinkedInUrl(value) {
  if (value === null) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const raw = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("LinkedIn profile must be a valid URL.");
  }

  const host = url.hostname.toLowerCase();
  if (host !== "linkedin.com" && host !== "www.linkedin.com") {
    throw new Error("LinkedIn profile must use linkedin.com.");
  }

  const pathname = url.pathname.replace(/\/+$/, "");
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2 || !["in", "pub"].includes(segments[0])) {
    throw new Error("LinkedIn profile must look like linkedin.com/in/your-name.");
  }

  url.protocol = "https:";
  url.pathname = pathname;
  url.search = "";
  url.hash = "";

  return url.toString();
}

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

  if ("linkedin_url" in body) {
    try {
      const raw = body.linkedin_url === null ? null : String(body.linkedin_url).slice(0, TEXT_MAX.linkedin_url);
      updates.linkedin_url = normalizeLinkedInUrl(raw);
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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

  if ("full_name" in updates && !updates.full_name) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
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
