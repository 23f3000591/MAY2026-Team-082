"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Sparkles,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Flame
} from "lucide-react";

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

export default function AdminActivityPage() {
  const [activity, setActivity] = useState<PlatformActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiClient.getPlatformActivity();
      if (res && res.data) {
        setActivity(res.data);
      }
    } catch (err) {
      console.error("Failed to load platform activity:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return (
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          {/* Header */}
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Live Platform Telemetry</p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Platform Activity</h1>
                <p className="mt-3 text-slate-400">
                  Real-time audit log, user registration pipeline, booking conversion volume, and moderation resolutions.
                </p>
              </div>

              <button
                onClick={() => fetchActivity(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Live Sync
              </button>
            </div>
          </section>

          {loading ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-slate-900/60 p-16 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="mt-3 text-sm text-slate-400">Loading system metrics and audit trail...</p>
            </div>
          ) : (
            <>
              {/* Category Breakdown Cards */}
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {/* Users Breakdown */}
                <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-cyan-400" /> User Ecosystem
                    </h3>
                    <span className="text-xs font-bold text-cyan-300">
                      {activity?.users?.total ?? 0} Total
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Learners</span>
                      <span className="font-semibold text-emerald-300">{activity?.users?.learners ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Total Mentors</span>
                      <span className="font-semibold text-purple-300">{activity?.users?.mentors ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Verified Mentors</span>
                      <span className="font-semibold text-cyan-300">{activity?.users?.verified_mentors ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Pending Mentor Verifications</span>
                      <span className="font-semibold text-amber-300">{activity?.users?.pending_mentor_verification ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Suspended Accounts</span>
                      <span className="font-semibold text-rose-300">{activity?.users?.suspended_users ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Sessions Breakdown */}
                <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-400" /> Skill Sessions
                    </h3>
                    <span className="text-xs font-bold text-indigo-300">
                      {activity?.sessions?.total ?? 0} Total
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Completed Sessions</span>
                      <span className="font-semibold text-emerald-300">{activity?.sessions?.completed ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Accepted & Active</span>
                      <span className="font-semibold text-cyan-300">{activity?.sessions?.accepted ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Pending Approval</span>
                      <span className="font-semibold text-amber-300">{activity?.sessions?.pending ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Rejected Sessions</span>
                      <span className="font-semibold text-slate-400">{activity?.sessions?.rejected ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Cancelled by User</span>
                      <span className="font-semibold text-rose-300">{activity?.sessions?.cancelled ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Reports Breakdown */}
                <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-rose-400" /> Trust & Moderation
                    </h3>
                    <span className="text-xs font-bold text-rose-300">
                      {activity?.reports?.total ?? 0} Total
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Pending Review</span>
                      <span className="font-semibold text-amber-300">{activity?.reports?.pending ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Resolved Violations</span>
                      <span className="font-semibold text-emerald-300">{activity?.reports?.resolved ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-slate-400">Dismissed Cases</span>
                      <span className="font-semibold text-slate-400">{activity?.reports?.dismissed ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Timeline Stream */}
              <div className="mt-8 rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Flame className="h-5 w-5 text-amber-400" /> Live Audit Trail Stream
                </h3>
                <p className="mt-1 text-xs text-slate-400">Real-time log of security, moderation, and user actions.</p>

                <div className="mt-6 space-y-3">
                  {activity?.recent_activity && activity.recent_activity.length > 0 ? (
                    activity.recent_activity.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-slate-300 hover:bg-white/[0.08] transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-2 text-cyan-300">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{item.message}</div>
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                              Type: {item.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-400 shrink-0">
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-xs text-slate-400">
                      No system events recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </SiteShell>
    </RoleGuard>
  );
}

