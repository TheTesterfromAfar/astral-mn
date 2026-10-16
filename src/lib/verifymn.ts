// Server-side only: reads VERIFY_MN_API_KEY. Never import from a client component.
import { randomInt } from "node:crypto";

const BASE = process.env.VERIFY_MN_BASE_URL || "https://api.verify.mn";

export class VerifyError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "VerifyError";
  }
}

export interface Verification {
  sessionId: string;
  phone: string;
  shortcode: string;
  text: string; // the 6-digit code the user must send
  smsUri: string;
  displayInstruction: string; // Mongolian; show verbatim
  expiresAt: string | number;
}

export type SessionStatus = "PENDING" | "VERIFIED" | "EXPIRED";

export interface VerificationStatus {
  sessionId: string;
  sessionStatus: SessionStatus;
  callbackStatus?: string;
  verifiedAt?: string | number | null;
  expiresAt: string | number;
}

function apiKey(): string {
  const key = process.env.VERIFY_MN_API_KEY;
  if (!key) throw new VerifyError("VERIFY_MN_API_KEY is not set");
  return key;
}

/** Fresh 6-digit code per session (no leading zero, so it survives being read aloud or retyped). */
export function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

/** expiresAt may be an ISO string, epoch seconds or epoch milliseconds. */
export function toMs(v: string | number): number {
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  return /^\d+$/.test(v) ? toMs(Number(v)) : Date.parse(v);
}

/** Starts a verification. `phone` is the 8-digit local number. No callback: we poll instead. */
export async function createVerification(phone: string): Promise<Verification> {
  const res = await fetch(`${BASE}/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ phone, text: generateCode() }),
    cache: "no-store",
  });
  if (res.status === 401) throw new VerifyError("verify.mn rejected the API key", 401);
  if (!res.ok) throw new VerifyError(`verify.mn session create failed (${res.status})`, res.status);
  return (await res.json()) as Verification;
}

/** Public endpoint; the caller must still confirm sessionStatus === "VERIFIED". */
export async function getVerificationStatus(sessionId: string): Promise<VerificationStatus> {
  const res = await fetch(`${BASE}/sessions/${encodeURIComponent(sessionId)}`, { cache: "no-store" });
  if (!res.ok) throw new VerifyError(`verify.mn status check failed (${res.status})`, res.status);
  return (await res.json()) as VerificationStatus;
}

export interface VerifyPhoneOptions {
  /** Called once with the instruction/smsUri to show the user. */
  onSession?: (v: Verification) => void;
  intervalMs?: number; // default 3000
}

/**
 * Resolves true only once verify.mn reports VERIFIED; false on EXPIRED or when expiresAt passes.
 * Rejects on a bad key (401) or when the API is unreachable.
 *
 * This holds the caller for up to ~5 minutes, so it suits scripts, workers and tests. The web
 * app uses the same two building blocks across requests instead (/api/auth/start and
 * /api/auth/status), because serverless functions shouldn't wait that long.
 */
export async function verifyPhone(phone: string, opts: VerifyPhoneOptions = {}): Promise<boolean> {
  const interval = opts.intervalMs ?? 3000;
  const v = await createVerification(phone);
  opts.onSession?.(v);
  const deadline = toMs(v.expiresAt);

  for (;;) {
    const s = await getVerificationStatus(v.sessionId);
    if (s.sessionStatus === "VERIFIED") return true;
    if (s.sessionStatus === "EXPIRED" || Date.now() >= deadline) return false;
    await new Promise((r) => setTimeout(r, interval));
  }
}
