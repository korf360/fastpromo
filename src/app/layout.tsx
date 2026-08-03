import type { Metadata } from "next";
import { Cinzel, Outfit } from "next/font/google";
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
  title: "FastPromo — Instant MLBB Diamond Top-Ups",
  description:
    "Instant Mobile Legends: Bang Bang diamond top-ups for Europe. Fully automated delivery in ~5 seconds via official API gateways.",
  keywords: [
    "Mobile Legends",
    "MLBB",
    "diamonds",
    "top-up",
    "FastPromo",
    "Europe",
  ],
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
      </body>
    </html>
  );
}
