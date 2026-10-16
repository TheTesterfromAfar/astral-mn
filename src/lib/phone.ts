/**
 * verify.mn is Mongolia-only. Accepts "9911 2233", "976 99112233" or "+97699112233".
 * `local` is the 8-digit number sent to verify.mn; `e164` identifies the user in our session.
 */
export function normalizeMnPhone(input: string): { local: string; e164: string } | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("976")) digits = digits.slice(3);
  if (!/^[6-9]\d{7}$/.test(digits)) return null;
  return { local: digits, e164: `+976${digits}` };
}
