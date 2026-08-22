"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Filter,
  MessageSquare,
  ShieldCheck,
  X
} from "lucide-react";

interface AdminReport {
  report_id: number;
  reported_by: number;
  reported_by_name?: string;
  reported_user: number;
  reported_user_name?: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: number;
  resolved_by_name?: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeReport, setActiveReport] = useState<AdminReport | null>(null);
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | null>(null);
  const [adminRemark, setAdminRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchReports = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
      const res = await apiClient.getAdminReports(params);
      if (res && res.data) {
        setReports(res.data);
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.response?.data?.message || "Failed to load moderation reports.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const flash = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenActionModal = (report: AdminReport, type: "resolve" | "dismiss") => {
    setActiveReport(report);
    setActionType(type);
    setAdminRemark("");
  };

  const handleConfirmAction = async () => {
    if (!activeReport || !actionType) return;
    setSubmitting(true);

    try {
      if (actionType === "resolve") {
        await apiClient.resolveReport(activeReport.report_id, {
          description: adminRemark.trim() || undefined,
        });
        setReports((prev) =>
          prev.map((r) =>
            r.report_id === activeReport.report_id
              ? { ...r, status: "Resolved", description: adminRemark.trim() || r.description }
              : r
          )
        );
        flash(`Report #${activeReport.report_id} has been marked as Resolved.`);
      } else {
        await apiClient.dismissReport(activeReport.report_id, {
          description: adminRemark.trim() || undefined,
        });
        setReports((prev) =>
          prev.map((r) =>
            r.report_id === activeReport.report_id
              ? { ...r, status: "Dismissed", description: adminRemark.trim() || r.description }
              : r
          )
        );
        flash(`Report #${activeReport.report_id} has been dismissed.`);
      }
      setActiveReport(null);
      setActionType(null);
    } catch (err: any) {
      flash(err?.response?.data?.message || "Failed to process report action.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          {/* Header */}
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Moderation & Trust Center</p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Platform Reports</h1>
                <p className="mt-3 text-slate-400">
                  Investigate flagged reviews, inappropriate interactions, and take administrative disciplinary actions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchReports(true)}
                  disabled={refreshing || loading}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-6">
              {[
                { id: "all", label: "All Reports" },
                { id: "Pending", label: "Pending Review" },
                { id: "Resolved", label: "Resolved" },
                { id: "Dismissed", label: "Dismissed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === tab.id
                      ? "border border-cyan-400/30 bg-cyan-400/20 text-cyan-200"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {/* Feedback */}
          {feedback && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                  : "border-rose-400/20 bg-rose-500/10 text-rose-200"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Reports Content List */}
          <div className="mt-8 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-slate-900/70 p-16 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
                <p className="mt-3 text-sm text-slate-400">Loading moderation records...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-slate-900/40 p-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400/60" />
                <h3 className="mt-3 text-base font-semibold text-white">No Reports Found</h3>
                <p className="mt-1 text-xs text-slate-400">There are no reports matching status &ldquo;{statusFilter}&rdquo;.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.report_id}
                  className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-xl backdrop-blur-xl transition hover:border-white/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-amber-300">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-white">Report #{report.report_id}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                              report.status === "Resolved"
                                ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-300"
                                : report.status === "Dismissed"
                                ? "bg-slate-800/80 border-slate-700 text-slate-300"
                                : "bg-amber-400/10 border-amber-400/20 text-amber-300"
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-cyan-200">Reason: {report.reason}</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      Logged: {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Metadata with Names */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-2xl bg-slate-950/60 p-4 text-xs text-slate-200 border border-white/5">
                    <div>
                      <span className="text-slate-400 font-medium">Reported User:</span>{" "}
                      <span className="text-white font-semibold">
                        {report.reported_user_name ? `${report.reported_user_name} (#${report.reported_user})` : `#${report.reported_user}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Reported By:</span>{" "}
                      <span className="text-white font-semibold">
                        {report.reported_by_name ? `${report.reported_by_name} (#${report.reported_by})` : `#${report.reported_by}`}
                      </span>
                    </div>
                    {report.resolved_by && (
                      <div>
                        <span className="text-slate-400 font-medium">Resolved By Admin:</span>{" "}
                        <span className="text-cyan-200 font-semibold">
                          {report.resolved_by_name ? `${report.resolved_by_name} (#${report.resolved_by})` : `#${report.resolved_by}`}
                        </span>
                      </div>
                    )}
                    {report.resolved_at && (
                      <div>
                        <span className="text-slate-400 font-medium">Resolved Date:</span>{" "}
                        <span className="text-slate-300">{new Date(report.resolved_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {report.description && (
                    <div className="mt-4 rounded-2xl bg-white/5 p-4 text-xs text-slate-200 border border-white/5">
                      <div className="font-semibold uppercase tracking-wider text-cyan-300 mb-1">Details & Remarks</div>
                      <p className="text-slate-300 text-sm">{report.description}</p>
                    </div>
                  )}

                  {report.status === "Pending" && (
                    <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-white/10 pt-4">
                      <button
                        onClick={() => handleOpenActionModal(report, "dismiss")}
                        className="flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                      >
                        <XCircle className="h-4 w-4 text-slate-400" /> Dismiss
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(report, "resolve")}
                        className="flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 transition"
                      >
                        <CheckCircle2 className="h-4 w-4 text-cyan-300" /> Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Action Confirmation Modal */}
          {activeReport && actionType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                        actionType === "resolve"
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                          : "border-slate-700 bg-slate-800 text-slate-300"
                      }`}
                    >
                      {actionType === "resolve" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {actionType === "resolve" ? "Resolve Report" : "Dismiss Report"} #{activeReport.report_id}
                      </h3>
                      <p className="text-xs text-slate-400">{activeReport.reason}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveReport(null);
                      setActionType(null);
                    }}
                    className="rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Admin Remarks / Resolution Note
                  </label>
                  <textarea
                    rows={3}
                    value={adminRemark}
                    onChange={(e) => setAdminRemark(e.target.value)}
                    placeholder="Enter context, findings, or reasons for this action..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReport(null);
                      setActionType(null);
                    }}
                    className="rounded-full bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleConfirmAction}
                    className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                      actionType === "resolve"
                        ? "border border-cyan-400/30 bg-cyan-500 text-white hover:bg-cyan-400"
                        : "border border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
                    }`}
                  >
                    {submitting ? "Processing..." : `Confirm ${actionType === "resolve" ? "Resolution" : "Dismissal"}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SiteShell>
    </RoleGuard>
  );
}

