import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminPanel } from "@/components/AdminPanel";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/admin");
  }

  if (!session.user.isAdmin) {
    return (
      <>
        <Header />
        <main className="relative flex-1 overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.06),transparent_55%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
          <div className="relative mx-auto max-w-lg border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300/80">
              Restricted
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
              Access denied
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              This console is limited to authorized FastPromo administrators.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="relative flex-1 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.08),transparent_55%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="relative">
          <AdminPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}
