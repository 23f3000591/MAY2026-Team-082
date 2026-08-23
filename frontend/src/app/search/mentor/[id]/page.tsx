"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, MessageSquare, Star, Calendar, ShieldCheck,
  Video, MapPin as MapPinIcon, Clock, CheckCircle, AlertCircle,
  X, Send, Loader2, Sparkles, Check
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { mentorService } from "@/lib/services/mentor-service";
import { apiClient } from "@/lib/api-client";

interface BackendReview {
  review_id: number;
  session_id: number;
  learner_id: number;
  mentor_id: number;
  rating: number;
  review_text: string | null;
  created_at: string | null;
}

interface AvailabilitySlot {
  availability_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  time_range?: string;
  label?: string;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const addFavoriteMentor = useAppStore((state) => state.addFavoriteMentor);
  const removeFavoriteMentor = useAppStore((state) => state.removeFavoriteMentor);
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [composeMessage, setComposeMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [backendReviews, setBackendReviews] = useState<BackendReview[]>([]);
  const [apiMentor, setApiMentor] = useState<any>(null);
  const [mentorSlots, setMentorSlots] = useState<AvailabilitySlot[]>([]);

  // --- Request Session Modal State ---
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionMode, setSessionMode] = useState<"online" | "in_person">("online");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("18:00");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [sessionNote, setSessionNote] = useState("");
  const [submittingSession, setSubmittingSession] = useState(false);

  const mentorId = typeof params?.id === "string" ? params.id : "";
  const isFavorite = currentUser?.favorites?.includes(mentorId) ?? false;

  // Fetch real reviews, mentor details & availability from backend
  useEffect(() => {
    if (!mentorId) return;
    apiClient.getMentorReviews(mentorId).then((res) => {
      setBackendReviews(res.data ?? []);
    }).catch(() => {});

    // Fetch availability slots directly from availability API
    apiClient.getMentorAvailability(mentorId).then((res: any) => {
      const slots = res?.data ?? [];
      if (Array.isArray(slots) && slots.length > 0) {
        setMentorSlots(slots);
      }
    }).catch(() => {});

    mentorService.getDetails(mentorId).then((res: any) => {
      if (res) {
        const data = res.data || res;
        setApiMentor({
          id: String(data.id || data.user_id || mentorId),
          name: data.name || data.full_name,
          role: "mentor",
          location: data.location || "Remote",
          experience: `${data.years_of_experience || data.yearsExperience || 0} years`,
          rating: data.rating ?? 4.5,
          reviews: data.review_count ?? data.reviews ?? 0,
          price: "Flexible",
          bio: data.bio || "Experienced mentor helping learners grow confidently.",
          skills: Array.isArray(data.skills)
            ? data.skills.map((s: any) => typeof s === "string" ? { name: s, skill_id: 1 } : s)
            : [],
          availability: Array.isArray(data.availability) ? data.availability : [],
        });
      }
    }).catch(() => {});

    // Pre-fill tomorrow's date
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    setSessionDate(tom.toISOString().split("T")[0]);
  }, [mentorId]);

  const mentor = useMemo(() => {
    if (apiMentor) return apiMentor;
    const mentorUser = users.find((item) => item.id === mentorId && item.role === "mentor");
    if (!mentorUser) return null;
    return {
      id: mentorUser.id,
      name: mentorUser.name,
      role: mentorUser.role,
      location: mentorUser.location ?? "Remote",
      experience: `${mentorUser.yearsExperience ?? 0} years`,
      rating: mentorUser.rating ?? 4.5,
      reviews: mentorUser.reviews ?? 0,
      price: "Flexible",
      bio: mentorUser.bio ?? "Experienced mentor helping learners grow confidently.",
      skills: mentorUser.skills ?? [],
      availability: [],
    };
  }, [mentorId, users, apiMentor]);

