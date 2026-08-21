"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const mentors = [
  {
    name: "Maya Chen",
    role: "Photography & storytelling",
    experience: "8 years",
    rating: "4.9",
    reviews: "218",
    badge: "Top mentor",
  },
  {
    name: "Jordan Alvarez",
    role: "AI product design",
    experience: "6 years",
    rating: "4.8",
    reviews: "184",
    badge: "Rising star",
  },
  {
    name: "Sofia Patel",
    role: "Public speaking",
    experience: "10 years",
    rating: "5.0",
    reviews: "312",
    badge: "Community favorite",
  },
];

export function MentorSection() {
  return (
    <section id="community" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
      <div className="mb-12 flex flex-col gap-3 text-center lg:text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Popular mentors</p>
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">Learn from the people who make local expertise feel extraordinary.</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {mentors.map((mentor, index) => (
          <motion.article
            key={mentor.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-white">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
                  <div>
                    <h3 className="font-semibold">{mentor.name}</h3>
                    <p className="text-sm text-slate-400">{mentor.role}</p>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">{mentor.badge}</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-300">
              <Star className="h-4 w-4 fill-cyan-400 text-cyan-400" />
              {mentor.rating} · {mentor.reviews} reviews
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              {mentor.experience} experience
            </div>
            <Button variant="secondary" className="mt-6 w-full">Book Session</Button>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
