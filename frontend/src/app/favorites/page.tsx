"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { mentorService } from "@/lib/services/mentor-service";
import { Heart, Trash2, Calendar, MessageSquare, Star, ArrowRight, Compass } from "lucide-react";

export default function FavoritesPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const removeFavoriteMentor = useAppStore((state) => state.removeFavoriteMentor);
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMentors() {
      try {
        const res = await mentorService.filter({});
        const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
        setMentorsList(data);
      } catch {
        setMentorsList([]);
      } finally {
        setLoading(false);
      }
    }
    loadMentors();
  }, []);

  const favoriteMentors = mentorsList.filter((m) => {
    const id = String(m.user_id || m.id);
    return (currentUser?.favorites || []).map(String).includes(id);
  });

  const handleRemoveFavorite = async (mentorId: string) => {
    try {
      await mentorService.removeFromFavorites(mentorId);
    } catch {}
    removeFavoriteMentor(mentorId);
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-pink-400">Shortlisted Mentors</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">My Saved Mentors</h1>
              <p className="mt-2 text-sm text-slate-300">
                Your personal bookmarks of preferred neighbors to easily book sessions or compare expertise.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 transition"
            >
              <Compass className="h-4 w-4" /> Discover More Mentors
            </Link>
          </div>
        </section>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-12 text-center text-xs text-slate-400">
              Loading your saved mentors...
            </div>
          ) : favoriteMentors.length > 0 ? (
            favoriteMentors.map((mentor) => {
              const mId = String(mentor.user_id || mentor.id);
              const mName = mentor.full_name || mentor.name;
              const mSkills = Array.isArray(mentor.skills) ? mentor.skills : [];
              const mRating = mentor.rating || 5.0;

              return (
                <div
                  key={mId}
                  className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl transition hover:border-pink-500/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 border border-pink-400/30 text-lg font-bold text-pink-300">
                        {mName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-white">{mName}</h2>
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            ✓ Verified Neighbor
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          📍 {mentor.location || "Green Valley Heights"} · {mentor.years_of_experience ?? mentor.yearsExperience ?? 2} yrs teaching
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-300">
                          {mentor.review_count > 0 || (mentor.rating && mentor.rating > 0) ? (
                            <>
                              <Star className="h-3.5 w-3.5 fill-amber-400" />
                              <span>{mRating} ({mentor.review_count ?? mentor.reviews ?? 1} reviews)</span>
                            </>
                          ) : (
                            <span className="text-cyan-300 font-semibold">⭐ New Community Mentor</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/bookings`}
                        className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition flex items-center gap-1.5"
                      >
                        <Calendar className="h-3.5 w-3.5" /> Book Session
                      </Link>
                      <Link
                        href={`/messages?user=${mId}`}
                        className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Message
                      </Link>
                      <button
                        onClick={() => handleRemoveFavorite(mId)}
                        className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-400/20 transition flex items-center gap-1.5 cursor-pointer"
                        title="Remove from saved favorites"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {mentor.bio || "Passionate community mentor ready to share skills and guide neighbors."}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {mSkills.map((skill: any) => (
                        <span
                          key={skill.name || skill.skill_name || skill}
                          className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200"
                        >
                          {skill.name || skill.skill_name || skill}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/search/mentor/${mId}`}
                      className="text-xs font-semibold text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      View Mentor Profile <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[2.5rem] border border-dashed border-white/10 bg-slate-900/40 p-12 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-pink-400/30 bg-pink-500/10 text-pink-300">
                <Heart className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">No Saved Mentors Yet</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                As you explore teachers on the Discover page, click the <strong>"Save Mentor" (Heart)</strong> button to bookmark mentors you want to learn with later.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
              >
                Browse Neighborhood Mentors →
              </Link>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
