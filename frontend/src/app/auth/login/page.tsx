"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.login(email.trim(), password.trim());
      if (response.status === "success" && response.data) {
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
        const token = response.access_token || response.data?.token || response.token;
        if (token) {
          localStorage.setItem("authToken", token);
          apiClient.setAuthToken(token);
        }
        
        // Redirect according to user role
        const role = (response.data.role || "learner").toLowerCase();
        if (role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
      } else {
        setError(response.message || "Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Could not connect to authentication server. Please ensure the backend is running.";
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

      <div className="w-full max-w-lg rounded-[2.5rem] border border-white/15 bg-slate-900/80 p-8 sm:p-10 shadow-[0_24px_90px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
        <div className="mb-6 flex items-center justify-between gap-2 text-cyan-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Neighborhood Skill Exchange</span>
          </div>
          <ThemeToggle />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Sign in to your account</h1>
        <p className="mt-2.5 text-sm text-slate-300">Access your dashboard, manage community learning, and connect with peers.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:border-cyan-500/50 transition">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email Address</label>
            <input 
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50" 
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:border-cyan-500/50 transition">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Password</label>
              <Link href="/auth/forgot-password" className="text-xs font-medium text-cyan-300 transition hover:text-white">Forgot password?</Link>
            </div>
            <div className="relative mt-2">
              <input 
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(event) => setPassword(event.target.value)} 
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-white focus:outline-none transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3.5 text-sm text-rose-200 animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:shadow-cyan-500/40 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Sign in to Platform
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          New to the community?{" "}
          <Link href="/auth/signup" className="font-semibold text-cyan-300 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}

