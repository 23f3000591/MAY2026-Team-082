"use client";

import { SiteShell } from "@/components/layout/site-shell";
import { apiClient } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

interface Notification {
  notification_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await apiClient.getNotifications();
        setNotifications(res.data ?? []);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notificationId: number) => {
    try {
      await apiClient.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch {
      // Silently fail – UI already reflects optimistic state
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-white">Notifications</h1>
          <p className="mt-3 text-slate-400">Stay informed about reminders, updates, and community actions.</p>
        </section>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Inbox</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                Loading notifications…
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-6 text-center text-sm text-slate-400">
                <Bell className="mx-auto mb-2 h-6 w-6 opacity-40" />
                You have no notifications yet.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.notification_id}
                  className={`rounded-2xl border p-4 transition ${
                    item.is_read
                      ? "border-white/10 bg-white/5"
                      : "border-cyan-400/20 bg-cyan-400/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-sm text-slate-400">{item.message}</div>
                      {item.created_at ? (
                        <div className="mt-2 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                    {!item.is_read ? (
                      <button
                        className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200 transition hover:bg-cyan-400/20"
                        onClick={() => handleMarkRead(item.notification_id)}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

