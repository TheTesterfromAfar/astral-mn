import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, saveProfile } from "@/lib/session";

const body = z.object({
  name: z.string().trim().max(80).optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v) && v >= "1900-01-01" && d <= new Date();
    }, "Enter a real date of birth."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter your city of birth.").max(100),
  language: z.enum(["en", "mn"]),
});

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your details." }, { status: 400 });
  }
  const { name, time, ...rest } = parsed.data;
  await saveProfile({ ...rest, name: name || undefined, time: time || undefined });
  return NextResponse.json({ ok: true });
}
