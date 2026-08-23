"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Video, 
  MapPin, 
  MessageSquare,
  Star,
  CheckCheck,
  Loader2,
  AlertCircle,
  Award,
  History,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Info
} from "lucide-react";

// Community Free Time Windows for Neighborhood Mentors
const TIME_WINDOWS = [
  { id: "weekday_eve", label: "Weekday Evenings", sub: "6:00 PM – 8:30 PM", start: "18:00", end: "20:30", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], icon: Sunset },
  { id: "weekend_morn", label: "Weekend Mornings", sub: "9:00 AM – 12:00 PM", start: "09:00", end: "12:00", days: ["Saturday", "Sunday"], icon: Sun },
  { id: "weekend_aft", label: "Weekend Afternoons", sub: "3:00 PM – 6:00 PM", start: "15:00", end: "18:00", days: ["Saturday", "Sunday"], icon: Sun },
  { id: "weekday_morn", label: "Early Weekday Mornings", sub: "7:00 AM – 8:30 AM", start: "07:00", end: "08:30", days: ["Monday", "Wednesday", "Friday"], icon: Sun },
  { id: "night_session", label: "Late Evenings", sub: "8:30 PM – 10:00 PM", start: "20:30", end: "22:00", days: ["Tuesday", "Thursday"], icon: Moon },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MentorPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const [sessions, setSessions] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sessionFilter, setSessionFilter] = useState<"confirmed" | "completed" | "all">("confirmed");

  // Quick custom free-time window state
  const [customDay, setCustomDay] = useState("Saturday");
  const [customStartTime, setCustomStartTime] = useState("10:00");
  const [customEndTime, setCustomEndTime] = useState("12:00");
  const [showCustom, setShowCustom] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);

  const loadData = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const [sessionsRes, availRes, reviewsRes] = await Promise.allSettled([
        apiClient.getBookingHistory(),
        apiClient.getMentorAvailability(currentUser.id),
        apiClient.getMentorReviews(currentUser.id),
      ]);

      if (sessionsRes.status === "fulfilled") {
        const allSessions = sessionsRes.value?.data ?? [];
        const mentorSessions = allSessions.filter((s: any) => String(s.mentor_id) === String(currentUser.id));
        setSessions(mentorSessions);
      }
      if (availRes.status === "fulfilled") {
        setAvailability(availRes.value?.data ?? []);
      }
      if (reviewsRes.status === "fulfilled") {
        setReviews(reviewsRes.value?.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleCompleteSession = async (sessionId: number) => {
    setActionLoading(sessionId);
    setStatusMsg(null);
    try {
      await apiClient.completeBooking(sessionId);
      setStatusMsg({ type: "success", text: "Session marked as Completed! Learner has been invited to review." });
      loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.response?.data?.message || "Failed to complete session." });
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Toggle for Community Free Windows
  const handleToggleWindow = async (windowItem: typeof TIME_WINDOWS[0]) => {
    setAddingSlot(true);
    setStatusMsg(null);
    try {
      // Add a clean recurring availability slot for primary days of this window
      for (const day of windowItem.days.slice(0, 2)) {
        await apiClient.addAvailability({
          slot_type: "recurring",
          day_of_week: day,
          start_time: windowItem.start,
          end_time: windowItem.end,
        });
      }
      setStatusMsg({ 
        type: "success", 
        text: `Added "${windowItem.label}" (${windowItem.sub}) to your public availability!` 
      });
      loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.response?.data?.message || "Failed to set availability window." });
    } finally {
      setAddingSlot(false);
    }
  };

  const handleAddCustomWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSlot(true);
    setStatusMsg(null);
    try {
      await apiClient.addAvailability({
        slot_type: "recurring",
        day_of_week: customDay,
        start_time: customStartTime,
        end_time: customEndTime,
      });
      setStatusMsg({ 
        type: "success", 
        text: `Added ${customDay} (${customStartTime} - ${customEndTime}) to your free hours!` 
      });
      setShowCustom(false);
      loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.response?.data?.message || "Failed to add time window." });
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    setStatusMsg(null);
    try {
      await apiClient.deleteAvailability(slotId);
      setStatusMsg({ type: "success", text: "Availability window removed." });
      loadData();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.response?.data?.message || "Failed to delete slot." });
    }
  };

  const confirmedSessions = sessions.filter((s) => s.status === "Accepted" || s.status === "Confirmed");
  const completedSessions = sessions.filter((s) => s.status === "Completed");
  const filteredSessions = sessionFilter === "confirmed" 
    ? confirmedSessions 
    : sessionFilter === "completed" 
    ? completedSessions 
    : sessions;

  const avgRating = reviews.length 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  const isMentorOrAdmin = currentUser?.role?.toLowerCase() === "mentor" || currentUser?.role?.toLowerCase() === "admin";

  return (
    <SiteShell>
      {!isMentorOrAdmin ? (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-300">
            <Sparkles className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-white">Become a Neighborhood Mentor</h1>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            You are currently browsing NexChange as a <strong>Learner</strong>. Share your knowledge in coding, music, cooking, or fitness with neighbors in Green Valley Heights.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/profile"
              className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-6 py-3 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
            >
              Add Teaching Skills in Profile →
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              Back to Learner Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl flex flex-col gap-8 px-4 pb-20 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">Teaching Management Hub</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Mentor Workspace
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Share your general free hours with neighbors, manage scheduled classes, and see learner reviews.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-teal-400/20 bg-teal-400/10 px-3.5 py-1.5 text-xs font-semibold text-teal-300">
                  {availability.length} Free Windows Shared
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
                  {completedSessions.length} Completed Classes
                </span>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-cyan-400" />
                  {reviews.length > 0 ? `${avgRating} Rating (${reviews.length})` : "New Mentor (0 reviews)"}
                </span>
              </div>
            </div>
          </section>

          {statusMsg && (
            <div className={`flex items-center gap-3 rounded-2xl border p-4 text-sm ${
              statusMsg.type === "success" 
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-rose-400/20 bg-rose-400/10 text-rose-300"
            }`}>
              {statusMsg.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Section 1: Neighbor-Friendly "When I'm Usually Free" Section */}
          <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-400" /> When Are You Usually Free?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Let neighbors know your preferred free windows so they can propose session times that work for both of you.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCustom(!showCustom)}
                  className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 transition cursor-pointer"
                >
                  {showCustom ? "Close Custom" : "+ Add Custom Hours"}
                </button>
              </div>
            </div>

            {/* Custom Hours Sub-Form */}
            {showCustom && (
              <form onSubmit={handleAddCustomWindow} className="mb-6 rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 grid gap-4 sm:grid-cols-4 items-end">
                <div>
                  <label className="mb-1 block text-xs text-slate-400 font-medium">Day of Week</label>
                  <select
                    value={customDay}
                    onChange={(e) => setCustomDay(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                  >
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400 font-medium">From</label>
                  <input
                    type="time"
                    required
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400 font-medium">To</label>
                  <input
                    type="time"
                    required
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingSlot}
                  className="rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-xs py-2.5 px-4 transition cursor-pointer disabled:opacity-50"
                >
                  Save Free Hours
                </button>
              </form>
            )}

            {/* 1-Click Free Time Preset Chips */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">1-Click Common Windows in Green Valley</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TIME_WINDOWS.map((win) => {
                  const Icon = win.icon;
                  return (
                    <button
                      key={win.id}
                      onClick={() => handleToggleWindow(win)}
                      disabled={addingSlot}
                      className="flex items-start justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-left hover:border-teal-400/40 hover:bg-slate-950 transition cursor-pointer group disabled:opacity-50"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-bold text-xs text-white group-hover:text-teal-300 transition">
                          <Icon className="h-4 w-4 text-teal-400" /> {win.label}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{win.sub}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{win.days.join(", ")}</div>
                      </div>
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 group-hover:bg-teal-500/20 group-hover:border-teal-400/30 transition">
                        + Add
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Active Shared Windows */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Current Shared Availability</div>
                <span className="text-[11px] text-slate-400">Shown to neighbors on your profile</span>
              </div>

              {availability.length ? (
                <div className="flex flex-wrap gap-2.5">
                  {availability.map((slot) => (
                    <div 
                      key={slot.availability_id}
                      className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-200"
                    >
                      <span>{slot.day_of_week || slot.specific_date}: <strong>{slot.start_time} - {slot.end_time}</strong></span>
                      <button
                        onClick={() => handleDeleteSlot(slot.availability_id)}
                        className="text-teal-300 hover:text-rose-400 transition ml-1 cursor-pointer"
                        title="Remove Window"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Info className="h-4 w-4 text-cyan-400" /> Click any preset window above or add custom hours to let neighbors know when you're free.
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Full Mentorship Schedule & Session Records */}
          <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-cyan-400" /> Teaching Schedule & Records
                </h2>
                <p className="text-xs text-slate-400 mt-1">Manage active confirmed classes and view completed session logs.</p>
              </div>

              {/* Sub-filter Chips */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSessionFilter("confirmed")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    sessionFilter === "confirmed" 
                      ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300" 
                      : "bg-slate-950/60 border border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  Confirmed ({confirmedSessions.length})
                </button>
                <button
                  onClick={() => setSessionFilter("completed")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    sessionFilter === "completed" 
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" 
                      : "bg-slate-950/60 border border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  Completed ({completedSessions.length})
                </button>
                <button
                  onClick={() => setSessionFilter("all")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    sessionFilter === "all" 
                      ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" 
                      : "bg-slate-950/60 border border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  All ({sessions.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading sessions...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-8 text-center text-xs text-slate-400">
                No sessions found in this category.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredSessions.map((session) => {
                  const isConfirmed = session.status === "Accepted" || session.status === "Confirmed";
                  const isCompleted = session.status === "Completed";
                  return (
                    <div key={session.session_id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-base">{session.skill_name || "Mentorship Session"}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Learner: <strong className="text-slate-200">{session.learner_name || "Learner"}</strong></div>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          isCompleted
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : isConfirmed
                            ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                            : "border-slate-500/20 bg-slate-500/10 text-slate-400"
                        }`}>
                          {session.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                          <span>{session.session_date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {session.session_mode === "online" ? <Video className="h-3.5 w-3.5 text-teal-400" /> : <MapPin className="h-3.5 w-3.5 text-amber-400" />}
                          <span className="capitalize">{session.session_mode}</span>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                        {session.meeting_link && session.session_mode === "online" && isConfirmed && (
                          <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition"
                          >
                            <Video className="h-3.5 w-3.5" /> Start Call
                          </a>
                        )}

                        <Link
                          href={`/messages?user=${session.learner_id || ""}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </Link>

                        {isConfirmed && (
                          <button
                            onClick={() => handleCompleteSession(session.session_id)}
                            disabled={actionLoading === session.session_id}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition ml-auto cursor-pointer"
                          >
                            <CheckCheck className="h-3.5 w-3.5" /> Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 3: Detailed Reviews & Student Feedback */}
          <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-cyan-400" /> Student Reviews & Community Credibility
                </h2>
                <p className="text-xs text-slate-400 mt-1">Feedback and ratings given by learners after completing sessions with you.</p>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold text-cyan-300">
                {reviews.length} reviews
              </span>
            </div>

            {reviews.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((rev) => (
                  <div key={rev.review_id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">{rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Recent"}</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{rev.review_text || "Great mentor, very patient and knowledgeable!"}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-8 text-center text-xs text-slate-400">
                No reviews recorded yet. Reviews given by learners after completed sessions will appear here.
              </div>
            )}
          </section>
        </div>
      )}
    </SiteShell>
  );
}
