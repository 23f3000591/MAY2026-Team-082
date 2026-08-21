"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";

interface AdminUser {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  is_mentor: boolean;
  is_learner: boolean;
  is_verified: boolean;
  is_suspended: boolean;
}

interface AdminReport {
  report_id: number;
  reported_by: number;
  reported_user: number;
  reason: string;
  status: string;
  created_at: string;
}

interface PlatformActivity {
  total_users?: number;
  total_learners?: number;
  total_mentors?: number;
  total_sessions?: number;
  [key: string]: any;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [activity, setActivity] = useState<PlatformActivity>({});
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [usersRes, reportsRes, activityRes] = await Promise.allSettled([
          apiClient.getAdminUsers(),
          apiClient.getAdminReports(),
          apiClient.getPlatformActivity(),
        ]);
        if (usersRes.status === "fulfilled") setUsers(usersRes.value.data ?? []);
        if (reportsRes.status === "fulfilled") setReports(reportsRes.value.data ?? []);
        if (activityRes.status === "fulfilled") setActivity(activityRes.value.data ?? {});
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const flash = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const handleSuspend = async (userId: number, currentlySuspended: boolean) => {
    try {
      await apiClient.suspendUser(userId, !currentlySuspended);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, is_suspended: !currentlySuspended } : u
        )
      );
      flash(`User ${!currentlySuspended ? "suspended" : "unsuspended"} successfully.`);
    } catch (err: any) {
      flash(err?.response?.data?.message ?? "Action failed.");
    }
  };

  const handleVerifyMentor = async (userId: number, currentlyVerified: boolean) => {
    try {
      await apiClient.verifyMentor(userId, !currentlyVerified);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, is_verified: !currentlyVerified } : u
        )
      );
      flash(`Mentor ${!currentlyVerified ? "verified" : "unverified"} successfully.`);
    } catch (err: any) {
      flash(err?.response?.data?.message ?? "Action failed.");
    }
  };

  const handleResolve = async (reportId: number) => {
    try {
      await apiClient.resolveReport(reportId);
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, status: "Resolved" } : r))
      );
      flash("Report resolved.");
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
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">Admin control center</h1>
            <p className="mt-3 text-slate-400">Approve activity, manage users, and review reports in one place.</p>
          </section>

          {actionMsg ? (
            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
              {actionMsg}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
              Loading admin data…
            </div>
          ) : (
            <>
              {/* Platform statistics */}
              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
                  <h2 className="text-xl font-semibold text-white">Platform totals</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    {Object.entries(activity).map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                        <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-cyan-200">{String(value)}</span>
                      </div>
                    ))}
                    {Object.keys(activity).length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-500">
                        No activity data available.
                      </div>
                    )}
                  </div>
                </div>

                {/* System reports */}
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
                  <h2 className="text-xl font-semibold text-white">System reports</h2>
                  <div className="mt-4 space-y-3">
                    {reports.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-4 text-sm text-slate-400">
                        No reports to review.
                      </div>
                    ) : (
                      reports.map((report) => (
                        <div key={report.report_id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="font-semibold text-white">Report #{report.report_id}</div>
                          <div className="mt-1 text-sm text-slate-400">Reason: {report.reason}</div>
                          <div className="mt-1 text-xs text-slate-500">Status: {report.status} · {new Date(report.created_at).toLocaleDateString()}</div>
                          {report.status === "Pending" ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200"
                                onClick={() => handleResolve(report.report_id)}
                              >
                                Resolve
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

              {/* Registered accounts */}
              <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
                <h2 className="text-xl font-semibold text-white">Registered accounts</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {users.map((user) => (
                    <div key={user.user_id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="font-semibold text-white">{user.full_name}</div>
                      <div>{user.email}</div>
                      <div className="mt-1 text-cyan-200">{user.role}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {user.is_verified ? "✓ Verified" : "Unverified"} ·{" "}
                        {user.is_suspended ? "Suspended" : "Active"}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className={`rounded-full border px-3 py-2 text-sm ${
                            user.is_suspended
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                              : "border-rose-400/20 bg-rose-400/10 text-rose-200"
                          }`}
                          onClick={() => handleSuspend(user.user_id, user.is_suspended)}
                        >
                          {user.is_suspended ? "Unsuspend" : "Suspend"}
                        </button>
                        {user.is_mentor ? (
                          <button
                            className={`rounded-full border px-3 py-2 text-sm ${
                              user.is_verified
                                ? "border-slate-400/20 bg-slate-800/70 text-slate-200"
                                : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                            }`}
                            onClick={() => handleVerifyMentor(user.user_id, user.is_verified)}
                          >
                            {user.is_verified ? "Unverify" : "Verify mentor"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SiteShell>
    </RoleGuard>
  );
}
