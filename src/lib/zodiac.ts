export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;
export type Sign = (typeof SIGNS)[number];

export const GLYPHS: Record<Sign, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

// For each month: [first day of the sign that starts mid-month, that sign]. Days before it
// belong to the previous month's sign.
const CUSPS: [number, Sign][] = [
  [20, "Aquarius"], [19, "Pisces"], [21, "Aries"], [20, "Taurus"],
  [21, "Gemini"], [21, "Cancer"], [23, "Leo"], [23, "Virgo"],
  [23, "Libra"], [23, "Scorpio"], [22, "Sagittarius"], [22, "Capricorn"],
];

export function sunSign(dob: string): Sign {
  const [, m, d] = dob.split("-").map(Number);
  const [cusp, sign] = CUSPS[m - 1];
  return d >= cusp ? sign : CUSPS[(m + 10) % 12][1];
}

export function glyphFor(sign?: string | null): string {
  return sign && sign in GLYPHS ? GLYPHS[sign as Sign] : "✦";
}
