"use client";

import { motion } from "framer-motion";
import { BrainCircuit, CalendarClock, Compass, ShieldCheck, Sparkles, Users2 } from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "AI mentor matching",
    description: "Find the perfect mentor based on goals, location, experience, and availability.",
  },
  {
    icon: CalendarClock,
    title: "Flexible bookings",
    description: "Reserve one-on-one sessions, join group cohorts, or lock in recurring mentorship.",
  },
  {
    icon: BrainCircuit,
    title: "Skill roadmaps",
    description: "Receive personalized guidance for your next milestone with adaptive learning paths.",
  },
  {
    icon: ShieldCheck,
    title: "Verified community",
    description: "Stay safe with moderated profiles, identity verification, and trusted reviews.",
  },
  {
    icon: Users2,
    title: "Neighborhood circles",
    description: "Create and join local communities around interests, events, and collaborative challenges.",
  },
  {
    icon: Sparkles,
    title: "Premium experience",
    description: "A polished interface with motion, rich states, and delightful interactions throughout.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
      <div className="mb-12 flex flex-col gap-4 text-center lg:text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Why it feels different</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Designed for meaningful exchange.</h2>
            <p className="mt-3 max-w-2xl text-lg text-slate-400">Every interaction is crafted to feel effortless, inspiring, and genuinely human.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="group rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.3)] backdrop-blur-xl"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 p-3 text-cyan-200">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
