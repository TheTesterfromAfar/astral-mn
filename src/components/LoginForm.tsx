"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const field =
  "w-full rounded-lg border border-night-700 bg-night-900/80 px-4 py-3 text-lg text-moon-100 placeholder:text-moon-500 focus:border-gold-500";
const primary =
  "block w-full rounded-lg bg-gold-500 px-4 py-3 text-center font-semibold text-night-950 transition hover:bg-gold-400 disabled:opacity-50";

interface Challenge {
  code: string;
  shortcode: string;
  smsUri: string;
  displayInstruction: string;
  expiresAt: number;
}

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [ch, setCh] = useState<Challenge | null>(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const inFlight = useRef(false);

  async function start(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error ?? "Something went wrong.");
    setExpired(false);
    setCh(json);
  }

  const poll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/auth/status", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (json.status === "VERIFIED") {
        setCh(null); // hides the send action and stops polling
        router.replace(json.hasProfile ? "/reading" : "/profile");
        router.refresh();
      } else if (json.status === "EXPIRED" || json.status === "NONE") {
        setCh(null);
        setExpired(true);
      }
    } finally {
      inFlight.current = false;
    }
  }, [router]);

  // Poll every 3s while a code is active; the effect cleanup stops it on verify/expiry/unmount.
  useEffect(() => {
    if (!ch) return;
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [ch, poll]);

  useEffect(() => {
    if (!ch) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((ch.expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ch]);

  if (ch) {
    const mm = String(Math.floor(left / 60));
    const ss = String(left % 60).padStart(2, "0");
    return (
      <div className="space-y-4" aria-live="polite">
        <p lang="mn" className="leading-relaxed text-moon-100">{ch.displayInstruction}</p>
        <div className="rounded-lg border border-night-700 bg-night-900/80 py-4 text-center">
          <div className="text-sm text-moon-500">Send this code to {ch.shortcode}</div>
          <div className="font-display text-4xl tracking-[0.3em] text-gold-400">{ch.code}</div>
        </div>
        <a href={ch.smsUri} className={primary}>Open Messages with the code filled in</a>
        <p className="text-sm text-moon-500">
          Send from the number you entered. Each SMS to {ch.shortcode} costs 150₮, so send it once.
          This page continues on its own. {left > 0 ? `Code valid for ${mm}:${ss}.` : "Checking…"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={start} className="space-y-4" noValidate>
      {expired && (
        <p role="alert" className="text-sm text-gold-400">
          That code has expired and no longer works. Get a new one below, and don't reuse the old text.
        </p>
      )}
      <label htmlFor="phone" className="block text-moon-300">Mobile number</label>
      <div className="flex gap-2">
        <span className="flex items-center rounded-lg border border-night-700 bg-night-900/80 px-3 text-moon-300">+976</span>
        <input
          id="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="9911 2233"
          value={phone} onChange={(e) => setPhone(e.target.value)} className={field} required
        />
      </div>
      <p className="text-sm text-moon-500">You'll confirm it by sending a short text message from this number.</p>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button className={primary} disabled={busy || phone.replace(/\D/g, "").length < 8}>
        {busy ? "Getting your code…" : expired ? "Get a new code" : "Get code"}
      </button>
    </form>
  );
}
