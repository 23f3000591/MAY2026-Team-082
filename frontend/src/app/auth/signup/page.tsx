"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"learner" | "mentor">("learner");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = {
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        password,
        society_id: 1, // Default society from backend seed
      };

      let response;
      if (role === "mentor") {
        response = await apiClient.registerMentor(data);
      } else {
        response = await apiClient.registerLearner(data);
      }

      if (response.status === "success") {
        // Save user info to localStorage
        localStorage.setItem("currentUser", JSON.stringify(response.data));
        // Redirect to dashboard
        router.replace("/dashboard");
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--page-bg)] p-4 text-[var(--text-primary)] transition-colors duration-200">
      <Link href="/" className="mb-6 flex items-center gap-2 text-base font-bold tracking-[0.25em] text-[var(--text-primary)] hover:opacity-80 transition">
        <Sparkles className="h-5 w-5 text-cyan-400" />
        <span>NEXCHANGE</span>
      </Link>

      <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between gap-2 text-cyan-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Neighborhood Skill Exchange</span>
          </div>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Create your account</h1>
        <p className="mt-2.5 text-sm text-slate-300">Start teaching, learning, and building local expertise with confidence.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <label className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-500">Full Name</label>
            <input
              type="text"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              disabled={isLoading}
              required
            />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <label className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-500">Email</label>
            <input
              type="email"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <label className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-500">Phone Number</label>
            <input
              type="tel"
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
              disabled={isLoading}
              required
            />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <label className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-500">Password</label>
            <input
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <label className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-500">Role</label>
            <select
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
              value={role}
              onChange={(event) => setRole(event.target.value as "learner" | "mentor")}
              disabled={isLoading}
            >
              <option value="learner">Learner</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
          <button 
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
        <div className="mt-6 text-sm text-slate-400">Already have an account? <Link href="/auth/login" className="text-cyan-300">Sign in</Link></div>
      </div>
    </main>
  );
}
