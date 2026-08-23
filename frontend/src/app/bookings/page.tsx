"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { mentors } from "@/lib/mock-data";
import { Calendar, Clock, MapPin, Video, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function BookingsPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  
  const [mentorId, setMentorId] = useState(mentors[0]?.id ?? "2");
  const [skill, setSkill] = useState(mentors[0]?.skills[0]?.name ?? "Python Programming");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<"online" | "in-person">("online");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("Community Hall A");
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/nexchange-session");

  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedMentor = useMemo(() => mentors.find((m) => m.id === mentorId) ?? mentors[0], [mentorId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getBookingHistory();
      setLiveSessions(res.data ?? []);
    } catch {
      setLiveSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSessions();
    }
  }, [currentUser]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !date || !selectedMentor) return;

    setSubmitting(true);
    setStatusMsg(null);

    // Find skill ID (default to 1 or 2 from seed)
    const skillIdMap: Record<string, number> = {
      "Python Programming": 1,
      "Web Development": 2,
      "Data Science": 3,
      "Mathematics": 4,
      "English Communication": 5,
      "Guitar": 6,
      "Yoga & Fitness": 7,
      "Digital Marketing": 8,
    };

    const skillId = skillIdMap[skill] ?? 1;

    try {
      await apiClient.bookSession({
        mentor_id: Number(mentorId),
        skill_id: skillId,
        session_mode: mode,
        session_date: date,
        meeting_link: mode === "online" ? meetingLink : undefined,
        location: mode === "in-person" ? location : undefined,
        learner_note: note || "Excited to learn together!",
      });

      setStatusMsg({ type: "success", text: "Session request sent to " + selectedMentor.name + "!" });
      setDate("");
      setNote("");
      fetchSessions();
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
      fetchSessions();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Could not cancel booking.");
    }
  };

  const grouped = useMemo(() => ({
    pending: liveSessions.filter((s) => s.status === "Pending"),
    accepted: liveSessions.filter((s) => s.status === "Accepted" || s.status === "Confirmed"),
    completed: liveSessions.filter((s) => s.status === "Completed"),
    cancelled: liveSessions.filter((s) => s.status === "Cancelled" || s.status === "Rejected"),
  }), [liveSessions]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Session Bookings</h1>
          <p className="mt-2.5 text-sm text-slate-400">Request sessions with verified mentors, track your schedule, and join online or in-person sessions.</p>
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Request Form */}
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">Book a 1-on-1 Session</h2>
            <form onSubmit={handleCreateBooking} className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Choose Mentor</label>
                  <select 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" 
                    value={mentorId} 
                    onChange={(event) => {
                      setMentorId(event.target.value);
                      const m = mentors.find(item => item.id === event.target.value);
                      if (m && m.skills.length > 0) setSkill(m.skills[0].name);
                    }}
                  >
                    {mentors.map((m) => (<option key={m.id} value={m.id}>{m.name} ({m.role})</option>))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Select Subject/Skill</label>
                  <select 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" 
                    value={skill} 
                    onChange={(event) => setSkill(event.target.value)}
                  >
                    {(selectedMentor.skills ?? []).map((skillEntry) => (<option key={skillEntry.name} value={skillEntry.name}>{skillEntry.name}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Session Date</label>
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" 
                    value={date} 
                    onChange={(event) => setDate(event.target.value)} 
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Session Mode</label>
                  <select 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" 
                    value={mode} 
                    onChange={(event) => setMode(event.target.value as "online" | "in-person")}
                  >
                    <option value="online">Online (Video Meet)</option>
                    <option value="in-person">In-person (Community Location)</option>
                  </select>
                </div>
              </div>

              {mode === "online" ? (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Meeting Link</label>
                  <input 
                    type="url" 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" 
                    value={meetingLink} 
                    onChange={(event) => setMeetingLink(event.target.value)} 
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Location</label>
                  <input 
                    type="text" 
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" 
                    value={location} 
                    onChange={(event) => setLocation(event.target.value)} 
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Note for Mentor</label>
                <textarea 
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" 
                  rows={3} 
                  placeholder="What specific topic or question would you like to cover?" 
                  value={note} 
                  onChange={(event) => setNote(event.target.value)} 
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Sending Request..." : "Submit Booking Request"}
              </button>
            </form>
          </div>

          {/* Selected Mentor Card Summary */}
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Mentor Profile</h2>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-xl font-bold text-cyan-300">
                  {selectedMentor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedMentor.name}</h3>
                  <p className="text-xs text-cyan-300 font-medium">{selectedMentor.role}</p>
                  <p className="text-xs text-slate-400">{selectedMentor.experience} experience · {selectedMentor.location}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">About Mentor</div>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedMentor.bio}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Usual Availability</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedMentor.availability.map((slot) => (
                    <span key={slot.day} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                      {slot.day} ({slot.label})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400 text-center">
              Skill exchange is 100% community-driven and free of charge.
            </div>
          </div>
        </div>

        {/* Live Booking History Sections */}
        <div className="mt-10 space-y-6">
          <h2 className="text-2xl font-bold text-white">Your Booked Sessions ({liveSessions.length})</h2>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading sessions...
            </div>
          ) : liveSessions.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-400">
              No sessions scheduled yet. Book your first session with a mentor above!
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {([
                ["Pending Approval", grouped.pending, "amber"],
                ["Confirmed & Upcoming", grouped.accepted, "emerald"],
                ["Completed", grouped.completed, "cyan"],
                ["Cancelled / Declined", grouped.cancelled, "rose"],
              ] as const).map(([label, list, color]) => (
                <div key={label} className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{label}</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                      {list.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {list.length ? (
                      list.map((session) => (
                        <div key={session.session_id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-white text-base">{session.skill_name || "Skill Session"}</div>
                              <div className="text-xs text-slate-400">
                                Mentor: <strong className="text-slate-200">{session.mentor_name || "Mentor"}</strong> · Learner: <strong className="text-slate-200">{session.learner_name || "Learner"}</strong>
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                              session.status === "Pending" ? "bg-amber-400/10 border-amber-400/20 text-amber-300" :
                              session.status === "Accepted" || session.status === "Confirmed" ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-300" :
                              session.status === "Completed" ? "bg-cyan-400/10 border-cyan-400/20 text-cyan-300" :
                              "bg-rose-400/10 border-rose-400/20 text-rose-300"
                            }`}>
                              {session.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                              <span>{session.session_date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {session.session_mode === "online" ? (
                                <Video className="h-3.5 w-3.5 text-teal-400" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                              )}
                              <span className="capitalize">{session.session_mode}</span>
                            </div>
                          </div>

                          {session.learner_note && (
                            <p className="text-xs text-slate-300 bg-white/5 rounded-xl p-2 italic">
                              "{session.learner_note}"
                            </p>
                          )}

                          {session.meeting_link && session.session_mode === "online" && (
                            <div className="pt-1">
                              <a 
                                href={session.meeting_link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
                              >
                                Join Video Call →
                              </a>
                            </div>
                          )}

                          {session.status === "Pending" && (
                            <div className="pt-2">
                              <button
                                onClick={() => handleCancelBooking(session.session_id)}
                                className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-400/20 transition cursor-pointer"
                              >
                                Cancel Request
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-4 text-xs text-slate-400">
                        No {label.toLowerCase()} sessions.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
