"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, Sparkles, Star, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { mentorService } from "@/lib/services/mentor-service";
import { apiClient } from "@/lib/api-client";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(0);
  const [sortBy, setSortBy] = useState<"rating" | "name">("rating");
  const [message, setMessage] = useState("");
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = useAppStore((state) => state.currentUser);
  const addFavoriteMentor = useAppStore((state) => state.addFavoriteMentor);
  const removeFavoriteMentor = useAppStore((state) => state.removeFavoriteMentor);

  // Fetch real mentors from backend
  useEffect(() => {
    async function loadMentors() {
      setLoading(true);
      try {
        const res = await mentorService.filter({
          skill: query || undefined,
          location: location || undefined,
          minimum_rating: rating || undefined,
          sort: sortBy,
        });
        const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
        setMentorsList(data);
      } catch {
        // Fallback
        setMentorsList([]);
      } finally {
        setLoading(false);
      }
    }
    loadMentors();
  }, [query, location, rating, sortBy]);

  const handleAddFavorite = async (mentorId: string) => {
    if (!currentUser) {
      setMessage("Please log in to save favorites.");
      return;
    }
    if (currentUser.favorites?.includes(mentorId)) {
      try {
        await apiClient.removeFavoriteMentor(mentorId);
      } catch {}
      removeFavoriteMentor(mentorId);
      setMessage("Removed from favorites.");
    } else {
      try {
        await apiClient.addFavoriteMentor(mentorId);
      } catch {}
      addFavoriteMentor(mentorId);
      setMessage("Mentor added to favorites.");
    }
  };

  const filteredMentors = useMemo(() => {
    return mentorsList.sort((a, b) => {
      const nameA = a.full_name || a.name || "";
      const nameB = b.full_name || b.name || "";
      const ratingA = Number(a.rating ?? 4.8);
      const ratingB = Number(b.rating ?? 4.8);
      if (sortBy === "name") return nameA.localeCompare(nameB);
      return ratingB - ratingA;
    });
  }, [mentorsList, sortBy]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Advanced search</p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Find the right mentor for your next skill milestone.</h1>
            </div>
            {message ? <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">{message}</div> : null}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
              Filters · Nearby · Verified
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-slate-300">
              <SearchIcon className="h-4 w-4 text-cyan-300" />
              <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search skills or mentors" />
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-slate-300">
              <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" />
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-slate-300">
              <select className="w-full bg-transparent text-sm outline-none" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                <option value={0}>Any rating</option>
                <option value={4}>4+ stars</option>
                <option value={4.5}>4.5+ stars</option>
                <option value={5}>5 stars</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {['Photography', 'AI', 'Communication', 'Leadership', 'Design', 'Storytelling'].map((tag) => (
              <button key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300" onClick={() => setQuery(tag)}>
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Mentor results</h2>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span>Sort by</span>
              <select className="rounded-full bg-slate-900 px-3 py-2 text-sm text-white outline-none" value={sortBy} onChange={(event) => setSortBy(event.target.value as "rating" | "name") }>
                <option value="rating">Rating</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading mentors from community database...
              </div>
            ) : filteredMentors.length ? (
              <div className="grid gap-6 lg:grid-cols-3">
                {filteredMentors.map((mentor) => {
                  const mId = String(mentor.user_id || mentor.id);
                  const mName = mentor.full_name || mentor.name;
                  const isFav = currentUser?.favorites?.includes(mId) ?? false;
                  return (
                    <article key={mId} className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-lg font-bold text-cyan-300">
                              {mName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white text-base">{mName}</div>
                              <div className="text-xs text-slate-400">{mentor.years_of_experience ?? mentor.yearsExperience ?? 6} years experience</div>
                            </div>
                          </div>
                          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-200">Verified</div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                          <Star className="h-4 w-4 fill-cyan-400 text-cyan-400" /> {mentor.rating ?? 4.9} · {mentor.review_count ?? mentor.reviews ?? 12} reviews
                        </div>
                        <div className="mt-2 text-xs text-slate-400">{mentor.location || "Green Valley Heights"}</div>
                        <div className="mt-3 text-xs text-slate-300 line-clamp-2">{mentor.bio || "Community mentor ready to help you grow skills."}</div>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {(mentor.skills ?? []).map((skill: any) => {
                            const skillName = typeof skill === "string" ? skill : skill.name || skill.skill_name;
                            return (
                              <span key={skillName} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">{skillName}</span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <Link href={`/search/mentor/${mId}`} className="text-xs font-bold text-cyan-300 hover:underline">
                          View profile & Book →
                        </Link>
                        <button 
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                            isFav 
                              ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-200" 
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`} 
                          onClick={() => handleAddFavorite(mId)}
                        >
                          <Star className={`h-3.5 w-3.5 ${isFav ? "fill-cyan-400 text-cyan-400" : "text-slate-400"}`} /> 
                          {isFav ? "Saved" : "Favorite"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-8 text-center text-slate-300">
                No mentors found matching your filters.
              </div>
            )}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
