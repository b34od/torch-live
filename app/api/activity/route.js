import { NextResponse } from "next/server";
import { getSessionContext } from "../../../lib/auth";
import { normalizeActivityPath, recordUserActivity } from "../../../lib/activity";

export async function POST(request) {
  const { supabase, profile } = await getSessionContext();

  if (!profile) {
    return new NextResponse(null, { status: 401 });
  }

  let pathname = null;

  try {
    const body = await request.json();
    pathname = normalizeActivityPath(body?.pathname);
  } catch {
    pathname = null;
  }

  if (!pathname) {
    return new NextResponse(null, { status: 204 });
  }

  const { error } = await recordUserActivity(supabase, "visit", pathname);

  if (error) {
    return NextResponse.json({ error: "Unable to record activity." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
