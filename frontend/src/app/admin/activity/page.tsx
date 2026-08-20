"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function AdminActivityPage() {
  const announcements = useAppStore((state) => state.announcements);
  const mentorSessions = useAppStore((state) => state.mentorSessions);
  const bookings = useAppStore((state) => state.bookings);

  return (
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Platform activity</h1>
            <p className="mt-3 text-slate-400">Monitor latest announcements, sessions, and booking activity across the community.</p>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Announcements</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {announcements.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-slate-400">{item.priority}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Mentor sessions</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {mentorSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="font-semibold text-white">{session.title}</div>
                    <div className="mt-1 text-slate-400">{session.status}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Bookings</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="font-semibold text-white">{booking.title}</div>
                    <div className="mt-1 text-slate-400">{booking.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SiteShell>
    </RoleGuard>
  );
}
