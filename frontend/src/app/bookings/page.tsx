"use client";

import { useMemo, useState } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";
import { mentors } from "@/lib/mock-data";

export default function BookingsPage() {
  const bookings = useAppStore((state) => state.bookings);
  const currentUser = useAppStore((state) => state.currentUser);
  const addBooking = useAppStore((state) => state.addBooking);
  const updateBooking = useAppStore((state) => state.updateBooking);
  const [mentorId, setMentorId] = useState(mentors[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [skill, setSkill] = useState(mentors[0]?.skills[0]?.name ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<"Online" | "In-person" | "Hybrid">("Online");
  const [note, setNote] = useState("");

  const selectedMentor = useMemo(() => mentors.find((mentor) => mentor.id === mentorId) ?? mentors[0], [mentorId]);
  const userBookings = useMemo(() => bookings.filter((booking) => booking.userId === currentUser?.id), [bookings, currentUser]);
  const grouped = useMemo(() => ({
    pending: userBookings.filter((booking) => booking.status === "Pending"),
    confirmed: userBookings.filter((booking) => booking.status === "Confirmed"),
    completed: userBookings.filter((booking) => booking.status === "Completed"),
    cancelled: userBookings.filter((booking) => booking.status === "Cancelled" || booking.status === "Rejected"),
  }), [userBookings]);

  const handleCreateBooking = () => {
    if (!currentUser || !title || !skill || !date || !time || !selectedMentor) return;
    addBooking({
      title,
      skill,
      mentor: selectedMentor.name,
      mentorId: selectedMentor.id,
      date,
      time,
      mode,
      note,
    });
    setTitle("");
    setDate("");
    setTime("");
    setNote("");
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-white">Bookings</h1>
          <p className="mt-3 text-slate-400">Request sessions, manage pending requests, and track your upcoming learning schedule.</p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Request a session</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" placeholder="Session title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={mentorId} onChange={(event) => setMentorId(event.target.value)}>
                  {mentors.map((mentor) => (<option key={mentor.id} value={mentor.id}>{mentor.name}</option>))}
                </select>
                <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={skill} onChange={(event) => setSkill(event.target.value)}>
                  {(selectedMentor.skills ?? []).map((skillEntry) => (<option key={skillEntry.name} value={skillEntry.name}>{skillEntry.name}</option>))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="date" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={date} onChange={(event) => setDate(event.target.value)} />
                <input type="time" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={time} onChange={(event) => setTime(event.target.value)} />
              </div>
              <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={mode} onChange={(event) => setMode(event.target.value as "Online" | "In-person" | "Hybrid") }>
                <option value="Online">Online</option>
                <option value="In-person">In-person</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <textarea className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" rows={4} placeholder="Add learner message or session notes" value={note} onChange={(event) => setNote(event.target.value)} />
              <button className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white" onClick={handleCreateBooking}>Confirm booking request</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Session summary</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold text-white">Selected mentor</div>
                <div className="mt-1 text-slate-400">{selectedMentor.name}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold text-white">Proposed mode</div>
                <div className="mt-1 text-slate-400">{mode}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {([
            ["Pending", grouped.pending],
            ["Confirmed", grouped.confirmed],
            ["Completed", grouped.completed],
            ["Cancelled", grouped.cancelled],
          ] as const).map(([label, list]) => (
            <div key={label} className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h3 className="text-lg font-semibold text-white">{label} sessions</h3>
              <div className="mt-4 space-y-3">
                {list.length ? list.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">{booking.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{booking.mentor} · {booking.date} {booking.time}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-200">{booking.status}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {booking.status === "Pending" && (
                        <button className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300" onClick={() => updateBooking(booking.id, { status: "Confirmed" })}>Confirm</button>
                      )}
                      {booking.status !== "Cancelled" && booking.status !== "Rejected" && (
                        <button className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => updateBooking(booking.id, { status: "Cancelled" })}>Cancel</button>
                      )}
                    </div>
                  </div>
                )) : <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">No {label.toLowerCase()} sessions yet.</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
