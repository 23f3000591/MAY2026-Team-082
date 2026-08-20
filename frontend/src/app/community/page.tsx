import { CalendarDays, MessageSquareText, Sparkles, Users2 } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { communities } from "@/lib/mock-data";

export default function CommunityPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Community experience</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Build deeper connections around skills, challenges, and shared growth.</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-400">Join discussion circles, attend live events, and participate in local hackathons and skill challenges.</p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-2 text-cyan-200">
              <CalendarDays className="h-5 w-5" />
              <h2 className="text-xl font-semibold text-white">Upcoming events</h2>
            </div>
            <div className="space-y-3">
              {[
                { title: "Neighborhood hackathon", time: "Sat · 11:00 AM", description: "Build and ship something meaningful in 24 hours." },
                { title: "Cooking exchange night", time: "Sun · 6:00 PM", description: "Learn recipes, share techniques, and connect with chefs." },
              ].map((event) => (
                <div key={event.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold text-white">{event.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{event.description}</div>
                  <div className="mt-3 text-sm text-cyan-200">{event.time}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-2 text-cyan-200">
                <Users2 className="h-5 w-5" />
                <h2 className="text-xl font-semibold text-white">Active communities</h2>
              </div>
              <div className="space-y-3">
                {communities.map((community) => (
                  <div key={community.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">{community.name}</div>
                    <div className="mt-1 text-sm text-slate-400">{community.focus}</div>
                    <div className="mt-3 text-sm text-cyan-200">{community.members.toLocaleString()} members</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-2 text-cyan-200">
                <MessageSquareText className="h-5 w-5" />
                <h2 className="text-xl font-semibold text-white">Latest discussions</h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="font-semibold text-white">How do you structure a first portfolio project?</div>
                <div className="mt-2">81 replies · 14 new today</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
