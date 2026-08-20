"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function ModeratorPage() {
  const reports = useAppStore((state) => state.reports);
  const updateReport = useAppStore((state) => state.updateReport);
  const announcements = useAppStore((state) => state.announcements);
  const addAnnouncement = useAppStore((state) => state.addAnnouncement);

  return (
    <RoleGuard roles={["moderator", "admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Moderator workspace</h1>
            <p className="mt-3 text-slate-400">Review reports, publish community updates, and ensure the platform remains healthy.</p>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Community updates</h2>
              <div className="mt-4 space-y-3">
                <input id="mod-title" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Title" />
                <textarea id="mod-content" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Message" />
                <button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => {
                  const title = (document.getElementById("mod-title") as HTMLInputElement)?.value ?? "";
                  const content = (document.getElementById("mod-content") as HTMLTextAreaElement)?.value ?? "";
                  if (title && content) {
                    addAnnouncement({ title, content, priority: "Medium" });
                    (document.getElementById("mod-title") as HTMLInputElement).value = "";
                    (document.getElementById("mod-content") as HTMLTextAreaElement).value = "";
                  }
                }}>Publish</button>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-xl font-semibold text-white">Open reports</h2>
              <div className="mt-4 space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">{report.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{report.details}</div>
                    <button className="mt-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200" onClick={() => updateReport(report.id, { status: "Escalated" })}>Escalate</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Recent announcements</h2>
            <div className="mt-4 space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <div className="font-semibold text-white">{announcement.title}</div>
                  <div>{announcement.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SiteShell>
    </RoleGuard>
  );
}
