"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { mentors } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(0);
  const [sortBy, setSortBy] = useState<"rating" | "name">("rating");
  const currentUser = useAppStore((state) => state.currentUser);
  const addFavoriteMentor = useAppStore((state) => state.addFavoriteMentor);
  const removeFavoriteMentor = useAppStore((state) => state.removeFavoriteMentor);

  const handleToggleFavorite = (mentorId: string) => {
    if (!currentUser) return;
    if (currentUser.favorites?.includes(mentorId)) {
      removeFavoriteMentor(mentorId);
    } else {
      addFavoriteMentor(mentorId);
    }
  };

  const foundMentors = useMemo(() => {
    return mentors
      .filter((mentor) => {
        const matchesQuery = query ? mentor.skills.some((skill) => skill.name.toLowerCase().includes(query.toLowerCase())) || mentor.name.toLowerCase().includes(query.toLowerCase()) : true;
        const matchesLocation = location ? mentor.location.toLowerCase().includes(location.toLowerCase()) : true;
        const matchesRating = rating ? mentor.rating >= rating : true;
        return matchesQuery && matchesLocation && matchesRating;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.rating - a.rating;
      });
  }, [query, location, rating, sortBy]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Advanced search</p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Find the right mentor for your next skill milestone.</h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" /> Filters
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
            {['Photography', 'AI', 'Public Speaking', 'Leadership', 'Design', 'Communication'].map((tag) => (
              <button key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300" onClick={() => setQuery(tag)}>{tag}</button>
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
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {foundMentors.map((mentor) => (
              <article key={mentor.id} className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-white">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
                      <div>
                        <div className="font-semibold">{mentor.name}</div>
                        <div className="text-sm text-slate-400">{mentor.role}</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">{mentor.rating} ★</div>
                </div>
                <div className="mt-5 text-sm text-slate-400">{mentor.location} · {mentor.experience}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {mentor.skills.map((skill) => (
                    <span key={skill.name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{skill.name}</span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-400">{mentor.price}</div>
                    <Link href={`/search/mentor/${mentor.id}`} className="text-sm font-semibold text-cyan-300">View profile</Link>
                  </div>
                  <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200" onClick={() => handleToggleFavorite(mentor.id)}>
                    <Star className={`h-4 w-4 ${currentUser?.favorites?.includes(mentor.id) ? "fill-cyan-400 text-cyan-400" : "text-slate-400"}`} /> {currentUser?.favorites?.includes(mentor.id) ? "Saved" : "Favorite"}
                  </button>
                </div>
              </article>
            ))}
            {!foundMentors.length && <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 text-slate-300">No mentors match these filters. Adjust your search criteria to see more options.</div>}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
