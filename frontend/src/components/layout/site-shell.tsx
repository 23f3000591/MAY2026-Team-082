"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BellRing, 
  BookOpenCheck, 
  Compass, 
  Home, 
  MessagesSquare, 
  ShieldCheck, 
  Sparkles, 
  UserCircle2, 
  CalendarDays,
  LogOut,
  Users,
  AlertTriangle,
  Activity
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((state) => state.currentUser);
  const logout = useAppStore((state) => state.logout);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const pathname = usePathname();
  const router = useRouter();

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Load current user from localStorage on mount
  useEffect(() => {
    if (!currentUser) {
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          const normalizedUser = {
            id: userData.user_id?.toString() || userData.id || "",
            name: userData.full_name || userData.name || "",
            email: userData.email,
            password: "",
            role: userData.role || "learner",
            createdAt: userData.created_at || new Date().toISOString(),
            favorites: userData.favorites || [],
            bio: userData.bio,
          };
          setCurrentUser(normalizedUser);
        } catch (error) {
          console.error("Failed to load user from localStorage:", error);
          localStorage.removeItem("currentUser");
        }
      }
    }
  }, []);

  // Fetch unread counters for icon badges
  useEffect(() => {
    if (!currentUser) return;
    async function fetchBadges() {
      try {
        const [notifRes, msgRes] = await Promise.allSettled([
          apiClient.getNotifications(),
          apiClient.getConversationInbox(),
        ]);
        if (notifRes.status === "fulfilled") {
          const unreadNotifs = (notifRes.value.data ?? []).filter((n: any) => !n.is_read).length;
          setUnreadNotifCount(unreadNotifs);
        }
        if (msgRes.status === "fulfilled") {
          const totalUnreadMsgs = (msgRes.value.data ?? []).reduce((acc: number, c: any) => acc + (c.unread_count || 0), 0);
          setUnreadMsgCount(totalUnreadMsgs);
        }
      } catch {
        // silent
      }
    }
    fetchBadges();
  }, [currentUser, pathname]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const userRole = (currentUser?.role?.toLowerCase() ?? "learner");
  const isMentorUser = userRole === "mentor" || Boolean(currentUser?.is_mentor);

  // Streamlined and consolidated navigation tabs
  const navLinks = [
    { href: "/dashboard", label: "Home", icon: Home, show: userRole !== "admin" },
    { href: "/search", label: "Discover", icon: Compass, show: userRole !== "admin" },
    { href: "/bookings", label: "My Bookings", icon: BookOpenCheck, show: userRole !== "admin" },
    { href: "/mentor", label: "Mentor Workspace", icon: CalendarDays, show: isMentorUser },
    { href: "/admin", label: "Admin Center", icon: ShieldCheck, show: userRole === "admin" },
    { href: "/admin/users", label: "User Management", icon: Users, show: userRole === "admin" },
    { href: "/admin/reports", label: "Moderation", icon: AlertTriangle, show: userRole === "admin" },
    { href: "/admin/activity", label: "Audit Telemetry", icon: Activity, show: userRole === "admin" },
    { href: "/profile", label: "Profile", icon: UserCircle2, show: userRole !== "admin" },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] transition-colors duration-200">
      <header className="sticky top-3 z-50 mx-auto mb-6 max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 shadow-[0_16px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          {/* Brand Logo */}
          <Link 
            href={currentUser ? (userRole === "admin" ? "/admin" : "/dashboard") : "/"} 
            className="flex items-center gap-2 text-sm font-bold tracking-[0.25em] text-[var(--text-primary)] hover:opacity-80 transition"
          >
            <Sparkles className="h-4 w-4 text-[var(--accent)]" /> 
            <span className="hidden sm:inline">NEXCHANGE</span>
          </Link>

          {/* Primary Nav Links */}
          <nav className="hidden items-center gap-1 sm:flex md:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-400/30"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & User Menu */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <>
                {/* Messages Icon Button */}
                <Link
                  href="/messages"
                  title="Messages"
                  className={`relative rounded-full border p-2 transition ${
                    pathname === "/messages"
                      ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-300"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <MessagesSquare className="h-4 w-4" />
                  {unreadMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-slate-950">
                      {unreadMsgCount}
                    </span>
                  )}
                </Link>

                {/* Notifications Icon Button */}
                <Link
                  href="/notifications"
                  title="Notifications"
                  className={`relative rounded-full border p-2 transition ${
                    pathname === "/notifications"
                      ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-300"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <BellRing className="h-4 w-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {unreadNotifCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            <ThemeToggle />

            {currentUser ? (
              <div className="flex items-center gap-2 pl-1">
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/20 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:scale-[1.02] cursor-pointer"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {children}
      </motion.main>
    </div>
  );
}
