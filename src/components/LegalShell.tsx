import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="relative flex-1">
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-[0.2em] text-white/80">
            FastPromo Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/40">Last updated: {updated}</p>
          <div className="legal-prose mt-10 space-y-6 text-sm leading-relaxed text-white/65 sm:text-base">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
