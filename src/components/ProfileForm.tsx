"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BirthProfile } from "@/lib/types";

const field =
  "w-full rounded-lg border border-night-700 bg-night-900/80 px-4 py-3 text-moon-100 placeholder:text-moon-500 focus:border-gold-500";

export function ProfileForm({ initial }: { initial: BirthProfile | null }) {
  const router = useRouter();
  const [v, setV] = useState({
    name: initial?.name ?? "",
    dob: initial?.dob ?? "",
    time: initial?.time ?? "",
    city: initial?.city ?? "",
    language: initial?.language ?? "en",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    if (!res.ok) {
      setBusy(false);
      return setError((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
    }
    router.push("/reading");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1 block text-moon-300">Full name <span className="text-moon-500">(optional)</span></label>
        <input id="name" value={v.name} onChange={set("name")} autoComplete="name" className={field} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="dob" className="mb-1 block text-moon-300">Date of birth</label>
          <input id="dob" type="date" required min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={v.dob} onChange={set("dob")} className={field} />
        </div>
        <div>
          <label htmlFor="time" className="mb-1 block text-moon-300">Time of birth <span className="text-moon-500">(optional)</span></label>
          <input id="time" type="time" value={v.time} onChange={set("time")} className={field} aria-describedby="time-hint" />
        </div>
      </div>
      <p id="time-hint" className="-mt-3 text-sm text-moon-500">
        Recommended: your birth time is what lets us estimate your rising sign.
      </p>
      <div>
        <label htmlFor="city" className="mb-1 block text-moon-300">City of birth</label>
        <input id="city" required value={v.city} onChange={set("city")} placeholder="Ulaanbaatar, Mongolia" className={field} />
      </div>
      <div>
        <label htmlFor="language" className="mb-1 block text-moon-300">Reading language</label>
        <select id="language" value={v.language} onChange={set("language")} className={field}>
          <option value="en">English</option>
          <option value="mn">Монгол</option>
        </select>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-gold-500 px-4 py-3 font-semibold text-night-950 transition hover:bg-gold-400 disabled:opacity-50">
        {busy ? "Saving…" : "Read my chart"}
      </button>
    </form>
  );
}
