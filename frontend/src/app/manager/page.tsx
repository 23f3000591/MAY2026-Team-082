"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function ManagerPage() {
  const mentorSessions = useAppStore((state) => state.mentorSessions);
  const bookings = useAppStore((state) => state.bookings);
  const reports = useAppStore((state) => state.reports);
  const users = useAppStore((state) => state.users);
  const updateMentorSession = useAppStore((state) => state.updateMentorSession);
  const updateBooking = useAppStore((state) => state.updateBooking);

  return (
    <RoleGuard roles={["manager", "admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Manager workspace</h1>
            <p className="mt-3 text-slate-400">Review session and booking approvals, monitor community activity, and support learners and mentors.</p>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Pending mentor sessions</h2>
              <div className="mt-4 space-y-3">
                {mentorSessions.filter((session) => session.status === "Pending").map((session) => (
                  <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">{session.title}</div>
                    <div className="mt-1 text-slate-400">{session.date} · {session.duration}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300" onClick={() => updateMentorSession(session.id, { status: "Approved" })}>Approve</button>
                      <button className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => updateMentorSession(session.id, { status: "Rejected" })}>Reject</button>
                    </div>
                  </div>
                ))}
                {mentorSessions.filter((session) => session.status === "Pending").length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No pending mentor sessions at the moment.</div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Pending bookings</h2>
              <div className="mt-4 space-y-3">
                {bookings.filter((booking) => booking.status === "Pending").map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">{booking.title}</div>
                    <div className="mt-1 text-slate-400">{booking.mentor} · {booking.date} {booking.time}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300" onClick={() => updateBooking(booking.id, { status: "Confirmed" })}>Confirm</button>
                      <button className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => updateBooking(booking.id, { status: "Rejected" })}>Reject</button>
                    </div>
                  </div>
                ))}
                {bookings.filter((booking) => booking.status === "Pending").length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No pending bookings right now.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Platform totals</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <span>Total learners</span><span className="text-cyan-200">{users.filter((user) => user.role === "learner").length}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <span>Total mentors</span><span className="text-cyan-200">{users.filter((user) => user.role === "mentor").length}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <span>Total requests</span><span className="text-cyan-200">{mentorSessions.length}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Open reports</h2>
              <div className="mt-4 space-y-3">
                {reports.filter((report) => report.status === "Open").map((report) => (
                  <div key={report.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">{report.title}</div>
                    <div className="mt-1 text-slate-400">{report.details}</div>
                    <div className="mt-2 text-cyan-200">Status: {report.status}</div>
                  </div>
                ))}
                {reports.filter((report) => report.status === "Open").length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No open reports currently.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SiteShell>
    </RoleGuard>
  );
}