  // Combine availability from API or mentor details
  const allSlots: AvailabilitySlot[] = useMemo(() => {
    if (mentorSlots.length > 0) return mentorSlots;
    if (mentor?.availability && Array.isArray(mentor.availability)) {
      return mentor.availability.map((a: any, idx: number) => {
        if (typeof a === "object" && a.day_of_week) return a;
        return {
          availability_id: idx + 1,
          day_of_week: a.day || a.day_of_week || "Flexible",
          start_time: a.start_time || "18:00",
          end_time: a.end_time || "20:30",
          label: a.label || String(a),
        };
      });
    }
    return [];
  }, [mentorSlots, mentor?.availability]);

  // Compute summary of availability (e.g. "Monday – Friday (6:00 PM – 8:30 PM)")
  const availabilitySummary = useMemo(() => {
    if (allSlots.length === 0) return null;
    
    // Check if all 5 weekdays exist with same hours
    const weekdaySlots = allSlots.filter((s) => WEEKDAYS.includes(s.day_of_week));
    if (weekdaySlots.length >= 5) {
      const first = weekdaySlots[0];
      const allSame = weekdaySlots.every(
        (s) => s.start_time === first.start_time && s.end_time === first.end_time
      );
      if (allSame) {
        const sFormatted = formatTime12(first.start_time);
        const eFormatted = formatTime12(first.end_time);
        return {
          title: "Monday – Friday (Mon to Fri)",
          time: `${sFormatted} – ${eFormatted}`,
          tag: "Weekday Evenings",
        };
      }
    }
    return null;
  }, [allSlots]);

  // Selected date's day of week
  const selectedDayOfWeek = useMemo(() => {
    if (!sessionDate) return "";
    const parsed = new Date(sessionDate + "T00:00:00");
    if (isNaN(parsed.getTime())) return "";
    return ALL_DAYS[parsed.getDay() === 0 ? 6 : parsed.getDay() - 1] || "";
  }, [sessionDate]);

