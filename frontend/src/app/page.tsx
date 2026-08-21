import Link from "next/link";
import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/feature-section";
import { MentorSection } from "@/components/sections/mentor-section";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const stats = [
  { value: "18k+", label: "Learners" },
  { value: "2.3k", label: "Mentors" },
  { value: "96%", label: "Success rate" },
  { value: "140+", label: "Skills" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] transition-colors duration-200">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-50 mb-8 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="text-lg font-semibold tracking-[0.25em] text-[var(--text-primary)]">NEXCHANGE</div>
            <nav className="hidden items-center gap-6 text-sm text-[var(--text-secondary)] md:flex">
              <a href="#features" className="transition hover:text-[var(--text-primary)]">Features</a>
              <a href="#community" className="transition hover:text-[var(--text-primary)]">Community</a>
              <a href="#pricing" className="transition hover:text-[var(--text-primary)]">Pricing</a>
              <a href="#about" className="transition hover:text-[var(--text-primary)]">About</a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/auth/login" className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)]">Login</Link>
              <Link href="/auth/signup" className="rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]">Sign up</Link>
            </div>
          </div>
        </header>

        <HeroSection />

        <section className="mx-auto mt-8 grid w-full max-w-6xl gap-4 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-center">
              <div className="text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">{stat.label}</div>
            </div>
          ))}
        </section>

        <FeaturesSection />
        <MentorSection />

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-8 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">Launch-ready experience</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">A premium platform for modern neighborhood learning.</h2>
                <p className="mt-4 text-lg text-[var(--text-secondary)]">Every layer — search, booking, profile, community, and AI guidance — is designed to feel seamless and launch-ready.</p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-strong)] px-6 py-4 text-[var(--text-secondary)]">Built for scale · Ready for production</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
