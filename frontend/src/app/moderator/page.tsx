"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";

interface AdminReport {
  report_id: number;
  reported_by: number;
  reported_user: number;
  reason: string;
  status: string;
  created_at: string;
}

export default function ModeratorPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await apiClient.getAdminReports({ status: "Pending" });
        setReports(res.data ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const flash = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const handleEscalate = async (reportId: number) => {
    // Moderators can resolve (escalate to resolved) or dismiss
    try {
      await apiClient.resolveReport(reportId, { description: "Escalated by moderator" });
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: "Resolved" } : r))
      );
      flash("Report escalated and resolved.");
    } catch (err: any) {
      flash(err?.response?.data?.message ?? "Action failed.");
    }
  };

  const handleDismiss = async (reportId: number) => {
    try {
      await apiClient.dismissReport(reportId);
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: "Dismissed" } : r))
      );
      flash("Report dismissed.");
    } catch (err: any) {
      flash(err?.response?.data?.message ?? "Action failed.");
    }
  };

  return (
    <RoleGuard roles={["moderator", "admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Moderator workspace</h1>
            <p className="mt-3 text-slate-400">Review reports and ensure the platform remains healthy.</p>
          </section>

          {actionMsg ? (
            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
              {actionMsg}
            </div>
          ) : null}

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Open reports</h2>
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                  Loading reports…
                </div>
              ) : reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-4 text-sm text-slate-400">
                  No open reports. The platform is clean!
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.report_id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">Report #{report.report_id}</div>
                    <div className="mt-1 text-sm text-slate-400">Reason: {report.reason}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Status: {report.status} · {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    {report.status === "Pending" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200"
                          onClick={() => handleEscalate(report.report_id)}
                        >
                          Escalate
                        </button>
                        <button
                          className="rounded-full border border-slate-400/20 bg-slate-800/70 px-3 py-2 text-sm text-slate-200"
                          onClick={() => handleDismiss(report.report_id)}
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SiteShell>
    </RoleGuard>
  );
}
