import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.08),transparent_55%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="relative">
          <Suspense fallback={<div className="p-16 text-center text-white/50">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
