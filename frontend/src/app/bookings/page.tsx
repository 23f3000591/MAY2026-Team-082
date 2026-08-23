"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  MessageSquare, 
  Star, 
  RotateCcw, 
  List, 
  CalendarDays, 
  Sparkles, 
  BookOpen, 
  Filter, 
  GraduationCap, 
  CalendarCheck,
  Search,
  UserCheck,
  Heart,
  CheckCircle2
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { mentorService } from "@/lib/services/mentor-service";

type BookingTab = "upcoming" | "pending" | "completed" | "cancelled";
type ViewMode = "list" | "calendar";

export default function BookingsPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  
  const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Booking Form State
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [mentorSearchQuery, setMentorSearchQuery] = useState("");
  const [mentorCategoryFilter, setMentorCategoryFilter] = useState("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [mentorId, setMentorId] = useState<string>("");
  const [skillId, setSkillId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<"online" | "in_person">("online");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("Tower B Clubhouse");
  const [meetingLink, setMeetingLink] = useState("https://meet.jit.si/NSEP-Session");

  // Mentor availability slots & timing state
  const [mentorSlots, setMentorSlots] = useState<any[]>([]);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<number | null>(null);
  const [customTime, setCustomTime] = useState<string>("18:00");

  // Sessions and Reviews State
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review Modal State
  const [reviewModalSession, setReviewModalSession] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, mentorsRes] = await Promise.allSettled([
        apiClient.getBookingHistory(),
        mentorService.filter({}),
      ]);

      if (sessionsRes.status === "fulfilled") {
        setLiveSessions(sessionsRes.value?.data ?? []);
      }

      if (mentorsRes.status === "fulfilled") {
        const mData = Array.isArray(mentorsRes.value) ? mentorsRes.value : (mentorsRes.value as any)?.data ?? [];
        setMentorsList(mData);
        if (mData.length > 0) {
          const firstM = mData[0];
          const firstMId = String(firstM.user_id || firstM.id);
          setMentorId(firstMId);
          if (firstM.skills && firstM.skills.length > 0) {
            setSkillId(firstM.skills[0].skill_id || 1);
          }
        }
      }
    } catch {
      setLiveSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  // Fetch mentor availability slots whenever mentorId changes
  useEffect(() => {
    if (!mentorId) {
      setMentorSlots([]);
      return;
    }
    apiClient.getMentorAvailability(mentorId).then((res: any) => {
      const slots = res?.data ?? [];
      setMentorSlots(Array.isArray(slots) ? slots : []);
    }).catch(() => {
      setMentorSlots([]);
    });
  }, [mentorId]);

  // Helper to format time in 12-hour AM/PM format
  function formatTime12(timeStr: string) {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const mStr = m !== undefined ? String(m).padStart(2, "0") : "00";
    return `${h12}:${mStr} ${ampm}`;
  }

  // Selected date's day of week
  const selectedDayOfWeek = useMemo(() => {
    if (!date) return "";
    const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const parsed = new Date(date + "T00:00:00");
    if (isNaN(parsed.getTime())) return "";
    return ALL_DAYS[parsed.getDay() === 0 ? 6 : parsed.getDay() - 1] || "";
  }, [date]);

  // Slots matching the chosen date's day of week
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDayOfWeek) return [];
    return mentorSlots.filter(
      (s: any) => (s.day_of_week || "").toLowerCase() === selectedDayOfWeek.toLowerCase() || s.day_of_week === "Flexible"
    );
  }, [mentorSlots, selectedDayOfWeek]);

  // Auto-select first matching availability slot on date change
  useEffect(() => {
    if (slotsForSelectedDate.length > 0) {
      const first = slotsForSelectedDate[0];
      setSelectedAvailabilityId(first.availability_id);
      setCustomTime(first.start_time || "18:00");
    } else {
      setSelectedAvailabilityId(null);
    }
  }, [slotsForSelectedDate]);

  // Filter mentors based on search query, category, and favorite list
  const filteredMentors = useMemo(() => {
    const userFavs = (currentUser?.favorites || []).map(String);

    return mentorsList.filter((m) => {
      const mId = String(m.user_id || m.id);
      const name = (m.full_name || m.name || "").toLowerCase();
      const skillsStr = (m.skills || []).map((s: any) => (s.skill_name || s.name || "").toLowerCase()).join(" ");
      const matchesSearch = !mentorSearchQuery.trim() || 
        name.includes(mentorSearchQuery.toLowerCase()) || 
        skillsStr.includes(mentorSearchQuery.toLowerCase());
      
      const matchesCategory = mentorCategoryFilter === "all" || 
        (m.skills || []).some((s: any) => (s.category || "").toLowerCase() === mentorCategoryFilter.toLowerCase());

      const matchesFavs = !onlyFavorites || userFavs.includes(mId);

      return matchesSearch && matchesCategory && matchesFavs;
    });
  }, [mentorsList, mentorSearchQuery, mentorCategoryFilter, onlyFavorites, currentUser?.favorites]);

  const favoriteMentorsList = useMemo(() => {
    const userFavs = (currentUser?.favorites || []).map(String);
    return mentorsList.filter((m) => userFavs.includes(String(m.user_id || m.id)));
  }, [mentorsList, currentUser?.favorites]);

  const selectedMentor = useMemo(() => {
    return mentorsList.find((m) => String(m.user_id || m.id) === String(mentorId)) || filteredMentors[0] || mentorsList[0];
  }, [mentorsList, mentorId, filteredMentors]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !date || !mentorId) return;

    setSubmitting(true);
    setStatusMsg(null);

    const chosenSlot = mentorSlots.find((s) => s.availability_id === selectedAvailabilityId);
    const timeDisplay = chosenSlot 
      ? `${formatTime12(chosenSlot.start_time)} – ${formatTime12(chosenSlot.end_time)}`
      : formatTime12(customTime);

    try {
      await apiClient.bookSession({
        mentor_id: Number(mentorId),
        skill_id: Number(skillId) || 1,
        availability_id: selectedAvailabilityId ? Number(selectedAvailabilityId) : undefined,
        session_mode: mode,
        session_date: date,
        meeting_link: mode === "online" ? meetingLink : undefined,
        location: mode === "in_person" ? location : undefined,
        learner_note: note.trim() 
          ? `${note.trim()} (Preferred Time: ${timeDisplay})`
          : `Session requested for ${timeDisplay} (${selectedDayOfWeek}).`,
      });

      const mName = selectedMentor?.full_name || selectedMentor?.name || "Mentor";
      setStatusMsg({ type: "success", text: `Session request sent to ${mName} for ${timeDisplay}!` });
      setDate("");
      setNote("");
      setActiveTab("pending");
      
      const refresh = await apiClient.getBookingHistory();
      setLiveSessions(refresh.data ?? []);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || "Failed to submit booking request.";
      setStatusMsg({ type: "error", text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (sessionId: number) => {
    try {
      await apiClient.cancelBooking(sessionId);
      const refresh = await apiClient.getBookingHistory();
      setLiveSessions(refresh.data ?? []);
      setStatusMsg({ type: "success", text: "Session request cancelled." });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Could not cancel booking.");
    }
  };

  const handleBookAgain = (sess: any) => {
    setMentorId(String(sess.mentor_id));
    setSkillId(sess.skill_id || 1);
    setMode(sess.session_mode === "in_person" ? "in_person" : "online");
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    setDate(tom.toISOString().split("T")[0]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalSession) return;
    setSubmittingReview(true);
    try {
      await apiClient.submitReview({
        session_id: reviewModalSession.session_id,
        mentor_id: reviewModalSession.mentor_id,
        rating: reviewRating,
        review_text: reviewText.trim(),
      });
      setStatusMsg({ type: "success", text: "Thank you! Your review has been recorded." });
      setReviewModalSession(null);
      setReviewText("");
      setReviewRating(5);
      const refresh = await apiClient.getBookingHistory();
      setLiveSessions(refresh.data ?? []);
    } catch (err: any) {
      const status = err?.response?.status;
      const errMsg = err?.response?.data?.message || err.message || "Failed to submit review.";
      if (status === 409) {
        // Already reviewed - close modal and show info message
        setReviewModalSession(null);
        setStatusMsg({ type: "success", text: "You've already submitted feedback for this session." });
        // Refresh to get updated has_review flag
        const refresh = await apiClient.getBookingHistory();
        setLiveSessions(refresh.data ?? []);
      } else {
        setStatusMsg({ type: "error", text: errMsg });
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const grouped = useMemo(() => ({
    upcoming: liveSessions.filter((s) => s.status === "Accepted" || s.status === "Confirmed"),
    pending: liveSessions.filter((s) => s.status === "Pending"),
    completed: liveSessions.filter((s) => s.status === "Completed"),
    cancelled: liveSessions.filter((s) => s.status === "Cancelled" || s.status === "Rejected"),
  }), [liveSessions]);

  const activeSessions = grouped[activeTab] || [];

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Top Hero Banner */}
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">Session Management</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">My Learning Bookings</h1>
              <p className="mt-2 text-sm text-slate-300">
                Track your active mentorship schedule, review past classes, and request new 1-on-1 sessions.
              </p>
            </div>

            {/* Quick Tab Stats */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {grouped.upcoming.length} Confirmed
              </span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {grouped.pending.length} Pending
              </span>
            </div>
          </div>
        </section>

        {statusMsg && (
          <div className={`mt-6 flex items-center gap-3 rounded-2xl border p-4 text-sm ${
            statusMsg.type === "success" 
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-rose-400/20 bg-rose-400/10 text-rose-300"
          }`}>
            {statusMsg.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Interactive Booking Request Center */}
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="flex items-center gap-2 text-cyan-300 mb-2">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-xl font-bold text-white">Book a 1-on-1 Session</h2>
            </div>
            <p className="text-xs text-slate-400">Request learning time with verified community mentors in Green Valley Heights.</p>

            <form onSubmit={handleCreateBooking} className="mt-6 space-y-4 text-xs text-slate-300">
              {/* Mentor Search, Favorites Toggle, and Category Filter Strip */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Find & Choose Mentor</span>
                  <button
                    type="button"
                    onClick={() => setOnlyFavorites(!onlyFavorites)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      onlyFavorites
                        ? "bg-pink-500/20 text-pink-300 border border-pink-400/40 shadow-sm"
                        : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${onlyFavorites ? "fill-pink-400 text-pink-400" : ""}`} />
                    <span>My Favorites ({favoriteMentorsList.length})</span>
                  </button>
                </div>

                {/* Quick 1-Click Pick from Favorites */}
                {favoriteMentorsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Pick:</span>
                    {favoriteMentorsList.map((favM) => {
                      const favId = String(favM.user_id || favM.id);
                      const isSelected = mentorId === favId;
                      return (
                        <button
                          key={favId}
                          type="button"
                          onClick={() => {
                            setMentorId(favId);
                            if (favM.skills && favM.skills.length > 0) {
                              setSkillId(favM.skills[0].skill_id || 1);
                            }
                          }}
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold"
                              : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                          }`}
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pink-500/30 text-[9px] text-pink-300 font-bold">
                            {(favM.full_name || favM.name || "M").charAt(0)}
                          </span>
                          <span>{favM.full_name || favM.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={mentorSearchQuery}
                      onChange={(e) => setMentorSearchQuery(e.target.value)}
                      placeholder="Search mentor by name or skill..."
                      className="w-full rounded-xl border border-white/10 bg-slate-900 pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <select
                    value={mentorCategoryFilter}
                    onChange={(e) => setMentorCategoryFilter(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="all">🌟 All Skill Domains</option>
                    <option value="technology">💻 Technology</option>
                    <option value="music">🎸 Music</option>
                    <option value="fitness">🧘 Fitness</option>
                    <option value="cooking">🍳 Cooking</option>
                    <option value="arts & creativity">🎨 Arts & Creativity</option>
                    <option value="languages">🗣️ Languages</option>
                    <option value="academic">📚 Academic</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-semibold text-slate-300">Select Mentor ({filteredMentors.length} available)</label>
                  <select 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400" 
                    value={mentorId} 
                    onChange={(e) => {
                      const newId = e.target.value;
                      setMentorId(newId);
                      const m = mentorsList.find(item => String(item.user_id || item.id) === newId);
                      if (m && m.skills && m.skills.length > 0) {
                        setSkillId(m.skills[0].skill_id || 1);
                      }
                    }}
                  >
                    {filteredMentors.length === 0 ? (
                      <option value="">No mentors match your search</option>
                    ) : (
                      filteredMentors.map((m) => {
                        const id = String(m.user_id || m.id);
                        const name = m.full_name || m.name;
                        const skills = (m.skills || []).map((s: any) => s.skill_name || s.name).join(", ");
                        return (
                          <option key={id} value={id}>
                            {name} {skills ? `(${skills})` : ""}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block font-semibold text-slate-300">Select Subject / Skill</label>
                  <select 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400" 
                    value={skillId} 
                    onChange={(e) => setSkillId(Number(e.target.value))}
                  >
                    {(selectedMentor?.skills ?? []).length === 0 ? (
                      <option value={1}>General Mentorship Session</option>
                    ) : (
                      (selectedMentor?.skills ?? []).map((sk: any) => (
                        <option key={sk.skill_id || sk.name} value={sk.skill_id || 1}>
                          {sk.skill_name || sk.name} {sk.years ? `(${sk.years}y exp)` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Selected Mentor Snapshot Badge */}
              {selectedMentor && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 text-sm font-bold text-cyan-300">
                      {(selectedMentor.full_name || selectedMentor.name || "M").charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{selectedMentor.full_name || selectedMentor.name}</span>
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300">
                          ✓ Verified Neighbor
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">
                        {selectedMentor.location || "Green Valley Heights"} · {selectedMentor.reviews > 0 ? `⭐ ${selectedMentor.rating} (${selectedMentor.reviews} reviews)` : "New Community Mentor"}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/search/mentor/${selectedMentor.user_id || selectedMentor.id}`}
                    className="text-[11px] font-semibold text-cyan-300 hover:underline"
                  >
                    View Full Profile →
                  </Link>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-300 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Session Date
                    </label>
                    {selectedDayOfWeek && (
                      <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                        {selectedDayOfWeek}
                      </span>
                    )}
                  </div>
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split("T")[0]}
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400" 
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-semibold text-slate-300">Delivery Mode</label>
                  <select 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="online">Online (Live Video Call)</option>
                    <option value="in_person">In-Person (Society Clubhouse / Lawn)</option>
                  </select>
                </div>
              </div>

              {/* Mentor Availability Timing Options */}
              {date && (
                <div>
                  <label className="mb-1.5 block font-semibold text-slate-300 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" /> Available Timing for {selectedDayOfWeek}
                  </label>

                  {slotsForSelectedDate.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid gap-2">
                        {slotsForSelectedDate.map((slot: any) => {
                          const isSelected = selectedAvailabilityId === slot.availability_id;
                          const sFormatted = formatTime12(slot.start_time);
                          const eFormatted = formatTime12(slot.end_time);
                          return (
                            <button
                              key={slot.availability_id}
                              type="button"
                              onClick={() => {
                                setSelectedAvailabilityId(slot.availability_id);
                                setCustomTime(slot.start_time || "18:00");
                              }}
                              className={`flex items-center justify-between rounded-2xl border p-3.5 text-xs transition cursor-pointer text-left ${
                                isSelected
                                  ? "border-cyan-400/50 bg-cyan-500/20 text-white font-bold shadow-sm"
                                  : "border-white/10 bg-slate-950/70 text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              <div>
                                <div className="font-bold text-cyan-200">{sFormatted} – {eFormatted}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{slot.day_of_week} Mentor Free Window</div>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                isSelected ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-400"
                              }`}>
                                {isSelected ? "Selected ✓" : "Select"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3.5 space-y-2">
                      <p className="text-[11px] text-amber-200">
                        Mentor does not have fixed slots listed for {selectedDayOfWeek}. You can pick a custom time:
                      </p>
                      <input
                        type="time"
                        required
                        value={customTime}
                        onChange={(e) => {
                          setCustomTime(e.target.value);
                          setSelectedAvailabilityId(null);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {mode === "in_person" ? (
                <div>
                  <label className="mb-1.5 block font-semibold text-slate-300">Meeting Location (In Society)</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Tower B Clubhouse, Lawn Gazebo"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400" 
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block font-semibold text-slate-300">Auto Video Link</label>
                  <input 
                    type="text" 
                    value={meetingLink} 
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-slate-400 outline-none" 
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block font-semibold text-slate-300">Learning Goals / Note for Mentor</label>
                <textarea 
                  rows={3} 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Share what specific concepts or exercises you want guidance on..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400" 
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 py-3.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Submitting Request..." : "Submit Booking Request"}
              </button>
            </form>
          </div>

          {/* Right Column: 4-Tab Session Management & Calendar View */}
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              {/* Header with List / Calendar toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-cyan-400" /> Session Records
                </h2>

                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      viewMode === "list" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" /> List
                  </button>
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                      viewMode === "calendar" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <CalendarCheck className="h-3.5 w-3.5" /> Calendar
                  </button>
                </div>
              </div>

              {/* 4 Tabs: Upcoming | Pending | Completed | Cancelled */}
              <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
                {[
                  { id: "upcoming", label: "Upcoming", count: grouped.upcoming.length, color: "text-emerald-400" },
                  { id: "pending", label: "Pending", count: grouped.pending.length, color: "text-amber-400" },
                  { id: "completed", label: "Completed", count: grouped.completed.length, color: "text-cyan-400" },
                  { id: "cancelled", label: "Cancelled", count: grouped.cancelled.length, color: "text-rose-400" },
                ].map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as BookingTab)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        active
                          ? "bg-white/10 text-white border border-white/20 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`rounded-full bg-white/5 px-2 py-0.2 text-[10px] ${tab.color}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Content Area */}
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mb-2" />
                  <span className="text-xs">Loading bookings...</span>
                </div>
              ) : viewMode === "calendar" ? (
                /* Calendar Grid Visualization */
                <div className="mt-6 space-y-3">
                  <p className="text-xs text-slate-400">Chronological calendar view of scheduled sessions:</p>
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 pb-2 border-b border-white/5">
                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                  </div>
                  <div className="space-y-2 pt-2">
                    {liveSessions.map((s) => (
                      <div key={s.session_id} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 p-3 text-xs">
                        <div>
                          <div className="font-bold text-white">{s.session_date}</div>
                          <div className="text-slate-400">{s.skill_name} with <strong className="text-slate-200">{s.mentor_name}</strong></div>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          s.status === "Accepted" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                          s.status === "Pending" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                          s.status === "Completed" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                          "bg-rose-500/20 text-rose-300"
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* List View for Active Tab */
                <div className="mt-6 space-y-3">
                  {activeSessions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-xs text-slate-400">
                      No {activeTab} sessions found.
                    </div>
                  ) : (
                    activeSessions.map((s) => (
                      <div 
                        key={s.session_id} 
                        className={`rounded-2xl border bg-slate-950/70 p-4 space-y-3 ${
                          activeTab === "upcoming" ? "border-emerald-500/20" :
                          activeTab === "pending" ? "border-amber-500/20" :
                          activeTab === "completed" ? "border-cyan-500/20" :
                          "border-rose-500/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-white text-sm">{s.skill_name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Mentor: <strong className="text-slate-200">{s.mentor_name}</strong>
                            </div>
                          </div>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            activeTab === "upcoming" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                            activeTab === "pending" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            activeTab === "completed" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                            "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                            {s.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-cyan-400" /> {s.session_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-cyan-400" /> <span className="capitalize">{s.session_mode}</span>
                          </span>
                          {s.location && <span>· 📍 {s.location}</span>}
                        </div>

                        {s.learner_note && (
                          <p className="text-xs text-slate-300 italic bg-white/5 rounded-xl p-2.5">
                            "{s.learner_note}"
                          </p>
                        )}

                        {/* Action Triggers */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          {activeTab === "upcoming" && (
                            <>
                              {s.meeting_link && s.session_mode === "online" && (
                                <a
                                  href={s.meeting_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-sm"
                                >
                                  <Video className="h-3.5 w-3.5" /> Join Call
                                </a>
                              )}
                              <Link
                                href={`/messages?user=${s.mentor_id}`}
                                className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Chat
                              </Link>
                            </>
                          )}

                          {activeTab === "pending" && (
                            <>
                              <Link
                                href={`/messages?user=${s.mentor_id}`}
                                className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Message Mentor
                              </Link>
                              <button
                                onClick={() => handleCancelBooking(s.session_id)}
                                className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition ml-auto cursor-pointer"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Cancel Request
                              </button>
                            </>
                          )}

                          {activeTab === "completed" && (
                            <>
                              {s.has_review ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed
                                </span>
                              ) : (
                                <button
                                  onClick={() => setReviewModalSession(s)}
                                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110 transition cursor-pointer shadow-sm"
                                >
                                  <Star className="h-3.5 w-3.5 fill-white" /> Rate Mentor
                                </button>
                              )}
                              <button
                                onClick={() => handleBookAgain(s)}
                                className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition ml-auto cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Book Again
                              </button>
                            </>
                          )}

                          {activeTab === "cancelled" && (
                            <button
                              onClick={() => handleBookAgain(s)}
                              className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition ml-auto cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Try Booking Again
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Rate & Review Mentor */}
        {reviewModalSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Rate & Review Mentor</h3>
                <button 
                  onClick={() => setReviewModalSession(null)}
                  className="rounded-full bg-white/5 p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300">
                How was your session on <strong>{reviewModalSession.skill_name}</strong> with <strong>{reviewModalSession.mentor_name}</strong>?
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Star Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-amber-400 transition cursor-pointer"
                      >
                        <Star className={`h-6 w-6 ${star <= reviewRating ? "fill-amber-400" : "stroke-slate-600"}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-amber-300">{reviewRating} / 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Written Feedback</label>
                  <textarea
                    required
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share what you learned and your experience with this mentor..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalSession(null)}
                    className="flex-1 rounded-full border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
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
