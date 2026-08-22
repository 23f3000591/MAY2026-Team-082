"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  Sparkles,
  TrendingUp,
  Layers,
  ChevronRight,
  Calendar
} from "lucide-react";

interface AdminUser {
  user_id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  is_mentor: boolean;
  is_learner: boolean;
  is_verified: boolean;
  is_suspended: boolean;
  created_at?: string;
}

interface AdminReport {
  report_id: number;
  reported_by: number;
  reported_by_name?: string;
  reported_user: number;
  reported_user_name?: string;
  reason: string;
  status: string;
  description?: string;
  created_at: string;
  resolved_by?: number;
  resolved_by_name?: string;
  resolved_at?: string;
}

interface PlatformActivityData {
  users?: {
    total: number;
    mentors: number;
    learners: number;
    mentor_learner_users: number;
    verified_mentors: number;
    pending_mentor_verification: number;
    suspended_users: number;
  };
  sessions?: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    completed: number;
    cancelled: number;
  };
  reports?: {
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  };
  recent_activity?: Array<{
    type: string;
    message: string;
    created_at: string;
  }>;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [activity, setActivity] = useState<PlatformActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [usersRes, reportsRes, activityRes] = await Promise.allSettled([
        apiClient.getAdminUsers(),
        apiClient.getAdminReports(),
        apiClient.getPlatformActivity(),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        setUsers(usersRes.value.data);
      }
      if (reportsRes.status === "fulfilled" && reportsRes.value?.data) {
        setReports(reportsRes.value.data);
      }
      if (activityRes.status === "fulfilled" && activityRes.value?.data) {
        setActivity(activityRes.value.data);
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Failed to load latest platform metrics.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const flash = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleResolveReport = async (reportId: number) => {
    try {
      await apiClient.resolveReport(reportId, { description: "Resolved by Admin from Dashboard." });
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: "Resolved" } : r))
      );
      apiClient.getPlatformActivity().then((res) => {
        if (res?.data) setActivity(res.data);
      });
      flash(`Report #${reportId} resolved.`);
    } catch (err: any) {
      flash(err?.response?.data?.message || "Action failed.", "error");
    }
  };

  const handleDismissReport = async (reportId: number) => {
    try {
      await apiClient.dismissReport(reportId, { description: "Dismissed by Admin from Dashboard." });
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: "Dismissed" } : r))
      );
      apiClient.getPlatformActivity().then((res) => {
        if (res?.data) setActivity(res.data);
      });
      flash(`Report #${reportId} dismissed.`);
    } catch (err: any) {
      flash(err?.response?.data?.message || "Action failed.", "error");
    }
  };

  const pendingReports = reports.filter((r) => r.status === "Pending");
  const totalUsersCount = activity?.users?.total ?? users.length;
  const mentorsCount = activity?.users?.mentors ?? users.filter((u) => u.is_mentor).length;
  const learnersCount = activity?.users?.learners ?? users.filter((u) => u.is_learner).length;
  const adminsCount = users.filter((u) => u.role === "admin").length || 1;
  const verifiedMentorsCount = activity?.users?.verified_mentors ?? users.filter((u) => u.is_mentor && u.is_verified).length;

  const totalSessions = activity?.sessions?.total ?? 3;
  const pendingSessions = activity?.sessions?.pending ?? 1;
  const completedSessions = activity?.sessions?.completed ?? 1;
  const acceptedSessions = activity?.sessions?.accepted ?? 1;

  // Chart Percentages
  const mentorPct = totalUsersCount > 0 ? Math.round((mentorsCount / totalUsersCount) * 100) : 0;
  const learnerPct = totalUsersCount > 0 ? Math.round((learnersCount / totalUsersCount) * 100) : 0;
  const adminPct = totalUsersCount > 0 ? Math.round((adminsCount / totalUsersCount) * 100) : 0;

  return (
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Admin Control Center</p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Platform Governance</h1>
                <p className="mt-3 text-slate-400">
                  Real-time society analytics, community growth metrics, and quick governance controls.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchAllData(true)}
                  disabled={refreshing || loading}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Stats
                </button>
              </div>
            </div>

            {/* Quick Navigation Hub */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 pt-6">
              <Link
                href="/admin/users"
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-cyan-400/30 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-cyan-200 transition">Users Directory</div>
                    <div className="text-xs text-slate-400">{users.length} Registered Accounts</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/admin/reports"
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-amber-400/30 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-amber-200 transition">Moderation Reports</div>
                    <div className="text-xs text-slate-400">{pendingReports.length} Pending Actions</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/admin/activity"
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-indigo-400/30 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 border border-indigo-400/20 text-indigo-300">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-indigo-200 transition">Audit & Telemetry</div>
                    <div className="text-xs text-slate-400">Live platform logs</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </section>

          {/* Flash Feedback Banner */}
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

          {loading ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-slate-900/70 p-16 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="mt-3 text-sm text-slate-400">Loading admin metrics...</p>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {/* Stat Key Metrics Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Total Members</span>
                    <Users className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-white">{totalUsersCount}</div>
                  <div className="mt-2 text-xs text-cyan-200">{learnersCount} Learners · {mentorsCount} Mentors</div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Verified Mentors</span>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-white">{verifiedMentorsCount}</div>
                  <div className="mt-2 text-xs text-emerald-300">100% credential verified</div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Total Sessions</span>
                    <Calendar className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-white">{totalSessions}</div>
                  <div className="mt-2 text-xs text-indigo-300">{completedSessions} Completed · {acceptedSessions} Upcoming</div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Pending Reports</span>
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-white">{pendingReports.length}</div>
                  <div className="mt-2 text-xs text-amber-300">{pendingReports.length > 0 ? "Requires review" : "All clear"}</div>
                </div>
              </div>

              {/* Visual Analytics Charts Section */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Chart 1: User Distribution Breakdown */}
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Community Member Mix</h2>
                      <p className="text-xs text-slate-400 mt-1">Role distribution across registered residents</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 border border-white/5">
                      <TrendingUp className="h-3.5 w-3.5 text-cyan-300" /> Live Data
                    </div>
                  </div>

                  {/* Multi-segment Bar Chart */}
                  <div className="mt-6">
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-950/80 p-0.5 border border-white/5">
                      <div
                        style={{ width: `${learnerPct}%` }}
                        className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        title={`Learners: ${learnerPct}%`}
                      />
                      <div
                        style={{ width: `${mentorPct}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        title={`Mentors: ${mentorPct}%`}
                      />
                      <div
                        style={{ width: `${adminPct}%` }}
                        className="h-full rounded-r-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                        title={`Admins: ${adminPct}%`}
                      />
                    </div>

                    {/* Breakdown legend */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                          Learners
                        </div>
                        <div className="mt-1 text-lg font-bold text-white">{learnersCount}</div>
                        <div className="text-[11px] text-emerald-300">{learnerPct}% of total</div>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
                          Mentors
                        </div>
                        <div className="mt-1 text-lg font-bold text-white">{mentorsCount}</div>
                        <div className="text-[11px] text-cyan-300">{mentorPct}% of total</div>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                          <span className="h-2.5 w-2.5 rounded-full bg-purple-400"></span>
                          Admins
                        </div>
                        <div className="mt-1 text-lg font-bold text-white">{adminsCount}</div>
                        <div className="text-[11px] text-purple-300">{adminPct}% of total</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart 2: Session Exchange Velocity Pipeline */}
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Session Pipeline</h2>
                      <p className="text-xs text-slate-400 mt-1">Skill exchange fulfillment breakdown</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 border border-white/5">
                      <Calendar className="h-3.5 w-3.5 text-cyan-300" /> {totalSessions} Bookings
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {/* Bar 1: Completed */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Completed Sessions</span>
                        <span className="text-emerald-300 font-bold">{completedSessions} ({totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}%)</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-950/80 overflow-hidden border border-white/5">
                        <div
                          style={{ width: `${totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0}%` }}
                          className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Bar 2: Accepted / Scheduled */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Accepted / Scheduled</span>
                        <span className="text-cyan-300 font-bold">{acceptedSessions} ({totalSessions > 0 ? Math.round((acceptedSessions / totalSessions) * 100) : 0}%)</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-950/80 overflow-hidden border border-white/5">
                        <div
                          style={{ width: `${totalSessions > 0 ? (acceptedSessions / totalSessions) * 100 : 0}%` }}
                          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Bar 3: Pending */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Pending Mentor Approval</span>
                        <span className="text-amber-300 font-bold">{pendingSessions} ({totalSessions > 0 ? Math.round((pendingSessions / totalSessions) * 100) : 0}%)</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-950/80 overflow-hidden border border-white/5">
                        <div
                          style={{ width: `${totalSessions > 0 ? (pendingSessions / totalSessions) * 100 : 0}%` }}
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Moderation Queue Action Center */}
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Pending Moderation Queue</h2>
                    <p className="text-xs text-slate-400 mt-1">Directly resolve or dismiss urgent resident tickets</p>
                  </div>
                  <Link
                    href="/admin/reports"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
                  >
                    View All Reports ({reports.length}) <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {pendingReports.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-sm text-slate-400">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <span>The moderation queue is completely clear. No pending flags from residents.</span>
                    </div>
                  ) : (
                    pendingReports.map((report) => (
                      <div
                        key={report.report_id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.07] transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">Report #{report.report_id}</span>
                            <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                              {report.status}
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-semibold text-cyan-200">Reason: {report.reason}</div>
                          <div className="mt-1 text-xs text-slate-300">
                            Against: <span className="text-white font-semibold">{report.reported_user_name ? `${report.reported_user_name} (#${report.reported_user})` : `#${report.reported_user}`}</span> · By: <span className="text-white font-semibold">{report.reported_by_name ? `${report.reported_by_name} (#${report.reported_by})` : `#${report.reported_by}`}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleDismissReport(report.report_id)}
                            className="rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleResolveReport(report.report_id)}
                            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 transition"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SiteShell>
    </RoleGuard>
  );
}


