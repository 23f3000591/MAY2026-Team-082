"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Trophy, Users } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { mentors } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const learningRequests = useAppStore((state) => state.learningRequests);
  const mentorSessions = useAppStore((state) => state.mentorSessions);
  const announcements = useAppStore((state) => state.announcements);
  const reports = useAppStore((state) => state.reports);
  const users = useAppStore((state) => state.users);
  const bookings = useAppStore((state) => state.bookings);

  const role = currentUser?.role ?? "learner";
  const roleTitle = {
    learner: "Learner dashboard",
    mentor: "Mentor dashboard",
    manager: "Manager dashboard",
    admin: "Admin control center",
    moderator: "Moderator workspace",
  }[role] ?? "Learner dashboard";

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">{roleTitle}</p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Welcome back, {currentUser?.name ?? "guest"}.</h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-400">Manage your community activity, requests, sessions, and oversight tools from one polished workspace.</p>
            </div>
            <Link href="/search" className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200">
              Discover mentors <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Upcoming sessions</h2>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">{mentorSessions.length} active</span>
            </div>
            <div className="space-y-3">
              {mentorSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <div className="font-semibold text-white">{session.title}</div>
                    <div className="text-sm text-slate-400">{session.description}</div>
                  </div>
                  <div className="text-sm text-cyan-200">{session.date} · {session.duration}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2 text-cyan-200"><Trophy className="h-5 w-5" /> <h2 className="text-xl font-semibold text-white">Learning progress</h2></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                  <span>Skill mastery</span>
                  <span>{role === "admin" ? "94%" : role === "mentor" ? "88%" : "82%"}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800"><div className="h-2 w-[82%] rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" /></div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2 text-cyan-200"><Users className="h-5 w-5" /> <h2 className="text-xl font-semibold text-white">Recent mentors</h2></div>
              <div className="space-y-3">
                {mentors.slice(0, 2).map((mentor) => (
                  <div key={mentor.name} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">{mentor.name}</div>
                    <div>{mentor.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Community activity</h2>
            <div className="flex items-center gap-2 text-sm text-cyan-200"><BookOpen className="h-4 w-4" /> {announcements.length} updates</div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="font-semibold text-white">{announcement.title}</div>
                <div className="mt-2 text-sm text-slate-400">{announcement.content}</div>
                <div className="mt-4 text-sm text-cyan-200">{announcement.priority} priority</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Learning requests</h2>
            <div className="mt-4 space-y-3">
              {learningRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <div className="font-semibold text-white">{request.title}</div>
                  <div>{request.skill} · {request.goal}</div>
                  <div className="mt-2 text-cyan-200">{request.priority} priority</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Platform summary</h2>
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

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Pending approvals</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                <span>Session approvals</span><span className="text-cyan-200">{mentorSessions.filter((session) => session.status === "Pending").length}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                <span>Booking approvals</span><span className="text-cyan-200">{bookings.filter((booking) => booking.status === "Pending").length}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                <span>Open reports</span><span className="text-cyan-200">{reports.filter((report) => report.status === "Open").length}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
