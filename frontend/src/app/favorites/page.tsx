"use client";

import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { Heart, Trash2 } from "lucide-react";
import { useMemo } from "react";

export default function FavoritesPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const removeFavoriteMentor = useAppStore((state) => state.removeFavoriteMentor);

  const favoriteMentors = useMemo(() => {
    return users.filter((user) => user.role === "mentor" && currentUser?.favorites?.includes(user.id));
  }, [users, currentUser?.favorites]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-white">My favorite mentors</h1>
          <p className="mt-3 text-slate-400">Quick access to the mentors you’ve saved for your next session.</p>
        </section>

        <div className="mt-8 space-y-4">
          {favoriteMentors.length ? favoriteMentors.map((mentor) => (
            <div key={mentor.id} className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
                    <div>
                      <div className="text-xl font-semibold">{mentor.name}</div>
                      <div className="text-sm text-slate-400">{mentor.yearsExperience ?? 0} years experience</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                        <span className="text-cyan-400">⭐</span> {mentor.rating ?? 4.5} · {mentor.reviews ?? 0} reviews
                      </div>
                    </div>
                  </div>
                </div>
                <button className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-400/20 flex items-center gap-2" onClick={() => removeFavoriteMentor(mentor.id)}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
              <p className="mt-4 text-slate-300">{mentor.bio ?? "Experienced mentor with strong learner feedback."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(mentor.skills ?? []).map((skill) => (
                  <span key={skill.name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{skill.name}</span>
                ))}
              </div>
            </div>
          )) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 text-slate-300">No favorite mentors yet. Browse the search page and click the star icon to save mentors.</div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
