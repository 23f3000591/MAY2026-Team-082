"use client";

import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore } from "@/lib/store";

export default function NotificationsPage() {
  const notifications = useAppStore((state) => state.notifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const deleteNotification = useAppStore((state) => state.deleteNotification);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-white">Notifications</h1>
          <p className="mt-3 text-slate-400">Stay informed about reminders, updates, and community actions.</p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Create notification</h2>
            <div className="mt-4 space-y-3">
              <input id="notification-title" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Title" />
              <textarea id="notification-message" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm" placeholder="Message" />
              <button className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => {
                const title = (document.getElementById("notification-title") as HTMLInputElement)?.value ?? "";
                const message = (document.getElementById("notification-message") as HTMLTextAreaElement)?.value ?? "";
                if (title && message) {
                  addNotification({ title, message });
                  (document.getElementById("notification-title") as HTMLInputElement).value = "";
                  (document.getElementById("notification-message") as HTMLTextAreaElement).value = "";
                }
              }}>Send</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Inbox</h2>
            <div className="mt-4 space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{item.message}</div>
                  <button className="mt-3 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => deleteNotification(item.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
