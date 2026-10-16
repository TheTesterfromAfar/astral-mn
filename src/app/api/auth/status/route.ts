import { NextResponse } from "next/server";
import { clearPending, createSession, getPending, getProfile } from "@/lib/session";
import { getVerificationStatus } from "@/lib/verifymn";

export async function GET() {
  const pending = await getPending();
  if (!pending) return NextResponse.json({ status: "NONE" }, { status: 400 });

  try {
    const s = await getVerificationStatus(pending.sessionId);
    if (s.sessionStatus === "VERIFIED") {
      await clearPending();
      await createSession(pending.phone);
      return NextResponse.json({ status: "VERIFIED", hasProfile: Boolean(await getProfile()) });
    }
    if (s.sessionStatus === "EXPIRED" || Date.now() > pending.expiresAt) {
      await clearPending();
      return NextResponse.json({ status: "EXPIRED" });
    }
    return NextResponse.json({ status: "PENDING" });
  } catch (e) {
    console.error("verify.mn status failed:", e instanceof Error ? e.message : "unknown");
    // Transient: let the client keep polling until the deadline.
    return NextResponse.json({ status: "PENDING" });
  }
}
