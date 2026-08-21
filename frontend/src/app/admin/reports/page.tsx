"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function AdminReportsPage() {
  const reports = useAppStore((state) => state.reports);

  return (
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Report center</h1>
            <p className="mt-3 text-slate-400">Review flagged content, resolve issues, and keep the platform safe.</p>
          </section>

          <div className="mt-8 space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">{report.title}</div>
                    <div className="text-sm text-slate-400">{report.reason}</div>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">{report.status}</span>
                </div>
                <div className="mt-4 text-sm text-slate-300">{report.details}</div>
                <div className="mt-4 text-sm text-slate-500">Reported by: {report.reporterId}</div>
              </div>
            ))}
          </div>
        </div>
      </SiteShell>
    </RoleGuard>
  );
}
