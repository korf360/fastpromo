import type { Metadata } from "next";
import { Cinzel, Outfit } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "FastPromo — Instant MLBB Diamond Top-Ups for Europe",
  description:
    "Professional Mobile Legends diamond top-ups with ~5 second automated delivery, Stripe checkout, and GDPR-ready privacy for European players.",
  keywords: [
    "Mobile Legends",
    "MLBB",
    "diamonds",
    "top-up",
    "FastPromo",
    "Europe",
  ],
  openGraph: {
    title: "FastPromo — Instant MLBB Top-Ups",
    description:
      "Automated diamond delivery for European MLBB players. Secure Stripe checkout.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gaming text-white">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
