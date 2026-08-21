"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setIsError(false);
    setMessage("");
    try {
      await apiClient.requestPasswordReset(email.trim());
      setMessage("If an account exists for that email, a password reset link has been sent. Check your inbox.");
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-4 text-[var(--text-primary)] transition-colors duration-200">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between gap-2 text-cyan-200">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-[0.3em]">Password help</span></div>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-semibold text-white">Forgot your password?</h1>
        <p className="mt-3 text-sm text-slate-400">Enter your email to receive a password reset link.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <label className="mb-2 block text-sm text-slate-400">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-300" />
              <input
                className="w-full bg-transparent text-sm outline-none text-white placeholder:text-slate-500"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                required
              />
            </div>
          </div>
          {message ? (
            <div className={`text-sm ${isError ? "text-rose-300" : "text-emerald-300"}`}>{message}</div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <div className="mt-6 text-sm text-slate-400">Remembered it? <Link href="/auth/login" className="text-cyan-300">Sign in</Link></div>
      </div>
    </main>
  );
}