  // Slots matching the chosen date's day of week
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDayOfWeek) return [];
    return allSlots.filter(
      (s) => s.day_of_week.toLowerCase() === selectedDayOfWeek.toLowerCase() || s.day_of_week === "Flexible"
    );
  }, [allSlots, selectedDayOfWeek]);

  // When date changes, auto-select matching slot if available
  useEffect(() => {
    if (slotsForSelectedDate.length > 0) {
      const first = slotsForSelectedDate[0];
      setSelectedSlotId(first.availability_id);
      setSessionTime(first.start_time || "18:00");
    } else {
      setSelectedSlotId(null);
    }
  }, [slotsForSelectedDate]);

  function formatTime12(timeStr: string) {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const mStr = m !== undefined ? String(m).padStart(2, "0") : "00";
    return `${h12}:${mStr} ${ampm}`;
  }

  const mentorReviews = backendReviews;

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ---- Request Session Modal Submit ----
  const handleRequestSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { showMsg("error", "Please log in to request a session."); return; }
    if (!mentor) { showMsg("error", "Mentor not found."); return; }
    if (!sessionDate) { showMsg("error", "Please pick a date."); return; }

    setSubmittingSession(true);
    const modeLabel = sessionMode === "online" ? "online (video call)" : "in-person";
    const chosenSlot = allSlots.find((s) => s.availability_id === selectedSlotId);
    const timeDisplay = chosenSlot 
      ? `${formatTime12(chosenSlot.start_time)} – ${formatTime12(chosenSlot.end_time)}`
      : formatTime12(sessionTime);

    const formattedMsg = `Hi ${mentor.name}, I'd like to schedule a ${modeLabel} session on ${sessionDate} (${selectedDayOfWeek}) at ${timeDisplay}.${sessionNote.trim() ? ` Note: ${sessionNote.trim()}` : ""}`;

    try {
      // 1. Book the session via API
      const skillId = mentor.skills?.[0]?.skill_id || 1;
      await apiClient.bookSession({
        mentor_id: Number(mentor.id),
        skill_id: skillId,
        availability_id: selectedSlotId ? Number(selectedSlotId) : undefined,
        session_mode: sessionMode,
        session_date: sessionDate,
        meeting_link: sessionMode === "online" ? "https://meet.jit.si/NSEP-Session" : undefined,
        learner_note: sessionNote.trim() ? `${sessionNote.trim()} (Time: ${timeDisplay})` : `Session request for ${timeDisplay} (${selectedDayOfWeek}).`,
      });

      // 2. Send formatted chat message to mentor
      await apiClient.sendChatMessage({
        receiver_id: mentor.id,
        message: formattedMsg,
      });

      setShowSessionModal(false);
      setSessionNote("");
      showMsg("success", `Session request sent to ${mentor.name}! They'll confirm shortly.`);
    } catch (err: any) {
      showMsg("error", err?.response?.data?.message || "Failed to send session request.");
    } finally {
      setSubmittingSession(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser) { showMsg("error", "Please log in to send a message."); return; }
    if (!mentor) { showMsg("error", "Mentor not found."); return; }
    if (!composeMessage.trim()) { showMsg("error", "Type your message first."); return; }
    try {
      await apiClient.sendChatMessage({ receiver_id: mentor.id, message: composeMessage.trim() });
      setComposeMessage("");
      showMsg("success", "Message sent!");
    } catch (err: any) {
      showMsg("error", err?.response?.data?.message ?? "Failed to send message.");
    }
  };

  const handleAddFavorite = async () => {
    if (!currentUser) { showMsg("error", "Please log in to save favorites."); return; }
    if (!mentor) return;
    setIsAddingFavorite(true);
    const mIdStr = String(mentor.id);
    const currentlyFav = (currentUser.favorites || []).map(String).includes(mIdStr);
    try {
      if (currentlyFav) {
        try { await mentorService.removeFromFavorites(mIdStr); } catch (e: any) { if (e?.response?.status !== 404) throw e; }
        removeFavoriteMentor(mIdStr);
        showMsg("success", "Removed from favorites.");
      } else {
        try { await mentorService.addToFavorites(mIdStr); } catch (e: any) { if (e?.response?.status !== 409) throw e; }
        addFavoriteMentor(mIdStr);
        showMsg("success", "Mentor saved to favorites!");
      }
    } catch (error: any) {
      showMsg("error", error?.response?.data?.message || "Failed to update favorites.");
    } finally {
      setIsAddingFavorite(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !reviewComment.trim() || reviewRating < 1) {
      showMsg("error", "Please add a rating and comment before submitting.");
      return;
    }
    try {
      const res = await apiClient.submitReview({
        session_id: 0,
        mentor_id: mentorId,
        rating: reviewRating,
        review_text: reviewComment.trim(),
      });
      setBackendReviews((prev) => [res.data, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      showMsg("success", "Review submitted successfully.");
    } catch (err: any) {
      showMsg("error", err?.response?.data?.message ?? "Failed to submit review.");
    }
  };

  if (!mentor) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 text-center text-slate-300">Mentor not found.</div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {/* Back */}
        <div className="mb-6 flex items-center gap-3 text-sm text-cyan-300">
          <button className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 cursor-pointer hover:bg-white/10 transition" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link href="/search" className="hover:text-white">Back to search</Link>
        </div>

        {/* Status toast */}
        {message && (
          <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 text-sm ${
            message.type === "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-rose-400/20 bg-rose-400/10 text-rose-300"
          }`}>
            {message.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Header */}
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
            {/* Left: Bio */}
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-2xl font-bold text-white shadow-lg">
                  {mentor.name?.charAt(0)}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">Mentor Profile</div>
                  <h1 className="mt-1 text-3xl font-bold text-white">{mentor.name}</h1>
                  <div className="mt-1 flex items-center gap-2 text-slate-400 text-sm">
                    <MapPinIcon className="h-3.5 w-3.5 text-cyan-400" /> {mentor.location}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {mentor.skills.map((skill: any) => (
                  <span key={skill.name || skill.skill_name || skill} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    {skill.name || skill.skill_name || skill}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-slate-300">{mentor.bio}</p>
            </div>

            {/* Right: Actions Panel */}
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6 space-y-5">
              {/* Rating */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">Community Rating</div>
                  {mentor.reviews > 0 ? (
                    <div className="mt-1 text-3xl font-bold text-white">{mentor.rating}<span className="text-base font-normal text-slate-400">/5</span></div>
                  ) : (
                    <div className="mt-1 text-lg font-bold text-cyan-300">New Mentor</div>
                  )}
                </div>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {mentor.reviews > 0 ? `${mentor.reviews} reviews` : "0 reviews yet"}
                </span>
              </div>

              <div className="grid gap-2 text-xs text-slate-400">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">📍 {mentor.location}</div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">🎓 {mentor.experience} experience</div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">💰 {mentor.price}</div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (!currentUser) { showMsg("error", "Please log in to request a session."); return; }
                    setShowSessionModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110 cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5" /> Request Session
                </button>
                <button
                  onClick={handleAddFavorite}
                  disabled={isAddingFavorite}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    isFavorite
                      ? "border-pink-500/40 bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-pink-400 text-pink-400" : ""}`} />
                  {isFavorite ? "Saved" : "Save Mentor"}
                </button>
                <Link
                  href="/messages?to=1&name=Society%20Admin"
                  className="flex items-center gap-1.5 rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-400/20 transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Message Admin
                </Link>
              </div>

              {/* Quick Message */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-slate-400">Send a quick message</label>
                <textarea
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
                  rows={3}
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Write a message to the mentor..."
                />
                <button
                  onClick={handleSendMessage}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 transition cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Send Message
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Availability Section */}
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" /> Mentor Availability
              </h2>
              <p className="text-xs text-slate-400 mt-1">Available days and hours for 1-on-1 learning sessions</p>
            </div>
            <button
              onClick={() => {
                if (!currentUser) { showMsg("error", "Please log in to request a session."); return; }
                setShowSessionModal(true);
              }}
              className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-4 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition cursor-pointer self-start sm:self-auto"
            >
              Book Available Slot →
            </button>
          </div>

          {/* Weekday Summary Banner if Mon-Fri */}
          {availabilitySummary && (
            <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-indigo-500/15 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">{availabilitySummary.tag}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{availabilitySummary.title} · {availabilitySummary.time}</div>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300 hidden sm:inline-block">
                ✓ Regular Weekday Free Hours
              </span>
            </div>
          )}

          {/* Grid of Days */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allSlots.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-white/5 bg-white/5 p-6 text-center text-xs text-slate-400">
                Flexible availability by appointment. Click "Request Session" to specify your preferred date & time.
              </div>
            ) : (
              allSlots.map((slot) => {
                const sFormatted = formatTime12(slot.start_time);
                const eFormatted = formatTime12(slot.end_time);
                const timeText = sFormatted && eFormatted ? `${sFormatted} – ${eFormatted}` : slot.time_range || slot.label;
                return (
                  <div
                    key={`${slot.day_of_week}-${slot.availability_id || slot.start_time}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-cyan-400/30 transition"
                  >
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{slot.day_of_week}</span>
                        {WEEKDAYS.includes(slot.day_of_week) && (
                          <span className="rounded bg-cyan-400/10 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-300">Weekday</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-1">{timeText}</div>
                    </div>
                    <button
                      onClick={() => {
                        if (!currentUser) { showMsg("error", "Please log in to request a session."); return; }
                        setSelectedSlotId(slot.availability_id);
                        setSessionTime(slot.start_time || "18:00");
                        setShowSessionModal(true);
                      }}
                      className="rounded-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 transition cursor-pointer"
                    >
                      Book
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Reviews */}
        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Reviews</h2>
              <span className="text-xs text-slate-400">{mentorReviews.length} total reviews</span>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="space-y-4">
              {mentorReviews.length ? mentorReviews.map((review) => (
                <div key={review.review_id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">{review.rating}/5</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{review.review_text ?? ""}</p>
                </div>
              )) : <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">No reviews yet.</div>}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
              <h3 className="text-base font-semibold text-white">Leave feedback</h3>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)} className="cursor-pointer p-0.5">
                        <Star className={`h-6 w-6 ${s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Comment</label>
                  <textarea
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                  />
                </div>
                <button
                  onClick={handleSubmitReview}
                  className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer hover:brightness-110 transition"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ====== Request Session Modal ====== */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Schedule 1-on-1 Session</h3>
                <p className="text-xs text-slate-400 mt-0.5">with <span className="text-cyan-300 font-semibold">{mentor.name}</span></p>
              </div>
              <button onClick={() => setShowSessionModal(false)} className="rounded-full bg-white/5 p-1.5 text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRequestSession} className="space-y-4 text-xs text-slate-300">
              {/* Mode */}
              <div>
                <label className="mb-1.5 block font-semibold text-slate-300">Session Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionMode("online")}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition cursor-pointer ${
                      sessionMode === "online"
                        ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <Video className="h-4 w-4" /> Online (Video)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionMode("in_person")}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition cursor-pointer ${
                      sessionMode === "in_person"
                        ? "border-teal-400/50 bg-teal-500/20 text-teal-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <MapPinIcon className="h-4 w-4" /> In-Person (Clubhouse)
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Session Date
                  </label>
                  {selectedDayOfWeek && (
                    <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                      {selectedDayOfWeek}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              {/* Timing Options from Mentor Availability */}
              <div>
                <label className="mb-1.5 block font-semibold text-slate-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" /> Timing / Time Slot
                </label>

                {slotsForSelectedDate.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                      <Check className="h-3 w-3" /> Mentor is available on {selectedDayOfWeek}:
                    </span>
                    <div className="grid gap-2">
                      {slotsForSelectedDate.map((slot) => {
                        const isSelected = selectedSlotId === slot.availability_id;
                        const sFormatted = formatTime12(slot.start_time);
                        const eFormatted = formatTime12(slot.end_time);
                        return (
                          <button
                            key={slot.availability_id}
                            type="button"
                            onClick={() => {
                              setSelectedSlotId(slot.availability_id);
                              setSessionTime(slot.start_time || "18:00");
                            }}
                            className={`flex items-center justify-between rounded-xl border p-3 text-xs transition cursor-pointer text-left ${
                              isSelected
                                ? "border-cyan-400/50 bg-cyan-500/20 text-white font-bold shadow-sm"
                                : "border-white/10 bg-slate-950/70 text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            <div>
                              <div className="font-bold text-cyan-200">{sFormatted} – {eFormatted}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{slot.day_of_week} Free Window</div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isSelected ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-400"
                            }`}>
                              {isSelected ? "Selected ✓" : "Choose"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-[11px] text-amber-200">
                      Mentor has not listed specific fixed slots for {selectedDayOfWeek || "this day"}. You can choose a custom time:
                    </p>
                    <input
                      type="time"
                      required
                      value={sessionTime}
                      onChange={(e) => {
                        setSessionTime(e.target.value);
                        setSelectedSlotId(null);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="mb-1.5 block font-semibold text-slate-300">Learning Goals / Note <span className="text-slate-500">(optional)</span></label>
                <textarea
                  rows={2}
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  placeholder="e.g. Guidance on conversational practice, homework review..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              {/* Live Preview */}
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-[11px] text-cyan-300 italic">
                Preview: "Hi {mentor.name}, I'd like to schedule a{" "}
                {sessionMode === "online" ? "online (video call)" : "in-person"} session on{" "}
                {sessionDate || "—"} ({selectedDayOfWeek}) at{" "}
                {selectedSlotId && allSlots.find((s) => s.availability_id === selectedSlotId)
                  ? `${formatTime12(allSlots.find((s) => s.availability_id === selectedSlotId)!.start_time)} – ${formatTime12(allSlots.find((s) => s.availability_id === selectedSlotId)!.end_time)}`
                  : formatTime12(sessionTime)}."
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSession}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                >
                  {submittingSession ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {submittingSession ? "Sending..." : "Confirm & Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SiteShell>
  );
}
