export type Language = "en" | "mn";

export interface BirthProfile {
  name?: string;
  dob: string; // YYYY-MM-DD
  time?: string; // HH:MM
  city: string;
  language: Language;
}
