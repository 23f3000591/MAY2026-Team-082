"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.login(email, password);
      if (response.status === "success") {
        // Save user info to localStorage
        localStorage.setItem("currentUser", JSON.stringify(response.data));
        
        // Convert backend response to store format and save to Zustand
        const userData = {
          id: response.data.user_id?.toString() || response.data.id || "",
          name: response.data.full_name || response.data.name || "",
          email: response.data.email,
          password: "",
          role: response.data.role || "learner",
          createdAt: response.data.created_at || new Date().toISOString(),
          favorites: response.data.favorites || [],
          bio: response.data.bio,
        };
        setCurrentUser(userData);
        
        // Save JWT token
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
        
        // Redirect based on role
        const redirectPath = 
          response.data.role === "admin" ? "/admin" :
          response.data.role === "manager" ? "/manager" :
          response.data.role === "mentor" ? "/mentor" :
          response.data.role === "moderator" ? "/moderator" :
          "/dashboard";
        router.replace(redirectPath);
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Login failed. Please try again.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-4 text-[var(--text-primary)] transition-colors duration-200">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between gap-2 text-cyan-200">
          <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.3em]">Welcome back</span>
          </div>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-semibold text-white">Sign in to continue your learning.</h1>
        <p className="mt-3 text-sm text-slate-400">Access your dashboard, bookings, and community circles in one place.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <label className="mb-2 block text-sm uppercase tracking-[0.2em] text-slate-500">Email</label>
            <input 
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50" 
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
              placeholder="you@example.com"
              type="email"
              disabled={isLoading}
            />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm uppercase tracking-[0.2em] text-slate-500">Password</label>
              <Link href="/auth/forgot-password" className="text-sm font-semibold text-cyan-300 transition hover:text-white">Forgot password?</Link>
            </div>
            <input 
              className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50" 
              type="password" 
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
              placeholder="••••••••"
              disabled={isLoading}
            />
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
                Signing in...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
        <div className="mt-6 text-sm text-slate-400">New here? <Link href="/auth/signup" className="text-cyan-300">Create an account</Link></div>
      </div>
    </main>
  );
}
