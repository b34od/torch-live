const ALLOWED_ACTIVITY_PREFIXES = ["/admin", "/staff", "/student"];

export function normalizeActivityPath(pathname) {
  const value = String(pathname || "").trim();
  if (!value.startsWith("/")) return null;

  const [pathOnly] = value.split(/[?#]/, 1);
  if (!pathOnly) return null;

  const matchedPrefix = ALLOWED_ACTIVITY_PREFIXES.find(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );

  return matchedPrefix ? pathOnly : null;
}

export async function recordUserActivity(supabase, eventType, pathname = null) {
  if (!supabase) return { error: new Error("Supabase client is required.") };

  const event = String(eventType || "").trim().toLowerCase();
  if (!["login", "visit"].includes(event)) {
    return { error: new Error(`Unsupported activity event: ${eventType}`) };
  }

  const normalizedPath = event === "visit" ? normalizeActivityPath(pathname) : null;
  const { error } = await supabase.rpc("record_user_activity", {
    event_type: event,
    pathname: normalizedPath,
  });

  return { error };
}
