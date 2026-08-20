"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function AdminPage() {
  const announcements = useAppStore((state) => state.announcements);
  const reports = useAppStore((state) => state.reports);
  const users = useAppStore((state) => state.users);
  const mentorSessions = useAppStore((state) => state.mentorSessions);
  const bookings = useAppStore((state) => state.bookings);
  const addAnnouncement = useAppStore((state) => state.addAnnouncement);
  const addMentorSession = useAppStore((state) => state.addMentorSession);
  const updateReport = useAppStore((state) => state.updateReport);
  const updateMentorSession = useAppStore((state) => state.updateMentorSession);
  const deleteMentorSession = useAppStore((state) => state.deleteMentorSession);
  const updateBooking = useAppStore((state) => state.updateBooking);
  const deleteBooking = useAppStore((state) => state.deleteBooking);

  return (
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Admin control center</h1>
            <p className="mt-3 text-slate-400">Approve activity, manage announcements, and review reports in one place.</p>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Publish announcement</h2>
              <div className="mt-4 space-y-3">
                <input id="admin-title" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Announcement title" />
                <textarea id="admin-content" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Content" />
                <button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => {
                  const title = (document.getElementById("admin-title") as HTMLInputElement)?.value ?? "";
                  const content = (document.getElementById("admin-content") as HTMLTextAreaElement)?.value ?? "";
                  if (title && content) {
                    addAnnouncement({ title, content, priority: "High" });
                    (document.getElementById("admin-title") as HTMLInputElement).value = "";
                    (document.getElementById("admin-content") as HTMLTextAreaElement).value = "";
                  }
                }}>Create announcement</button>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Create session</h2>
              <div className="mt-4 space-y-3">
                <input id="admin-session-title" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Session title" />
                <textarea id="admin-session-desc" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Description" />
                <input id="admin-session-date" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Date" />
                <button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => {
                  const title = (document.getElementById("admin-session-title") as HTMLInputElement)?.value ?? "";
                  const description = (document.getElementById("admin-session-desc") as HTMLTextAreaElement)?.value ?? "";
                  const date = (document.getElementById("admin-session-date") as HTMLInputElement)?.value ?? "";
                  if (title && description && date) {
                    addMentorSession({ title, description, date, duration: "60 min", price: "$0" });
                    (document.getElementById("admin-session-title") as HTMLInputElement).value = "";
                    (document.getElementById("admin-session-desc") as HTMLTextAreaElement).value = "";
                    (document.getElementById("admin-session-date") as HTMLInputElement).value = "";
                  }
                }}>Add session</button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white">System reports</h2>
            <div className="mt-4 space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-white">{report.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{report.details}</div>
                  <button className="mt-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200" onClick={() => updateReport(report.id, { status: "Resolved" })}>Resolve</button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Mentor sessions</h2>
              <div className="mt-4 space-y-3">
                {mentorSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">{session.title}</div>
                    <div className="mt-1 text-slate-400">{session.date} · {session.duration}</div>
                    <div className="mt-2 text-cyan-200">Status: {session.status}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300" onClick={() => updateMentorSession(session.id, { status: "Approved" })}>Approve</button>
                      <button className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => updateMentorSession(session.id, { status: "Rejected" })}>Reject</button>
                      <button className="rounded-full border border-slate-400/20 bg-slate-800/70 px-3 py-2 text-sm text-slate-200" onClick={() => deleteMentorSession(session.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Session bookings</h2>
              <div className="mt-4 space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">{booking.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{booking.mentor} · {booking.date} {booking.time}</div>
                    <div className="mt-2 text-cyan-200">Status: {booking.status}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300" onClick={() => updateBooking(booking.id, { status: "Confirmed" })}>Confirm</button>
                      <button className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => updateBooking(booking.id, { status: "Rejected" })}>Reject</button>
                      <button className="rounded-full border border-slate-400/20 bg-slate-800/70 px-3 py-2 text-sm text-slate-200" onClick={() => deleteBooking(booking.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Platform totals</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <span>Total users</span><span className="text-cyan-200">{users.length}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <span>Total learners</span><span className="text-cyan-200">{users.filter((user) => user.role === "learner").length}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <span>Total mentors</span><span className="text-cyan-200">{users.filter((user) => user.role === "mentor").length}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <span>Total managers</span><span className="text-cyan-200">{users.filter((user) => user.role === "manager").length}</span>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Registered accounts</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {users.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">{user.name}</div>
                    <div>{user.email}</div>
                    <div className="mt-2 text-cyan-200">{user.role}</div>
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
