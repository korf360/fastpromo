import type { Metadata, Viewport } from "next";
import { Cinzel, Outfit } from "next/font/google";
import { CookieConsent } from "@/components/CookieConsent";
import { SoftLaunchBanner } from "@/components/SoftLaunchBanner";
import { Providers } from "@/components/Providers";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://fastpromo-eta.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0f12",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FastPromo — Instant Diamond Top-Ups for Europe",
    template: "%s · FastPromo",
  },
  description:
    "Automated diamond top-ups with secure Stripe checkout, account history, cashback, and GDPR-ready privacy for European players.",
  keywords: [
    "diamonds",
    "top-up",
    "FastPromo",
    "Europe",
    "Stripe",
  ],
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "FastPromo — Instant Top-Ups",
    description:
      "Automated diamond delivery for European players. Secure Stripe checkout with cashback rewards.",
    type: "website",
    locale: "en_GB",
    siteName: "FastPromo",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "FastPromo — Instant Top-Ups",
    description:
      "Automated diamond delivery for European players. Secure Stripe checkout with cashback rewards.",
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
        <Providers>
          <SoftLaunchBanner />
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
