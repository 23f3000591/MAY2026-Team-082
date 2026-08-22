"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, BellRing, BookOpenCheck, FileText, Heart, Home, MessageCircle, MessagesSquare, Search, ShieldCheck, Sparkles, UserCircle2, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAppStore } from "@/lib/store";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/search", label: "Discover", icon: Search },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/bookings", label: "My Sessions", icon: BookOpenCheck },
  { href: "/mentor", label: "Session Requests", icon: MessageCircle },
  { href: "/availability", label: "Availability", icon: Activity },
  { href: "/messages", label: "Messages", icon: MessagesSquare },
  { href: "/notifications", label: "Notifications", icon: BellRing },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/admin", label: "Admin Dashboard", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/activity", label: "Activity", icon: Activity },
];

const roleRoutes = {
  learner: ["/dashboard", "/search", "/favorites", "/bookings", "/notifications", "/messages", "/profile"],
  mentor: ["/dashboard", "/search", "/bookings", "/mentor", "/availability", "/messages", "/notifications", "/profile"],
  admin: ["/admin", "/admin/users", "/admin/reports", "/admin/activity"],
  manager: ["/dashboard", "/manager", "/search", "/bookings", "/messages", "/notifications", "/profile"],
  moderator: ["/dashboard", "/moderator", "/search", "/bookings", "/messages", "/notifications", "/profile"],
};

export function SiteShell({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((state) => state.currentUser);
  const logout = useAppStore((state) => state.logout);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const normalizedRole = (currentUser?.role?.toLowerCase() ?? "learner") as keyof typeof roleRoutes;
  const allowedRoutes = roleRoutes[normalizedRole] ?? roleRoutes.learner;
  const router = useRouter();

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

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const visibleNav = navItems.filter((item) => allowedRoutes.includes(item.href));

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] transition-colors duration-200">
      <header className="sticky top-4 z-50 mx-auto mb-8 max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.28em] text-[var(--text-primary)]">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" /> NEXCHANGE
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-[var(--text-secondary)] md:flex">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-2 transition hover:text-white">
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-cyan-300">{currentUser.name}</span>
                <button onClick={handleLogout} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]">Logout</button>
              </div>
            ) : (
              <Link href="/auth/login" className="rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]">Sign in</Link>
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
