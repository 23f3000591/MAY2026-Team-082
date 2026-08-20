"use client";

import { useMemo, useState } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AvailabilityPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const availability = useAppStore((state) => state.availability);
  const addAvailability = useAppStore((state) => state.addAvailability);
  const deleteAvailability = useAppStore((state) => state.deleteAvailability);
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");

  const myAvailability = useMemo(() => availability.filter((slot) => slot.mentorId === currentUser?.id), [availability, currentUser]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-white">Availability</h1>
          <p className="mt-3 text-slate-400">Create and manage mentor availability slots for learners to book.</p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Add availability</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="mb-2 block text-slate-400">Day of week</label>
                <select value={day} onChange={(event) => setDay(event.target.value)} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white outline-none">
                  {days.map((currentDay) => (<option key={currentDay} value={currentDay}>{currentDay}</option>))}
                </select>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="mb-2 block text-slate-400">Start time</label>
                <input value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="mb-2 block text-slate-400">End time</label>
                <input value={endTime} onChange={(event) => setEndTime(event.target.value)} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white outline-none" />
              </div>
              <button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white" onClick={() => {
                if (!currentUser) return;
                addAvailability({ mentorId: currentUser.id, day, startTime, endTime });
              }}>
                Add availability
              </button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">My availability</h2>
            <div className="mt-4 space-y-3">
              {myAvailability.length ? myAvailability.map((slot) => (
                <div key={slot.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">{slot.day}</div>
                      <div className="text-sm text-slate-400">{slot.startTime} – {slot.endTime}</div>
                    </div>
                    <button className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => deleteAvailability(slot.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-300">No availability slots yet. Add slots to show learners when you’re free.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
