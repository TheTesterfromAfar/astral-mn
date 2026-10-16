import { NextResponse } from "next/server";
import { generateReading } from "@/lib/gemini";
import { allow } from "@/lib/ratelimit";
import { getProfile, getSession } from "@/lib/session";

export const maxDuration = 60;

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Add your birth details first." }, { status: 409 });

  if (!allow(`reading:${session.phone}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "You've reached the hourly limit. Try again later." }, { status: 429 });
  }

  try {
    return NextResponse.json(await generateReading(profile));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "The stars are quiet right now. Try again." }, { status: 502 });
  }
}
