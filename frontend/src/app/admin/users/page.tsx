"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Eye,
  Mail,
  Phone,
  Calendar,
  Building,
  Sparkles,
  X
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
  bio?: string;
  society_id?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchUsers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await apiClient.getAdminUsers();
      if (response && response.data) {
        setUsers(response.data);
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.response?.data?.message || "Failed to fetch user accounts from server.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const flash = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleSuspend = async (userId: number, currentlySuspended: boolean) => {
    try {
      await apiClient.suspendUser(userId, !currentlySuspended);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, is_suspended: !currentlySuspended } : u
        )
      );
      if (selectedUser?.user_id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, is_suspended: !currentlySuspended } : null);
      }
      flash(`User account ${!currentlySuspended ? "suspended" : "reactivated"} successfully.`);
    } catch (err: any) {
      flash(err?.response?.data?.message || "Action failed.", "error");
    }
  };

  const handleToggleVerifyMentor = async (userId: number, currentlyVerified: boolean) => {
    try {
      await apiClient.verifyMentor(userId, !currentlyVerified);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, is_verified: !currentlyVerified } : u
        )
      );
      if (selectedUser?.user_id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, is_verified: !currentlyVerified } : null);
      }
      flash(`Mentor credentials ${!currentlyVerified ? "verified" : "unverified"} successfully.`);
    } catch (err: any) {
      flash(err?.response?.data?.message || "Action failed.", "error");
    }
  };

  const handleViewDetails = async (user: AdminUser) => {
    setSelectedUser(user);
    try {
      const res = await apiClient.getAdminUserDetails(user.user_id);
      if (res && res.data) {
        setSelectedUser(res.data);
      }
    } catch (e) {
      // Keep basic info if detail endpoint has partial data
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(searchQuery));

    const matchesRole =
      roleFilter === "all"
        ? true
        : roleFilter === "mentor"
        ? u.is_mentor
        : roleFilter === "learner"
        ? u.is_learner
        : u.role === roleFilter;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? !u.is_suspended
        : statusFilter === "suspended"
        ? u.is_suspended
        : statusFilter === "verified"
        ? u.is_verified
        : statusFilter === "unverified"
        ? !u.is_verified
        : true;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          {/* Header */}
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Account Directory</p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">User Governance</h1>
                <p className="mt-3 text-slate-400">
                  Manage all platform participants, verify community mentors, and govern user access across societies.
                </p>
              </div>

              <button
                onClick={() => fetchUsers(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Sync Users
              </button>
            </div>

            {/* Filter controls */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3 border-t border-white/10 pt-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, phone..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs uppercase font-semibold text-slate-400">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setRoleFilter(newRole);
                    if ((newRole === "learner" || newRole === "admin") && (statusFilter === "verified" || statusFilter === "unverified")) {
                      setStatusFilter("all");
                    }
                  }}
                  className="w-full bg-slate-950 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All Roles</option>
                  <option value="mentor" className="bg-slate-900 text-white">Mentors Only</option>
                  <option value="learner" className="bg-slate-900 text-white">Learners Only</option>
                  <option value="admin" className="bg-slate-900 text-white">Administrators Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs uppercase font-semibold text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 text-xs font-semibold text-white outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All Statuses</option>
                  <option value="active" className="bg-slate-900 text-white">Active Only</option>
                  <option value="suspended" className="bg-slate-900 text-white">Suspended</option>
                  {(roleFilter === "all" || roleFilter === "mentor") && (
                    <>
                      <option value="verified" className="bg-slate-900 text-white">Verified Mentors</option>
                      <option value="unverified" className="bg-slate-900 text-white">Unverified Mentors</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </section>

          {/* Feedback alert */}
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

          {/* User Table & Grid */}
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-[0_20px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="grid grid-cols-12 gap-4 border-b border-white/10 bg-slate-950/60 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span className="col-span-4">User Details</span>
              <span className="col-span-3">Role & Type</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-3 text-right">Quick Governance</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
                <p className="mt-3 text-sm text-slate-400">Loading user accounts...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-16 text-center text-sm text-slate-400">
                No users match your active search and filter criteria.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="grid grid-cols-12 items-center gap-4 px-6 py-4 text-sm hover:bg-white/[0.03] transition"
                  >
                    {/* Column 1: Info */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-white/10 font-bold text-cyan-300 shadow">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{user.full_name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>

                    {/* Column 2: Role */}
                    <div className="col-span-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-200 capitalize">
                          {user.role}
                        </span>
                        {user.is_mentor && (
                          <span className="inline-flex rounded-full bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 text-[11px] font-medium text-violet-300">
                            Mentor
                          </span>
                        )}
                        {user.is_learner && (
                          <span className="inline-flex rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                            Learner
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Status */}
                    <div className="col-span-2 space-y-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          user.is_suspended
                            ? "bg-rose-400/10 border-rose-400/20 text-rose-300"
                            : "bg-emerald-400/10 border-emerald-400/20 text-emerald-300"
                        }`}
                      >
                        {user.is_suspended ? "Suspended" : "Active"}
                      </span>
                      {user.is_mentor && (
                        <div className="text-xs">
                          {user.is_verified ? (
                            <span className="text-cyan-300 font-medium">✓ Verified</span>
                          ) : (
                            <span className="text-amber-300 font-medium">Unverified</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Column 4: Actions */}
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(user)}
                        title="View Full Profile Details"
                        className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {user.role === "admin" ? (
                        <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-300">
                          Protected Admin
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleSuspend(user.user_id, user.is_suspended)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition border cursor-pointer ${
                            user.is_suspended
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                              : "border-rose-400/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
                          }`}
                        >
                          {user.is_suspended ? "Reactivate" : "Suspend"}
                        </button>
                      )}

                      {user.is_mentor && (
                        <button
                          onClick={() => handleToggleVerifyMentor(user.user_id, user.is_verified)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition border cursor-pointer ${
                            user.is_verified
                              ? "border-slate-400/20 bg-slate-800/70 text-slate-300 hover:bg-slate-800"
                              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
                          }`}
                        >
                          {user.is_verified ? "Unverify" : "Verify"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-xl font-bold text-cyan-300">
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{selectedUser.full_name}</h3>
                      <p className="text-xs text-slate-400">User ID #{selectedUser.user_id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Mail className="h-4 w-4 text-cyan-300 shrink-0" />
                    <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone_number && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <Phone className="h-4 w-4 text-cyan-300 shrink-0" />
                      <span>{selectedUser.phone_number}</span>
                    </div>
                  )}
                  {selectedUser.society_id && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <Building className="h-4 w-4 text-cyan-300 shrink-0" />
                      <span>Society ID: {selectedUser.society_id}</span>
                    </div>
                  )}
                  {selectedUser.created_at && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <Calendar className="h-4 w-4 text-cyan-300 shrink-0" />
                      <span>Joined: {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                  )}

                  {selectedUser.bio && (
                    <div className="mt-4 rounded-2xl bg-slate-950/60 p-4 border border-white/5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Bio</div>
                      <p className="mt-1 text-sm text-slate-300">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  {selectedUser.role === "admin" ? (
                    <div className="w-full rounded-2xl border border-purple-400/20 bg-purple-400/10 p-3 text-center text-xs font-semibold text-purple-300">
                      🛡️ Administrator Account Protected from Suspension
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggleSuspend(selectedUser.user_id, selectedUser.is_suspended)}
                      className={`flex-1 rounded-full py-2.5 text-xs font-semibold transition border cursor-pointer ${
                        selectedUser.is_suspended
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                          : "border-rose-400/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"
                      }`}
                    >
                      {selectedUser.is_suspended ? "Reactivate Account" : "Suspend Account"}
                    </button>
                  )}

                  {selectedUser.is_mentor && (
                    <button
                      onClick={() => handleToggleVerifyMentor(selectedUser.user_id, selectedUser.is_verified)}
                      className={`flex-1 rounded-full py-2.5 text-xs font-semibold transition border cursor-pointer ${
                        selectedUser.is_verified
                          ? "border-slate-400/20 bg-slate-800/70 text-slate-300 hover:bg-slate-800"
                          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
                      }`}
                    >
                      {selectedUser.is_verified ? "Revoke Verification" : "Verify Mentor"}
                    </button>
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

