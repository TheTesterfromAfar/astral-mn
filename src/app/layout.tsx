import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});
const body = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Astral: your birth chart, read for today",
  description: "Personalised horoscopes and astrological profiles from your birth details.",
};
export const viewport: Viewport = { themeColor: "#090818" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="sky min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
