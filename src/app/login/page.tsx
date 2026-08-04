import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoginForm } from "@/components/LoginForm";
import { isGoogleAuthEnabled } from "@/lib/auth-providers";

export default function LoginPage() {
  const googleEnabled = isGoogleAuthEnabled();

  return (
    <>
      <Header />
      <main className="relative flex-1 overflow-hidden bg-[#0d0f12]">
        <div className="relative">
          <Suspense
            fallback={
              <div className="p-16 text-center text-white/50">Loading…</div>
            }
          >
            <LoginForm googleEnabled={googleEnabled} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
