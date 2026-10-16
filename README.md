# Astral: Next.js + verify.mn + Gemini

1. `npm install`
2. `cp .env.example .env.local` and fill in `GEMINI_API_KEY`, `SESSION_SECRET` (and `VERIFY_MN_API_KEY` when you have it).
3. `npm run dev`. Login uses verify.mn's mobile-originated SMS flow, so `VERIFY_MN_API_KEY` is required even locally. `npm test` runs the verify.mn tests.

## Before going live
- **verify.mn**: the user sends a random 6-digit code by SMS to 144773 (150₮ to them). The browser polls `/api/auth/status` every 3s, which re-checks `GET /sessions/{id}` and only then logs the user in. No callback URL is registered. The phone is sent as the 8-digit local number; if verify.mn expects `976` + number, change it in `src/lib/phone.ts`.
- **Vercel**: import the repo, add the four env vars (Production and Preview), deploy. No other config needed.
- **Persistence**: login and birth profile live in signed, httpOnly cookies (no database). Fine for an MVP; add a DB if you want history, multiple devices, or saved readings.
- **Rate limits**: `src/lib/ratelimit.ts` is per-instance memory. Swap for Upstash Redis / Vercel KV so OTP-SMS abuse limits hold across serverless instances.
- **Accuracy**: the sun sign is computed locally. Moon and rising are LLM estimates; for real placements, compute them with an ephemeris library (e.g. swisseph) and pass them into the prompt.
