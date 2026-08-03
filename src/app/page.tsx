import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TopUpFlow } from "@/components/TopUpFlow";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <Hero />
        <TopUpFlow />
      </main>
      <Footer />
    </>
  );
}
