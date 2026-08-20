"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "100+", label: "Skills" },
  { value: "4.9/5", label: "Average Rating" },
  { value: "24/7", label: "Community Support" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[0_30px_120px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-10 lg:p-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.08),_transparent_35%)]" />
      <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            Neighborhood Skill Exchange Platform
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-7xl">
              Learn from your neighbors. Teach what you love.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[var(--text-secondary)] sm:text-xl">
              Discover local mentors, share expertise, and build a thriving community through live sessions, curated groups, and smart recommendations.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg">
              <Link href="/auth/login">Join the community <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/auth/login"><PlayCircle className="h-4 w-4" /> Watch demo</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-[var(--text-secondary)]">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <div className="text-xl font-semibold text-[var(--text-primary)]">{item.value}</div>
                <div>{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[var(--accent)]/15 to-violet-500/10 blur-3xl" />
          <div className="relative rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Live Learning Network</p>
                <div className="mt-2 flex items-center gap-2 text-[var(--text-primary)]">
                  <Users className="h-4 w-4 text-[var(--accent)]" />
                  8,240 active members
                </div>
              </div>
              <div className="rounded-full bg-emerald-500/15 p-3 text-emerald-300">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-8 space-y-4">
              {[
                { title: "AI mentor matching", meta: "Matches you with the best local mentor" },
                { title: "Instant booking", meta: "Reserve sessions in under a minute" },
                { title: "Skill challenges", meta: "Compete and grow together" },
              ].map((item, index) => (
                <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{item.title}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{item.meta}</div>
                    </div>
                  </div>
                  {index === 1 && <div className="mt-3 h-2 rounded-full bg-[var(--surface-hover)]"><div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" /></div>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
