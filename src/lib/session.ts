import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { BirthProfile } from "./types";

const SESSION_COOKIE = "session";
const PROFILE_COOKIE = "profile";

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to 32+ characters");
  return new TextEncoder().encode(s);
}

async function sign(payload: Record<string, unknown>, ttl: string) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(ttl).sign(key());
}

async function read<T>(name: string): Promise<T | null> {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as T;
  } catch {
    return null;
  }
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function createSession(phone: string) {
  const token = await sign({ phone }, "7d");
  (await cookies()).set(SESSION_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 24 * 7 });
}

export async function getSession(): Promise<{ phone: string } | null> {
  return read<{ phone: string }>(SESSION_COOKIE);
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(PROFILE_COOKIE);
}

export async function saveProfile(profile: BirthProfile) {
  const token = await sign({ ...profile }, "365d");
  (await cookies()).set(PROFILE_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 24 * 365 });
}

export async function getProfile(): Promise<BirthProfile | null> {
  const p = await read<BirthProfile & Record<string, unknown>>(PROFILE_COOKIE);
  if (!p) return null;
  return { name: p.name, dob: p.dob, time: p.time, city: p.city, language: p.language };
}

// A verification in progress. Signed, so the browser can't swap in someone else's sessionId/phone.
const PENDING_COOKIE = "pending";
export interface Pending { sessionId: string; phone: string; expiresAt: number }

export async function setPending(p: Pending) {
  const token = await sign({ ...p }, "10m");
  (await cookies()).set(PENDING_COOKIE, token, { ...cookieBase, maxAge: 600 });
}

export async function getPending(): Promise<Pending | null> {
  const p = await read<Pending & Record<string, unknown>>(PENDING_COOKIE);
  return p ? { sessionId: p.sessionId, phone: p.phone, expiresAt: p.expiresAt } : null;
}

export async function clearPending() {
  (await cookies()).delete(PENDING_COOKIE);
}
