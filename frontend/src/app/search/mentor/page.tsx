"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, Sparkles, Star, Loader2, MapPin } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { mentorService } from "@/lib/services/mentor-service";
import { apiClient } from "@/lib/api-client";

export default function SearchMentorPage() {
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
        setMentorsList([]);
      } finally {
        setLoading(false);
      }
    }
    loadMentors();
  }, [query, location, rating, sortBy]);

  const handleToggleFavorite = async (mentorId: string) => {
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
      setMessage("Added to favorites!");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">Neighborhood Mentor Discovery</p>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Find verified mentors living near you.</h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" /> Active Filters
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-slate-300">
              <SearchIcon className="h-4 w-4 text-cyan-300" />
              <input
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills (e.g. Python, Guitar, Yoga)"
              />
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-slate-300">
              <MapPin className="h-4 w-4 text-cyan-300" />
              <input
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Filter by building / society"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 outline-none"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value={0} className="bg-slate-900">All Ratings</option>
                <option value={4} className="bg-slate-900">★ 4.0 & above</option>
                <option value={4.5} className="bg-slate-900">★ 4.5 & above</option>
                <option value={5} className="bg-slate-900">★ 5.0 only</option>
              </select>
              <select
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "rating" | "name")}
              >
                <option value="rating" className="bg-slate-900">Top Rated</option>
                <option value="name" className="bg-slate-900">Alphabetical</option>
              </select>
            </div>
          </div>
        </section>

        {message && (
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs text-cyan-300 text-center">
            {message}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading mentors...
            </div>
          ) : mentorsList.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-900/40 p-12 text-center text-sm text-slate-400">
              No mentors match your search criteria. Try a different skill or clear filters!
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {mentorsList.map((mentor) => {
                const mentorIdStr = String(mentor.user_id || mentor.id);
                const mentorName = mentor.full_name || mentor.name;
                const isFav = currentUser?.favorites?.includes(mentorIdStr);
                const skillsArr = Array.isArray(mentor.skills) ? mentor.skills : [];

                return (
                  <div
                    key={mentorIdStr}
                    className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-lg backdrop-blur-xl hover:border-cyan-400/30 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-base font-bold text-cyan-300">
                            {mentorName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">{mentorName}</h3>
                            <p className="text-xs text-slate-400">{mentor.location || "Green Valley Heights"}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(mentorIdStr)}
                          className={`rounded-full p-2 text-xs transition cursor-pointer ${
                            isFav ? "text-rose-400 bg-rose-400/10" : "text-slate-400 bg-white/5 hover:text-white"
                          }`}
                        >
                          ♥
                        </button>
                      </div>

                      <p className="mt-4 text-xs text-slate-300 line-clamp-2 italic">
                        "{mentor.bio || "Passionate community mentor ready to share skills and guide neighbors."}"
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {skillsArr.map((sk: any) => (
                          <span
                            key={sk.skill_id || sk.name || sk}
                            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300"
                          >
                            {sk.skill_name || sk.name || sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                        <Star className="h-4 w-4 fill-amber-400" />
                        <span>{mentor.rating || "5.0"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/search/mentor/${mentorIdStr}`}
                          className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={`/messages?user=${mentorIdStr}`}
                          className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                        >
                          Chat
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
