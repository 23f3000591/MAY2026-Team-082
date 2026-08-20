"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAppStore } from "@/lib/store";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const requestPasswordReset = useAppStore((state) => state.requestPasswordReset);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const tokenResult = requestPasswordReset(email);
    if (!tokenResult) {
      setMessage("No account found for that email.");
      return;
    }
    setToken(tokenResult);
    setMessage("Password reset token generated. Use it on the reset page.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-4 text-[var(--text-primary)] transition-colors duration-200">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between gap-2 text-cyan-200">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-[0.3em]">Password help</span></div>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-semibold text-white">Forgot your password?</h1>
        <p className="mt-3 text-sm text-slate-400">Enter your email to receive a reset token and recover access.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <label className="mb-2 block text-sm text-slate-400">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-300" />
              <input className="w-full bg-transparent text-sm outline-none" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </div>
          </div>
          {message ? <div className="text-sm text-emerald-300">{message}</div> : null}
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 font-semibold text-white">Send reset token</button>
        </form>
        {token ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
            <div className="font-semibold text-white">Reset token</div>
            <div className="mt-2 break-all">{token}</div>
            <Link href="/auth/reset-password" className="mt-3 inline-flex text-cyan-300">Go to reset page</Link>
          </div>
        ) : null}
        <div className="mt-6 text-sm text-slate-400">Remembered it? <Link href="/auth/login" className="text-cyan-300">Sign in</Link></div>
      </div>
    </main>
  );
}
