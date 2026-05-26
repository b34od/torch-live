function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name) {
  return process.env[name] || null;
}

function normalizeAppUrl(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  return withProtocol.endsWith("/") ? withProtocol.slice(0, -1) : withProtocol;
}

export function getPublicSupabaseConfig() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const key = getSupabasePublicKey();

  if (!key) {
    throw new Error(
      "Missing required Supabase public key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, key };
}

export function getSupabasePublicKey() {
  return (
    optional("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    optional("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function getSupabaseUrl() {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

export function getServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

export function getSiteUrl() {
  return (
    normalizeAppUrl(optional("NEXT_PUBLIC_SITE_URL")) ||
    normalizeAppUrl(optional("VERCEL_PROJECT_PRODUCTION_URL")) ||
    normalizeAppUrl(optional("VERCEL_URL")) ||
    "http://localhost:3000"
  );
}
