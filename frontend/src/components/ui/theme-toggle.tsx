"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
    >
      {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
    </button>
  );
}
