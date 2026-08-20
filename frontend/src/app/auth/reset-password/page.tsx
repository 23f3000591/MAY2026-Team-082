"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const resetPassword = useAppStore((state) => state.resetPassword);
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const success = resetPassword(token, password);
    if (success) {
      setMessage("Your password has been reset. Redirecting to login...");
      setTimeout(() => router.push("/auth/login"), 1200);
      return;
    }
    setMessage("Failed to reset password. Check your token and try again.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-4 text-[var(--text-primary)] transition-colors duration-200">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between gap-2 text-cyan-200">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-[0.3em]">Reset password</span></div>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-semibold text-white">Reset your password.</h1>
        <p className="mt-3 text-sm text-slate-400">Use the token from the forgot password page to set a new password.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <label className="mb-2 block text-sm text-slate-400">Reset token</label>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-300" />
              <input className="w-full bg-transparent text-sm outline-none" value={token} onChange={(event) => setToken(event.target.value)} placeholder="abcdef12" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <label className="mb-2 block text-sm text-slate-400">New password</label>
            <input className="w-full bg-transparent text-sm outline-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
          </div>
          {message ? <div className="text-sm text-emerald-300">{message}</div> : null}
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 font-semibold text-white">Reset password</button>
        </form>
        <div className="mt-6 text-sm text-slate-400">Back to <Link href="/auth/login" className="text-cyan-300">Sign in</Link></div>
      </div>
    </main>
  );
}
