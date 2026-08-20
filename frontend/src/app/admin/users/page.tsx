"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function AdminUsersPage() {
  const users = useAppStore((state) => state.users);
  const currentUser = useAppStore((state) => state.currentUser);

  return (
    <RoleGuard roles={["admin"]}>
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">User management</h1>
            <p className="mt-3 text-slate-400">View all registered accounts and their roles across the platform.</p>
          </section>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-[0_20px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="grid grid-cols-6 gap-4 border-b border-white/10 bg-slate-950/70 px-6 py-4 text-sm uppercase tracking-[0.24em] text-slate-400">
              <span className="col-span-2">Name</span>
              <span className="col-span-2">Email</span>
              <span>Role</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-white/5">
              {users.map((user) => (
                <div key={user.id} className="grid grid-cols-6 gap-4 px-6 py-5 text-sm text-slate-300">
                  <div className="col-span-2">
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-slate-500">{user.location ?? "—"}</div>
                  </div>
                  <div className="col-span-2">{user.email}</div>
                  <div>{user.role}</div>
                  <div>{currentUser?.id === user.id ? "Active" : "Registered"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SiteShell>
    </RoleGuard>
  );
}
