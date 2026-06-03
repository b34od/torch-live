import { NextResponse } from "next/server";
import { getSessionContext } from "../../../lib/auth";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";

// POST /api/guild — assign a student to a guild (staff/admin only)
export async function POST(request) {
  const { profile } = await getSessionContext();
  if (!profile || !["staff", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const studentId = String(body.studentId || "").trim();
  const guildId = body.guildId === null ? null : String(body.guildId || "").trim() || null;

  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const adminClient = createAdminSupabaseClient();

  // Validate the student exists in the same program year
  const { data: student, error: lookupError } = await adminClient
    .from("user_profiles")
    .select("id, program_year, role")
    .eq("id", studentId)
    .eq("program_year", profile.program_year)
    .eq("role", "student")
    .maybeSingle();

  if (lookupError || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // If guildId provided, validate it belongs to the same year
  if (guildId) {
    const { data: guild } = await adminClient
      .from("guilds")
      .select("id")
      .eq("id", guildId)
      .eq("program_year", profile.program_year)
      .maybeSingle();

    if (!guild) {
      return NextResponse.json({ error: "Guild not found" }, { status: 404 });
    }
  }

  const { error } = await adminClient
    .from("user_profiles")
    .update({ guild_id: guildId })
    .eq("id", studentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
