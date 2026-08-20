"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function MentorPage() {
  const mentorSessions = useAppStore((state) => state.mentorSessions);
  const addMentorSession = useAppStore((state) => state.addMentorSession);
  const deleteMentorSession = useAppStore((state) => state.deleteMentorSession);

  return (
    <RoleGuard roles={["mentor", "admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Mentor workspace</h1>
            <p className="mt-3 text-slate-400">Create sessions, manage availability, and keep learners engaged with your expertise.</p>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Create session</h2>
              <div className="mt-4 space-y-3">
                <input id="mentor-title" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Session title" />
                <textarea id="mentor-desc" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Description" />
                <input id="mentor-date" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Date" />
                <button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => {
                  const title = (document.getElementById("mentor-title") as HTMLInputElement)?.value ?? "";
                  const description = (document.getElementById("mentor-desc") as HTMLTextAreaElement)?.value ?? "";
                  const date = (document.getElementById("mentor-date") as HTMLInputElement)?.value ?? "";
                  if (title && description && date) {
                    addMentorSession({ title, description, date, duration: "60 min", price: "$45" });
                    (document.getElementById("mentor-title") as HTMLInputElement).value = "";
                    (document.getElementById("mentor-desc") as HTMLTextAreaElement).value = "";
                    (document.getElementById("mentor-date") as HTMLInputElement).value = "";
                  }
                }}>Add session</button>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Your sessions</h2>
              <div className="mt-4 space-y-3">
                {mentorSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">{session.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{session.date} · {session.duration}</div>
                    <button className="mt-3 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => deleteMentorSession(session.id)}>Delete</button>
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
