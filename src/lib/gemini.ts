import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import type { BirthProfile } from "./types";
import { sunSign } from "./zodiac";

const section = z.object({ insight: z.string(), advice: z.string() });

export const readingSchema = z.object({
  sunSign: z.string(),
  moonSign: z.string().nullish(),
  risingSign: z.string().nullish(),
  headline: z.string(),
  daily: z.object({ summary: z.string(), mood: z.string() }),
  weekly: z.object({ summary: z.string(), focus: z.array(z.string()) }),
  profile: z.object({ overview: z.string(), strengths: z.array(z.string()), challenges: z.array(z.string()) }),
  love: section,
  career: section,
  health: section,
});
export type Reading = z.infer<typeof readingSchema>;

const str = { type: Type.STRING };
const strList = { type: Type.ARRAY, items: str };
const sectionSchema = {
  type: Type.OBJECT,
  properties: { insight: str, advice: str },
  required: ["insight", "advice"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    sunSign: str,
    moonSign: { type: Type.STRING, nullable: true },
    risingSign: { type: Type.STRING, nullable: true },
    headline: str,
    daily: { type: Type.OBJECT, properties: { summary: str, mood: str }, required: ["summary", "mood"] },
    weekly: { type: Type.OBJECT, properties: { summary: str, focus: strList }, required: ["summary", "focus"] },
    profile: {
      type: Type.OBJECT,
      properties: { overview: str, strengths: strList, challenges: strList },
      required: ["overview", "strengths", "challenges"],
    },
    love: sectionSchema,
    career: sectionSchema,
    health: sectionSchema,
  },
  required: ["sunSign", "headline", "daily", "weekly", "profile", "love", "career", "health"],
};

const SYSTEM = `You are a thoughtful, warm astrologer writing for an entertainment and self-reflection app.
Rules:
- Be specific and grounded; avoid fatalistic claims, fear, or guarantees about the future.
- Health: lifestyle and wellbeing themes only (sleep, stress, movement). Never diagnose or give medical advice.
- Sign names in the sunSign / moonSign / risingSign fields are always English (e.g. "Scorpio"). All other text uses the requested language.
- Moon and rising signs are estimates because no ephemeris data is supplied. If birth time is missing, set risingSign to null. If you are not reasonably confident about the moon sign, set it to null rather than guessing.
- Keep each text field to 2 to 4 sentences. strengths, challenges and focus have 3 short items each.`;

// Helper function to handle 503 high demand spikes with exponential backoff
async function generateWithRetry(ai: GoogleGenAI, prompt: string, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.9,
        },
      });
    } catch (error: any) {
      // Check if it's a 503 Service Unavailable or 429 Rate Limit error
      const status = error?.status;
      if ((status === 503 || status === 429) && i < retries - 1) {
        console.warn(`Gemini model busy (${status}). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Double the wait time for the next retry
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to generate reading after maximum retries.");
}

export async function generateReading(p: BirthProfile): Promise<Reading> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const ai = new GoogleGenAI({ apiKey });
  const today = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ulaanbaatar", dateStyle: "full" }).format(new Date());
  const lang = p.language === "mn" ? "Mongolian (Cyrillic)" : "English";

  const prompt = `Today is ${today} (Ulaanbaatar time).
Language for all prose: ${lang}.
Name: ${p.name || "not given"}
Date of birth: ${p.dob}
Sun sign (computed, use this): ${sunSign(p.dob)}
Time of birth: ${p.time || "unknown"}
Place of birth: ${p.city}

Write: a one-line headline for today, today's horoscope with a one-word mood, this week's horoscope with three focus points, a personality and astrological profile (overview, strengths, challenges), and love, career and health sections, each with an insight and one piece of advice.`;

  const res = await generateWithRetry(ai, prompt);

  const parsed = readingSchema.parse(JSON.parse(res.text ?? ""));
  parsed.sunSign = sunSign(p.dob); // never trust the model over the deterministic value
  return parsed;
}
