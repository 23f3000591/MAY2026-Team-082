"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  ArrowUpRight, 
  Users, 
  Loader2, 
  BookOpen, 
  Calendar, 
  Clock,
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Video, 
  MapPin, 
  Star, 
  CheckCheck,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  GraduationCap,
  Heart
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { mentorService } from "@/lib/services/mentor-service";

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state for learners
  const [reviewModalSession, setReviewModalSession] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  const isMentor = currentUser?.role?.toLowerCase() === "mentor";
  const role = currentUser?.role ?? "learner";

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        apiClient.getBookingHistory(),
        mentorService.filter({}),
        apiClient.getRegisteredSkills(),
      ];

      if (currentUser?.id && isMentor) {
        promises.push(apiClient.getMentorReviews(currentUser.id));
      }

      const results = await Promise.allSettled(promises);

      if (results[0].status === "fulfilled") {
        setSessions(results[0].value?.data ?? []);
      }
      if (results[1].status === "fulfilled") {
        const mData = Array.isArray(results[1].value) ? results[1].value : (results[1].value as any)?.data ?? [];
        setMentorsList(mData);
      }
      if (results[2].status === "fulfilled") {
        const skillObjs = results[2].value?.data ?? [];
        setAvailableSkills(skillObjs.map((s: any) => s.skill_name || s.name));
      }
      if (isMentor && results[3] && results[3].status === "fulfilled") {
        setReviews(results[3].value?.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser, isMentor]);

  const handleAccept = async (sessionId: number) => {
    setActionLoading(sessionId);
    try {
      await apiClient.acceptBooking(sessionId);
      loadDashboardData();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sessionId: number) => {
    setActionLoading(sessionId);
    try {
      await apiClient.rejectBooking(sessionId);
      loadDashboardData();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteSession = async (sessionId: number) => {
    setActionLoading(sessionId);
    try {
      await apiClient.completeBooking(sessionId);
      loadDashboardData();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSkillChipClick = (skill: string) => {
    router.push(`/search?query=${encodeURIComponent(skill)}`);
  };

  const handleSubmitLearnerReview = async (e: React.FormEvent) => {
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
      setReviewSuccessMsg("Thank you! Your review has been published.");
      setReviewModalSession(null);
      setReviewText("");
      setReviewRating(5);
      loadDashboardData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Mentor specific filtering
  const mentorSessions = sessions.filter((s) => String(s.mentor_id) === String(currentUser?.id));
  const pendingRequests = mentorSessions.filter((s) => s.status === "Pending");
  const confirmedMentorships = mentorSessions.filter((s) => s.status === "Accepted" || s.status === "Confirmed");

  // Learner generic filtering
  const learnerSessions = sessions.filter((s) => String(s.learner_id) === String(currentUser?.id));
  const learnerUpcoming = learnerSessions.filter((s) => s.status === "Accepted" || s.status === "Confirmed");
  const learnerPending = learnerSessions.filter((s) => s.status === "Pending");
  const learnerCompleted = learnerSessions.filter((s) => s.status === "Completed");

  const avgRating = reviews.length 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 sm:px-6 lg:px-8">
        {/* Top Hero Banner */}
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">
                {isMentor ? "Mentor Home Hub" : role === "admin" ? "Admin Control Center" : "Neighborhood Learning Hub"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Welcome back, {currentUser?.name ?? "Member"}.
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {isMentor 
                  ? "Here is your daily snapshot of incoming learner requests, confirmed sessions, and community feedback."
                  : "Discover neighbors sharing skills in Green Valley Heights, join scheduled classes, and expand your talents."}
              </p>

              {/* Learner Instant Search Bar */}
              {!isMentor && role !== "admin" && (
                <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row items-stretch gap-2.5 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="What skill do you want to learn? (e.g. Guitar, Python, Yoga)"
                      className="w-full rounded-full border border-white/10 bg-slate-950/80 pl-11 pr-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-6 py-3 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer"
                  >
                    Find Mentors
                  </button>
                </form>
              )}

              {/* Admin Quick Governance Strip */}
              {role === "admin" && (
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link
                    href="/admin"
                    className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 transition hover:brightness-110"
                  >
                    Admin Control Center →
                  </Link>
                  <Link
                    href="/admin/users"
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                  >
                    Manage Residents
                  </Link>
                  <Link
                    href="/admin/reports"
                    className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition"
                  >
                    Moderation Queue
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isMentor ? (
                <>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
                    {pendingRequests.length} Pending
                  </span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
                    {confirmedMentorships.length} Confirmed
                  </span>
                </>
              ) : role === "admin" ? (
                <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-2 text-xs font-semibold text-purple-200">
                  🛡️ System Administrator
                </span>
              ) : (
                <div className="flex flex-col sm:items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
                      {learnerUpcoming.length} Confirmed
                    </span>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
                      {learnerPending.length} Requested
                    </span>
                  </div>
                  <Link href="/search" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:underline">
                    Browse all neighborhood mentors →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Popular Community Skill Chips for Learners */}
          {!isMentor && role !== "admin" && availableSkills.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Popular in Community:</span>
              {availableSkills.map((sk) => (
                <button
                  key={sk}
                  onClick={() => handleSkillChipClick(sk)}
                  className="rounded-full border border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10 px-3.5 py-1 text-xs text-slate-300 hover:text-cyan-200 transition cursor-pointer"
                >
                  #{sk}
                </button>
              ))}
            </div>
          )}
        </section>

        {reviewSuccessMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{reviewSuccessMsg}</span>
          </div>
        )}

        {isMentor ? (
          /* ==================== MENTOR-SPECIFIC HOME VIEW ==================== */
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Left Column: Requests & Confirmed Mentoring */}
            <div className="space-y-8">
              {/* 1. Pending Learner Requests */}
              <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-400" /> Pending Learner Requests
                  </h2>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-0.5 text-xs font-semibold text-amber-300">
                    {pendingRequests.length} action needed
                  </span>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center p-8 text-slate-400 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading requests...
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-center text-xs text-slate-400">
                    You're all caught up! No pending learner requests waiting for approval.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div key={req.session_id} className="rounded-2xl border border-amber-500/20 bg-slate-950/70 p-4 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                              {req.skill_name || "Skill Mentorship"}
                            </span>
                            <div className="mt-1 font-bold text-white text-sm">Learner: {req.learner_name || "Community Learner"}</div>
                          </div>
                          <span className="text-xs text-slate-400">{req.session_date}</span>
                        </div>

                        {req.learner_note && (
                          <p className="text-xs text-slate-300 italic bg-white/5 rounded-xl p-2.5">
                            "{req.learner_note}"
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            {req.session_mode === "online" ? <Video className="h-3 w-3 text-cyan-400" /> : <MapPin className="h-3 w-3 text-amber-400" />}
                            <span className="capitalize">{req.session_mode}</span>
                          </div>
                          {req.location && <span>· {req.location}</span>}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <button
                            onClick={() => handleAccept(req.session_id)}
                            disabled={actionLoading === req.session_id}
                            className="flex-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleReject(req.session_id)}
                            disabled={actionLoading === req.session_id}
                            className="flex-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Decline
                          </button>
                          <Link
                            href={`/messages?user=${req.learner_id || ""}`}
                            className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition flex items-center justify-center gap-1"
                            title="Chat with learner before confirming"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Message
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 2. Confirmed Mentorship Sessions */}
              <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-cyan-400" /> Scheduled Sessions
                  </h2>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-0.5 text-xs font-semibold text-emerald-300">
                    {confirmedMentorships.length} active
                  </span>
                </div>

                {confirmedMentorships.length ? (
                  <div className="space-y-3">
                    {confirmedMentorships.map((session) => (
                      <div key={session.session_id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-white text-sm">{session.skill_name || "Mentorship Session"}</div>
                            <div className="text-xs text-slate-400 mt-0.5">Learner: <strong className="text-slate-200">{session.learner_name || "Learner"}</strong></div>
                          </div>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                            Confirmed
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-cyan-400" />
                            <span>{session.session_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {session.session_mode === "online" ? <Video className="h-3 w-3 text-teal-400" /> : <MapPin className="h-3 w-3 text-amber-400" />}
                            <span className="capitalize">{session.session_mode}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          {session.meeting_link && session.session_mode === "online" && (
                            <a
                              href={session.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition"
                            >
                              <Video className="h-3 w-3" /> Start Call
                            </a>
                          )}
                          <Link
                            href={`/messages?user=${session.learner_id || ""}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                          >
                            <MessageSquare className="h-3 w-3" /> Chat
                          </Link>
                          <button
                            onClick={() => handleCompleteSession(session.session_id)}
                            disabled={actionLoading === session.session_id}
                            className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 border border-teal-500/30 px-3 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-500/30 transition ml-auto cursor-pointer"
                          >
                            <CheckCheck className="h-3 w-3" /> Complete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-6 text-center text-xs text-slate-400">
                    No confirmed sessions yet. Once you accept incoming requests, they will show here.
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Quick Workspace Nav & Community Feedback */}
            <div className="space-y-8">
              {/* Quick Workspace Card */}
              <section className="rounded-[2.5rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-900/80 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="flex items-center gap-2 text-cyan-300 mb-3">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="font-bold text-white text-lg">Manage Schedule & Slots</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Publish weekly open hours, configure custom dates, and organize your teaching availability in the dedicated workspace.
                </p>
                <Link
                  href="/mentor"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110"
                >
                  Open Mentor Workspace <ArrowUpRight className="h-4 w-4" />
                </Link>
              </section>

              {/* Community Feedback & Credibility */}
              <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-cyan-400" /> Community Feedback
                  </h2>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
                    <Star className="h-3.5 w-3.5 fill-amber-400" /> {avgRating} ({reviews.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {reviews.length ? (
                    reviews.slice(0, 3).map((rev) => (
                      <div key={rev.review_id} className="rounded-xl border border-white/10 bg-slate-950/70 p-3.5 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400" />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-500">{rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Recent"}</span>
                        </div>
                        <p className="text-slate-300 italic">"{rev.review_text || "Great mentor, very helpful!"}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/20 p-4 text-center text-xs text-slate-400">
                      Learner reviews after completed sessions will appear here.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : (
          /* ==================== LEARNER / GENERAL HOME VIEW ==================== */
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Left Column: Scheduled Classes & Completed Feedbacks */}
            <div className="space-y-8">
              {/* 1. Confirmed Upcoming Classes */}
              <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-400" /> Your Upcoming Classes
                  </h2>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-0.5 text-xs font-semibold text-emerald-300">
                    {learnerUpcoming.length} confirmed
                  </span>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center p-8 text-slate-400 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading classes...
                  </div>
                ) : learnerUpcoming.length ? (
                  <div className="space-y-3">
                    {learnerUpcoming.map((session) => (
                      <div key={session.session_id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-white text-base">{session.skill_name || "Community Session"}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Mentor: <strong className="text-cyan-300">{session.mentor_name || "Mentor"}</strong>
                            </div>
                          </div>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                            Confirmed
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
                          {session.location && <span className="text-slate-300">· 📍 {session.location}</span>}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          {session.meeting_link && session.session_mode === "online" && (
                            <a
                              href={session.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition shadow-sm"
                            >
                              <Video className="h-3.5 w-3.5" /> Join Video Call
                            </a>
                          )}
                          <Link
                            href={`/messages?user=${session.mentor_id || ""}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat with Mentor
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-xs text-slate-400">
                    No confirmed classes scheduled. Search for a mentor above to request your first session!
                  </div>
                )}
              </section>

              {/* 2. Pending Requests Sent by Learner */}
              {learnerPending.length > 0 && (
                <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-400" /> Pending Booking Requests
                    </h2>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-0.5 text-xs font-semibold text-amber-300">
                      {learnerPending.length} waiting for mentor approval
                    </span>
                  </div>

                  <div className="space-y-3">
                    {learnerPending.map((req) => (
                      <div key={req.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <div>
                          <div className="font-bold text-white text-sm">{req.skill_name || "Session Request"}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Mentor: <strong className="text-slate-200">{req.mentor_name || "Mentor"}</strong> · {req.session_date} ({req.session_mode})
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                            Awaiting Response
                          </span>
                          <Link
                            href={`/messages?user=${req.mentor_id || ""}`}
                            className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 transition flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" /> Chat
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 3. Completed Sessions & Review Triggers */}
              {learnerCompleted.length > 0 && (
                <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-cyan-400" /> Completed Learning Sessions
                    </h2>
                    <span className="text-xs text-slate-400">{learnerCompleted.length} finished</span>
                  </div>

                  <div className="space-y-3">
                    {learnerCompleted.map((sess) => (
                      <div key={sess.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <div>
                          <div className="font-bold text-white text-sm">{sess.skill_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Taught by <strong className="text-slate-200">{sess.mentor_name}</strong> on {sess.session_date}
                          </div>
                        </div>
                        <button
                          onClick={() => setReviewModalSession(sess)}
                          className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-1.5 text-xs font-bold text-white hover:brightness-110 transition cursor-pointer flex items-center gap-1"
                        >
                          <Star className="h-3 w-3 fill-white" /> Rate & Review Mentor
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Top Community Mentors */}
            <div className="space-y-8">
              <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <Users className="h-5 w-5" /> 
                    <h2 className="text-xl font-bold text-white">Community Mentors</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/favorites" className="flex items-center gap-1 text-xs font-semibold text-pink-300 hover:text-pink-200 transition">
                      <Heart className="h-3.5 w-3.5 fill-pink-400/30" /> Saved
                    </Link>
                    <Link href="/search" className="text-xs font-semibold text-cyan-300 hover:underline">
                      View All →
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">Neighbors sharing skills in Green Valley Heights.</p>

                <div className="space-y-3">
                  {mentorsList.slice(0, 4).map((m) => {
                    const mName = m.full_name || m.name;
                    const mId = m.user_id || m.id;
                    const mRating = m.rating || 5.0;
                    const mSkills = Array.isArray(m.skills) ? m.skills : [];

                    return (
                      <div key={mId} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-sm font-bold text-cyan-300">
                              {mName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{mName}</div>
                              <div className="text-xs text-slate-400">{m.location || "Green Valley Heights"}</div>
                            </div>
                          </div>
                          {m.review_count > 0 || (m.rating && m.rating > 0) ? (
                            <span className="flex items-center gap-0.5 text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                              <Star className="h-3 w-3 fill-amber-400" /> {m.rating}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>

                        {/* Mentor Skill Badges */}
                        {mSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {mSkills.slice(0, 2).map((sk: any) => (
                              <span key={sk.name || sk.skill_name || sk} className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-300 font-medium">
                                {sk.name || sk.skill_name || sk}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <Link 
                            href={`/search/mentor/${mId}`} 
                            className="flex-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 text-center text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30 transition"
                          >
                            View Profile
                          </Link>
                          <Link 
                            href={`/messages?user=${mId}`} 
                            className="rounded-full bg-white/5 border border-white/10 p-1.5 text-slate-300 hover:text-white transition"
                            title="Direct Message"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Modal: Learner Review Submission */}
        {reviewModalSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Rate & Review Mentor</h3>
                <button 
                  onClick={() => setReviewModalSession(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300">
                How was your session on <strong>{reviewModalSession.skill_name}</strong> with <strong>{reviewModalSession.mentor_name}</strong>?
              </p>

              <form onSubmit={handleSubmitLearnerReview} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Rating</label>
                  <div className="flex items-center gap-2">
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
                  <label className="mb-1 block text-xs font-medium text-slate-400">Your Feedback</label>
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
