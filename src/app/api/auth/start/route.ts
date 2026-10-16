import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeMnPhone } from "@/lib/phone";
import { allow } from "@/lib/ratelimit";
import { setPending } from "@/lib/session";
import { createVerification, toMs } from "@/lib/verifymn";

const body = z.object({ phone: z.string().min(6).max(24) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  const phone = parsed.success ? normalizeMnPhone(parsed.data.phone) : null;
  if (!phone) return NextResponse.json({ error: "Enter a Mongolian mobile number, e.g. 9911 2233." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allow(`start:${phone.e164}`, 5, 10 * 60_000) || !allow(`start-ip:${ip}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  try {
    const v = await createVerification(phone.local);
    await setPending({ sessionId: v.sessionId, phone: phone.e164, expiresAt: toMs(v.expiresAt) });
    return NextResponse.json({
      code: v.text,
      shortcode: v.shortcode,
      smsUri: v.smsUri,
      displayInstruction: v.displayInstruction,
      expiresAt: toMs(v.expiresAt),
    });
  } catch (e) {
    console.error("verify.mn start failed:", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "We couldn't start verification. Try again shortly." }, { status: 502 });
  }
}
