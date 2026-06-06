import { redirect } from "next/navigation";
import { ROLE_HOME } from "./navigation";
import { createSupabaseServerClient } from "./supabase/server";

const PROFILE_COLUMNS = "id, full_name, email, role, program_year, team_key, guild_id, room_number, phone_number, social_handle, linkedin_url, pronouns, cotl_color, superpower, show_email, show_phone, show_social, show_in_directory, is_active";

export function getHomeForRole(role) {
  return ROLE_HOME[role] || "/login";
}

export async function getSessionContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return { supabase, user, profile: null };
  }

  return { supabase, user, profile };
}

export async function requireUser(allowedRoles = []) {
  const session = await getSessionContext();

  if (!session.user) {
    redirect("/login");
  }

  if (!session.profile) {
    redirect("/login?error=profile");
  }

  if (
    allowedRoles.length > 0 &&
    session.profile?.role &&
    !allowedRoles.includes(session.profile.role)
  ) {
    redirect(getHomeForRole(session.profile.role));
  }

  return session;
}
