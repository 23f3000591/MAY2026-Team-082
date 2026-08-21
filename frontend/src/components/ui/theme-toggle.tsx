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
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-hover)]"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      <span>{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
