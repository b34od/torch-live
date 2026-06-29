import AuthConfirmClient from "./AuthConfirmClient";

function readParamValue(value) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim()) return entry;
    }
    return "";
  }
  if (typeof value === "string" && value.trim()) return value;
  return "";
}

function firstParam(params, ...keys) {
  for (const key of keys) {
    const value = readParamValue(params?.[key]);
    if (value) return value;
  }
  return "";
}

function buildTargetFromQueryParams(params) {
  const callbackError = firstParam(params, "error_description", "error");
  if (callbackError) {
    return `/login?error=${encodeURIComponent(callbackError)}`;
  }

  const code = firstParam(params, "code");
  const tokenHash = firstParam(params, "token_hash");
  const type = firstParam(params, "type");

  if (!code && !tokenHash) {
    return "/login?error=Invalid+sign-in+link.";
  }

  const callbackParams = new URLSearchParams();
  if (tokenHash) {
    callbackParams.set("token_hash", tokenHash);
    callbackParams.set("type", type || "email");
  }
  if (code) callbackParams.set("code", code);
  if (!tokenHash && type) callbackParams.set("type", type);

  return `/auth/callback?${callbackParams.toString()}`;
}

export default async function AuthConfirmPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams || {};
  const initialTargetUrl = buildTargetFromQueryParams(params);
  return <AuthConfirmClient initialTargetUrl={initialTargetUrl} />;
}
