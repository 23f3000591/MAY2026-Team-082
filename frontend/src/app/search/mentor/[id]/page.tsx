"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, MessageSquare, Star, AlertCircle } from "lucide-react";
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

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const addFavoriteMentor = useAppStore((state) => state.addFavoriteMentor);
  const removeFavoriteMentor = useAppStore((state) => state.removeFavoriteMentor);
  const addBooking = useAppStore((state) => state.addBooking);
  const currentUser = useAppStore((state) => state.currentUser);
  const users = useAppStore((state) => state.users);
  const [message, setMessage] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [sessionMode, setSessionMode] = useState<"Online" | "In-person" | "Hybrid">("Online");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [backendReviews, setBackendReviews] = useState<BackendReview[]>([]);
  const [apiMentor, setApiMentor] = useState<any>(null);
  const mentorId = typeof params?.id === "string" ? params.id : "";
  const isFavorite = currentUser?.favorites?.includes(mentorId) ?? false;

  // Fetch real reviews & mentor details from backend
  useEffect(() => {
    if (!mentorId) return;
    apiClient.getMentorReviews(mentorId).then((res) => {
      setBackendReviews(res.data ?? []);
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
            ? data.skills.map((s: any) => typeof s === "string" ? { name: s } : s)
            : [],
          availability: Array.isArray(data.availability) && data.availability.length > 0
            ? data.availability.map((a: any) => typeof a === "string" ? { day: a, label: a } : a)
            : [
                { day: "Flexible", label: "By appointment" },
                { day: "Availability", label: "Check calendar for open slots" },
              ],
        });
      }
    }).catch(() => {});
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
      availability: [
        { day: "Flexible", label: "By appointment" },
        { day: "Availability", label: "Check calendar for open slots" },
      ],
    };
  }, [mentorId, users, apiMentor]);

  const mentorReviews = backendReviews;
  const exemplar = mentorReviews.length ? mentorReviews[0] : null;

  const handleSubmitReview = async () => {
    if (!currentUser || !reviewComment.trim() || reviewRating < 1) {
      setMessage("Please add a rating and comment before submitting.");
      return;
    }
    try {
      const res = await apiClient.submitReview({
        session_id: 0, // no specific session context from this page
        mentor_id: mentorId,
        rating: reviewRating,
        review_text: reviewComment.trim(),
      });
      setBackendReviews((prev) => [res.data, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      setMessage("Review submitted successfully.");
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? "Failed to submit review.");
    }
  };

  const handleRequestSession = () => {
    if (!currentUser) {
      setMessage("Please log in to request a session.");
      return;
    }
    if (!mentor) {
      setMessage("Mentor not found.");
      return;
    }

    addBooking({
      title: `Session request with ${mentor.name}`,
      skill: mentor.skills[0]?.name ?? "Session",
      mentor: mentor.name,
      mentorId: mentor.id,
      date: new Date().toISOString().slice(0, 10),
      time: "TBD",
      mode: sessionMode,
      note: `Requested via mentor profile.`,
    });

    // Also send a real chat message to the mentor
    apiClient.sendChatMessage({
      receiver_id: mentor.id,
      message: `Hi ${mentor.name}, I'd like to request a ${sessionMode.toLowerCase()} session with you.`,
    }).catch(() => {});

    setMessage("Request submitted — you can now message the mentor.");
  };

  const handleSendMessage = async () => {
    if (!currentUser) {
      setMessage("Please log in to send a message.");
      return;
    }
    if (!mentor) {
      setMessage("Mentor not found.");
      return;
    }
    if (!composeMessage.trim()) {
      setMessage("Type your message first.");
      return;
    }

    try {
      await apiClient.sendChatMessage({
        receiver_id: mentor.id,
        message: composeMessage.trim(),
      });
      setComposeMessage("");
      setMessage("Message sent.");
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? "Failed to send message.");
    }
  };

  const handleAddFavorite = async () => {
    if (!currentUser) {
      setMessage("Please log in to save favorites.");
      return;
    }
    if (!mentor) {
      setMessage("Mentor not found.");
      return;
    }
    
    setIsAddingFavorite(true);
    try {
      if (isFavorite) {
        // Call backend to remove favorite
        await mentorService.removeFromFavorites(mentor.id);
        removeFavoriteMentor(mentor.id);
        setMessage("Removed from favorites.");
      } else {
        // Call backend to add favorite
        await mentorService.addToFavorites(mentor.id);
        addFavoriteMentor(mentor.id);
        setMessage("Mentor added to favorites.");
      }
    } catch (error: any) {
      const errorMsg = error.message || "Failed to update favorites";
      setMessage(errorMsg);
      console.error("Error updating favorite:", error);
    } finally {
      setIsAddingFavorite(false);
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
        <div className="mb-6 flex items-center gap-3 text-sm text-cyan-300">
          <button className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-2" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></button>
          <Link href="/search" className="hover:text-white">Back to search</Link>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_0.8fr]">
            <div>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
                <div>
                  <div className="text-sm uppercase tracking-[0.28em] text-cyan-300">Mentor profile</div>
                  <h1 className="mt-2 text-4xl font-semibold text-white">{mentor.name}</h1>
                  <div className="mt-2 text-slate-400">{mentor.role} · {mentor.location}</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {mentor.skills.map((skill: any) => (
                  <span key={skill.name || skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">{skill.name || skill}</span>
                ))}
              </div>
              <div className="mt-6 text-slate-300">{mentor.bio}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Connect</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{mentor.rating}/5</div>
                </div>
                <div className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">{mentor.reviews} reviews</div>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-400">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Location: {mentor.location}</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Experience: {mentor.experience}</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Price: {mentor.price}</div>
              </div>
              <div className="mt-6 space-y-3">
                <button className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" onClick={handleAddFavorite} disabled={isAddingFavorite}>
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-white" : ""}`} /> {isAddingFavorite ? "Updating..." : isFavorite ? "Remove from favorites" : "Add to favorites"}
                </button>
                <button className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white" onClick={handleRequestSession}>
                  <MessageSquare className="h-4 w-4 text-cyan-300" /> Request session
                </button>
              </div>
              <div className="mt-6 space-y-3">
                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block text-slate-400">Send a message</span>
                  <textarea
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    rows={3}
                    value={composeMessage}
                    onChange={(event) => setComposeMessage(event.target.value)}
                    placeholder="Write a message to the mentor"
                  />
                </label>
                <button className="w-full rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200" onClick={handleSendMessage}>
                  Send message
                </button>
              </div>
              <div className="mt-4 text-sm text-slate-400">Choose mode:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["Online", "In-person", "Hybrid"] as const).map((option) => (
                  <button key={option} className={`rounded-full border px-3 py-2 text-sm ${sessionMode === option ? "border-cyan-400 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-300"}`} onClick={() => setSessionMode(option)}>{option}</button>
                ))}
              </div>
              {message ? <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">{message}</div> : null}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Availability</h2>
            <div className="text-sm text-slate-400">Select a day and time to book</div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {mentor.availability.map((slot: any) => (
              <div key={slot.label || slot.day || slot} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold text-white">{slot.day || slot}</div>
                <div className="mt-1 text-sm text-slate-400">{slot.label || slot.day || slot}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Reviews</h2>
              <span className="text-sm text-slate-400">{mentorReviews.length} total reviews</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Star className="h-4 w-4 text-cyan-300" /> Submit your own review
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_0.8fr]">
            <div className="space-y-4">
              {mentorReviews.length ? mentorReviews.map((review) => (
                <div key={review.review_id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-cyan-300" />
                    <div className="font-semibold text-white">{review.rating}/5</div>
                  </div>
                  <div className="mt-3 text-slate-300">{review.review_text ?? ""}</div>
                </div>
              )) : <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">No reviews yet.</div>}
              {exemplar ? <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-200">Featured review: "{exemplar.review_text}"</div> : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
              <h3 className="text-lg font-semibold text-white">Leave feedback</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <label className="space-y-2">
                  <span className="text-slate-400">Rating</span>
                  <select className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none" value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating} stars</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-slate-400">Comment</span>
                  <textarea className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none" rows={5} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Share your experience or what you’d like to learn." />
                </label>
                <button className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white" onClick={handleSubmitReview}>Submit review</button>
                {message ? <div className="text-sm text-emerald-300">{message}</div> : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
