"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  ArrowUpRight, 
  Users, 
  Loader2, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Video, 
  MapPin, 
  Star, 
  CheckCheck,
  Award,
  Sparkles
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { mentorService } from "@/lib/services/mentor-service";

export default function DashboardPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isMentor = currentUser?.role?.toLowerCase() === "mentor";
  const role = currentUser?.role ?? "learner";

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        apiClient.getBookingHistory(),
        mentorService.filter({}),
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
      if (isMentor && results[2] && results[2].status === "fulfilled") {
        setReviews(results[2].value?.data ?? []);
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

  // Mentor specific filtering
  const mentorSessions = sessions.filter((s) => String(s.mentor_id) === String(currentUser?.id));
  const pendingRequests = mentorSessions.filter((s) => s.status === "Pending");
  const confirmedMentorships = mentorSessions.filter((s) => s.status === "Accepted" || s.status === "Confirmed");

  // Learner generic filtering
  const learnerSessions = sessions.filter((s) => String(s.learner_id) === String(currentUser?.id) && (s.status === "Accepted" || s.status === "Confirmed" || s.status === "Pending"));

  const avgRating = reviews.length 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 sm:px-6 lg:px-8">
        {/* Top Hero Banner */}
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">
                {isMentor ? "Mentor Home Hub" : role === "admin" ? "Admin Control Center" : "Learner Dashboard"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Welcome back, {currentUser?.name ?? "Member"}.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                {isMentor 
                  ? "Here is your daily snapshot of incoming learner requests, confirmed sessions, and community feedback."
                  : "Manage your skill exchange sessions, connect with local community mentors, and learn new skills."}
              </p>
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
                <Link href="/admin" className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-5 py-3 text-sm font-semibold text-purple-200 hover:bg-purple-400/20 transition">
                  Open Admin Center <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/search" className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/20 transition">
                  Discover Mentors <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

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
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            {/* Scheduled Sessions */}
            <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Your Scheduled Sessions</h2>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {learnerSessions.length} active
                </span>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center p-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading sessions...
                </div>
              ) : learnerSessions.length ? (
                <div className="space-y-3">
                  {learnerSessions.map((session) => (
                    <div key={session.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div>
                        <div className="font-bold text-white text-base">{session.skill_name || "Community Session"}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Mentor: <strong className="text-slate-200">{session.mentor_name || "Mentor"}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                          {session.session_date} ({session.session_mode})
                        </span>
                        {session.meeting_link && session.session_mode === "online" && (
                          <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition"
                          >
                            <Video className="h-3 w-3" /> Call
                          </a>
                        )}
                        <Link
                          href={`/messages?user=${session.mentor_id || ""}`}
                          className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                        >
                          <MessageSquare className="h-3 w-3" /> Chat
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-sm text-slate-400">
                  No upcoming sessions scheduled yet. Visit <Link href="/search" className="text-cyan-300 font-semibold hover:underline">Discover</Link> to book one!
                </div>
              )}
            </section>

            {/* Right Sidebar: Community Mentors */}
            <section className="space-y-6">
              <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-2 text-cyan-200">
                  <Users className="h-5 w-5" /> 
                  <h2 className="text-xl font-bold text-white">Community Mentors</h2>
                </div>
                <div className="space-y-3">
                  {mentorsList.slice(0, 3).map((m) => {
                    const mName = m.full_name || m.name;
                    const mId = m.user_id || m.id;
                    return (
                      <div key={mId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-sm font-bold text-cyan-300">
                            {mName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{mName}</div>
                            <div className="text-xs text-slate-400">{m.location || "Green Valley Heights"}</div>
                          </div>
                        </div>
                        <Link href={`/search/mentor/${mId}`} className="text-xs font-semibold text-cyan-300 hover:underline">
                          Profile →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
