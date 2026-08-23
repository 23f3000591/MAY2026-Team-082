"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  Sparkles, 
  Star, 
  Loader2, 
  MapPin, 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare, 
  Heart,
  CheckCircle2,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Filter,
  Users
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { mentorService } from "@/lib/services/mentor-service";
import { apiClient } from "@/lib/api-client";

const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "Technology", label: "💻 Technology & Code" },
  { id: "Music", label: "🎸 Music & Instruments" },
  { id: "Fitness", label: "🧘 Yoga & Fitness" },
  { id: "Cooking", label: "🍳 Cooking & Food" },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(0);
  const [sortBy, setSortBy] = useState<"rating" | "name">("rating");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [bookingMentor, setBookingMentor] = useState<any | null>(null);
  const [bookingSkillId, setBookingSkillId] = useState<number | "">("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingMode, setBookingMode] = useState<"online" | "in_person">("online");
  const [bookingLocation, setBookingLocation] = useState("Tower B Clubhouse");
  const [bookingNote, setBookingNote] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const currentUser = useAppStore((state) => state.currentUser);
  const addFavoriteMentor = useAppStore((state) => state.addFavoriteMentor);
  const removeFavoriteMentor = useAppStore((state) => state.removeFavoriteMentor);

  // Fetch real mentors from backend
  const fetchMentors = async () => {
    setLoading(true);
    try {
      const res = await mentorService.filter({
        // Only pass category as a skill filter to the backend; name search is done client-side
        skill: selectedCategory !== "all" ? selectedCategory : undefined,
        location: location.trim() || undefined,
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
  };

  // Client-side filter by the text query (name or skill match)
  const displayedMentors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mentorsList;
    return mentorsList.filter((m: any) => {
      const nameMatch = (m.full_name || m.name || "").toLowerCase().includes(q);
      const skillMatch = (m.skills || []).some((s: any) =>
        (s.skill_name || s.name || "").toLowerCase().includes(q)
      );
      return nameMatch || skillMatch;
    });
  }, [mentorsList, query]);

  useEffect(() => {
    fetchMentors();
  }, [query, selectedCategory, location, rating, sortBy]);

  const handleToggleFavorite = async (mentorId: string) => {
    if (!currentUser) {
      setMessage({ type: "error", text: "Please log in to save favorite mentors." });
      return;
    }
    const currentFavs = (currentUser.favorites || []).map(String);
    const mIdStr = String(mentorId);
    const isFav = currentFavs.includes(mIdStr);

    try {
      if (isFav) {
        try {
          await apiClient.removeFavoriteMentor(mIdStr);
        } catch (apiErr: any) {
          // If already not found on server, continue syncing local state
          if (apiErr?.response?.status !== 404) throw apiErr;
        }
        removeFavoriteMentor(mIdStr);
        setMessage({ type: "success", text: "Removed from your favorites." });
      } else {
        try {
          await apiClient.addFavoriteMentor(mIdStr);
        } catch (apiErr: any) {
          // If already in server favorites (409 Conflict), accept and sync state
          if (apiErr?.response?.status !== 409) throw apiErr;
        }
        addFavoriteMentor(mIdStr);
        setMessage({ type: "success", text: "Mentor added to your favorites!" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to update favorites." });
    }
    setTimeout(() => setMessage(null), 3500);
  };

  const handleOpenBookingModal = (mentor: any) => {
    if (!currentUser) {
      router.push("/auth/login");
      return;
    }
    setBookingMentor(mentor);
    if (mentor.skills && mentor.skills.length > 0) {
      setBookingSkillId(mentor.skills[0].skill_id || 1);
    }
    // Default tomorrow
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    setBookingDate(tom.toISOString().split("T")[0]);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingMentor || !bookingDate) return;

    setSubmittingBooking(true);
    setMessage(null);

    try {
      await apiClient.bookSession({
        mentor_id: Number(bookingMentor.user_id || bookingMentor.id),
        skill_id: Number(bookingSkillId) || 1,
        session_mode: bookingMode,
        session_date: bookingDate,
        meeting_link: bookingMode === "online" ? `https://meet.jit.si/NSEP-${Date.now()}` : undefined,
        location: bookingMode === "in_person" ? bookingLocation : undefined,
        learner_note: bookingNote.trim() || "Hi! I would like to learn and practice with your guidance.",
      });

      const mName = bookingMentor.full_name || bookingMentor.name;
      setMessage({ type: "success", text: `Session requested with ${mName}! Track it under Bookings.` });
      setBookingMentor(null);
      setBookingNote("");
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || "Failed to book session.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Top Hero Banner */}
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">Neighborhood Skill Discovery</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Explore talents & mentors in your community.
              </h1>
              <p className="mt-2.5 text-sm text-slate-300">
                Connect directly with neighbors offering mentorship in software, music, wellness, cooking, and academic subjects.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300">
                {mentorsList.length} Mentors Available
              </span>
            </div>
          </div>

          {/* Search & Quick Filters Bar */}
          <div className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-slate-950/80 p-4 lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr]">
            {/* Skill / Name Search */}
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-slate-300">
              <SearchIcon className="h-4 w-4 text-cyan-400 shrink-0" />
              <input
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills, topics, or mentor name..."
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-xs text-slate-400 hover:text-white">✕</button>
              )}
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-slate-300">
              <MapPin className="h-4 w-4 text-teal-400 shrink-0" />
              <input
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Filter by building / city"
              />
              {location && (
                <button onClick={() => setLocation("")} className="text-xs text-slate-400 hover:text-white">✕</button>
              )}
            </div>

            {/* Rating Filter */}
            <select
              className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-cyan-400"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              <option value={0} className="bg-slate-900">All Ratings</option>
              <option value={4} className="bg-slate-900">★ 4.0 & above</option>
              <option value={4.5} className="bg-slate-900">★ 4.5 & above</option>
              <option value={5} className="bg-slate-900">★ 5.0 only</option>
            </select>

            {/* Sort Order */}
            <select
              className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-cyan-400"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating" | "name")}
            >
              <option value="rating" className="bg-slate-900">Sort: Top Rated</option>
              <option value="name" className="bg-slate-900">Sort: Alphabetical</option>
            </select>
          </div>

          {/* Category Chips Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-2 pt-6 border-t border-white/10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Categories:</span>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold shadow-md"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/30 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Global Status Message Toast */}
        {message && (
          <div className={`mt-6 flex items-center gap-3 rounded-2xl border p-4 text-sm ${
            message.type === "success" 
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-rose-400/20 bg-rose-400/10 text-rose-300"
          }`}>
            {message.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Mentors Grid */}
        <div className="mt-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
              <span className="text-sm">Discovering local mentors...</span>
            </div>
          ) : displayedMentors.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-white/10 bg-slate-900/40 p-16 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-500 mb-3" />
              <h3 className="text-lg font-bold text-white">No mentors found</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                We couldn't find any mentors matching your filters. Try clearing your search keyword or switching category tags.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("all");
                  setLocation("");
                  setRating(0);
                }}
                className="mt-5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {displayedMentors.map((mentor) => {
                const mId = String(mentor.user_id || mentor.id);
                const mName = mentor.full_name || mentor.name;
                const mReviews = Number(mentor.review_count ?? mentor.reviews_count ?? mentor.reviews ?? 0);
                const mRating = Number(mentor.rating ?? 0);
                const isFav = currentUser?.favorites?.includes(mId);
                const skillsArr = Array.isArray(mentor.skills) ? mentor.skills : [];
                const availArr = Array.isArray(mentor.availability) ? mentor.availability : [];

                return (
                  <div
                    key={mId}
                    className="flex flex-col justify-between rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-[0_15px_50px_rgba(15,23,42,0.25)] backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group"
                  >
                    <div>
                      {/* Mentor Header: Avatar, Name, Location & Fav */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-base font-bold text-cyan-300 group-hover:scale-105 transition-transform">
                            {mName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-base leading-tight">{mName}</h3>
                              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 text-[9px] font-semibold text-emerald-300">
                                Verified
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{mentor.location || "Green Valley Heights, Chennai"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Favorite Button */}
                        <button
                          onClick={() => handleToggleFavorite(mId)}
                          className={`rounded-full p-2 text-xs transition cursor-pointer ${
                            isFav ? "text-rose-400 bg-rose-400/15" : "text-slate-400 bg-white/5 hover:text-white"
                          }`}
                          title={isFav ? "Remove favorite" : "Save mentor"}
                        >
                          <Heart className={`h-4 w-4 ${isFav ? "fill-rose-400" : ""}`} />
                        </button>
                      </div>

                      {/* Bio */}
                      <p className="mt-4 text-xs text-slate-300 italic line-clamp-2 bg-white/5 rounded-2xl p-3">
                        "{mentor.bio || "Passionate community mentor ready to share skills and guide neighbors."}"
                      </p>

                      {/* Skill Badges with Experience Levels */}
                      <div className="mt-4 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teaches:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {skillsArr.map((sk: any) => {
                            const skName = sk.skill_name || sk.name || sk;
                            const skYears = sk.years || sk.years_of_experience;
                            const skLevel = sk.level || sk.experience_level;
                            return (
                              <span
                                key={skName}
                                className="inline-flex items-center gap-1 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200"
                              >
                                {skName}
                                {skYears ? <span className="text-[10px] text-cyan-300/70">({skYears}y)</span> : null}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Availability Windows */}
                      {availArr.length > 0 && (
                        <div className="mt-4 rounded-xl border border-white/5 bg-slate-950/50 p-2.5 text-xs text-slate-300">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 mb-1">
                            <Clock className="h-3 w-3" /> Free Windows:
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-1">
                            {availArr.slice(0, 3).map((av: string, i: number) => (
                              <span key={i} className="bg-white/5 rounded-md px-1.5 py-0.5">{av}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 border-t border-white/10 pt-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        {mReviews > 0 ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                            <Star className="h-3.5 w-3.5 fill-amber-400" />
                            <span>{mRating.toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({mReviews} {mReviews === 1 ? "review" : "reviews"})</span>
                          </div>
                        ) : (
                          <span className="rounded-full bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                            ⭐ New Community Mentor
                          </span>
                        )}

                        <Link
                          href={`/search/mentor/${mId}`}
                          className="text-xs font-bold text-cyan-300 hover:underline"
                        >
                          View Full Profile →
                        </Link>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <button
                          onClick={() => handleOpenBookingModal(mentor)}
                          className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> Request Session
                        </button>
                        <Link
                          href={`/messages?user=${mId}`}
                          className="rounded-full bg-white/5 border border-white/10 p-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
                          title="Direct Message"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct Booking Modal */}
        {bookingMentor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Schedule Class</span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Request Session with {bookingMentor.full_name || bookingMentor.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {bookingMentor.location || "Green Valley Heights"}
                  </p>
                </div>
                <button
                  onClick={() => setBookingMentor(null)}
                  className="rounded-full bg-white/5 p-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs text-slate-300">
                {/* Select Skill */}
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Select Subject / Skill</label>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                    value={bookingSkillId}
                    onChange={(e) => setBookingSkillId(Number(e.target.value))}
                  >
                    {(bookingMentor.skills || []).map((sk: any) => (
                      <option key={sk.skill_id || sk.name} value={sk.skill_id || 1}>
                        {sk.skill_name || sk.name} {sk.years ? `(${sk.years} yrs)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Delivery Mode */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-300">Preferred Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-slate-300">Delivery Mode</label>
                    <select
                      value={bookingMode}
                      onChange={(e) => setBookingMode(e.target.value as any)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                    >
                      <option value="online">Online (Auto Video Room)</option>
                      <option value="in_person">In-Person (Society Clubhouse/Lawn)</option>
                    </select>
                  </div>
                </div>

                {/* Location if in-person */}
                {bookingMode === "in_person" && (
                  <div>
                    <label className="mb-1 block font-semibold text-slate-300">In-Society Meeting Spot</label>
                    <input
                      type="text"
                      value={bookingLocation}
                      onChange={(e) => setBookingLocation(e.target.value)}
                      placeholder="e.g. Tower B Clubhouse, Gazebo"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                {/* Note / Goals */}
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">What would you like to focus on?</label>
                  <textarea
                    rows={3}
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    placeholder="Share specific topics (e.g. algorithm basics, guitar chord progressions)..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setBookingMentor(null)}
                    className="flex-1 rounded-full border border-white/10 bg-white/5 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 py-3 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                  >
                    {submittingBooking ? "Sending Request..." : "Confirm & Send Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mr-2" /> Loading Discover...
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
