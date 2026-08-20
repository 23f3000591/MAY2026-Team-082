"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function LearnerPage() {
  const learningRequests = useAppStore((state) => state.learningRequests);
  const addLearningRequest = useAppStore((state) => state.addLearningRequest);
  const deleteLearningRequest = useAppStore((state) => state.deleteLearningRequest);

  return (
    <RoleGuard roles={["learner", "admin", "mentor"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Learner workspace</h1>
            <p className="mt-3 text-slate-400">Submit learning goals, track your requests, and stay in sync with mentors.</p>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Create learning request</h2>
              <div className="mt-4 space-y-3">
                <input id="request-title" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Request title" />
                <input id="request-skill" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Skill" />
                <textarea id="request-goal" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Goal" />
                <button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => {
                  const title = (document.getElementById("request-title") as HTMLInputElement)?.value ?? "";
                  const skill = (document.getElementById("request-skill") as HTMLInputElement)?.value ?? "";
                  const goal = (document.getElementById("request-goal") as HTMLTextAreaElement)?.value ?? "";
                  if (title && skill && goal) {
                    addLearningRequest({ title, skill, goal, priority: "Medium" });
                    (document.getElementById("request-title") as HTMLInputElement).value = "";
                    (document.getElementById("request-skill") as HTMLInputElement).value = "";
                    (document.getElementById("request-goal") as HTMLTextAreaElement).value = "";
                  }
                }}>Submit request</button>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Your requests</h2>
              <div className="mt-4 space-y-3">
                {learningRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">{request.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{request.skill}</div>
                    <div className="mt-2 text-sm text-cyan-200">{request.priority}</div>
                    <button className="mt-3 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => deleteLearningRequest(request.id)}>Delete</button>
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
