"use client";

import { BadgeCheck, Camera, Plus, Sparkles, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { SkillEntry, SkillLevel, useAppStore } from "@/lib/store";

export default function ProfilePage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>("Beginner");
  const [newSkillYears, setNewSkillYears] = useState(0);
  const [newSkillDescription, setNewSkillDescription] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setBio(currentUser.bio ?? "");
    setLocation(currentUser.location ?? "");
    setYearsExperience(currentUser.yearsExperience ?? 0);
    setSkills(currentUser.skills ?? []);
  }, [currentUser]);

  const saveProfile = () => {
    if (!currentUser) return;
    updateUserProfile(currentUser.id, {
      name,
      bio,
      location,
      yearsExperience,
      skills,
    });
    setMessage("Profile updated successfully.");
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    const skill: SkillEntry = {
      id: `${newSkillName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: newSkillName,
      level: newSkillLevel,
      years: newSkillYears,
      description: newSkillDescription,
    };
    setSkills((current) => [skill, ...current]);
    setNewSkillName("");
    setNewSkillLevel("Beginner");
    setNewSkillYears(0);
    setNewSkillDescription("");
  };

  const removeSkill = (skillId: string) => {
    setSkills((current) => current.filter((skill) => skill.id !== skillId));
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="h-40 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.25),_transparent_35%)]" />
          <div className="relative px-6 pb-8 pt-0 sm:px-8">
            <div className="-mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-slate-900 bg-slate-800">
                  {currentUser?.avatarUrl ? <img className="h-full w-full object-cover" src={currentUser.avatarUrl} alt="Avatar" /> : null}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">Profile</p>
                  <h1 className="mt-2 text-3xl font-semibold text-white">{currentUser?.name ?? "Guest"}</h1>
                  <p className="mt-2 text-slate-400">{currentUser?.email ?? "No email"} · {currentUser?.role ?? "learner"}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <Camera className="h-4 w-4 text-cyan-300" /> Update banner
              </button>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-2 text-cyan-200"><Sparkles className="h-4 w-4" /> Bio</div>
                <p className="mt-4 text-slate-300">{bio || "Share your mentor story, experience, and strengths so learners can discover you."}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill.id} className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">{skill.name}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-2 text-cyan-200"><Star className="h-4 w-4" /> Reputation</div>
                <div className="mt-4 text-3xl font-semibold text-white">{currentUser?.yearsExperience ?? 0}/10 yrs</div>
                <div className="mt-2 text-sm text-slate-400">{skills.length} skills listed · Verified profile</div>
                <div className="mt-6 flex items-center gap-2 text-sm text-emerald-300">
                  <BadgeCheck className="h-4 w-4" /> Active mentor profile
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Edit profile</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-slate-400">Name</span>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={name} onChange={(event) => setName(event.target.value)} />
                </label>
                <label className="space-y-2">
                  <span className="text-slate-400">Location</span>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={location} onChange={(event) => setLocation(event.target.value)} />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-slate-400">Bio</span>
                <textarea className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-slate-400">Years of experience</span>
                <input type="number" min={0} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" value={yearsExperience} onChange={(event) => setYearsExperience(Number(event.target.value))} />
              </label>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">Skills</div>
                  <button className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200" onClick={addSkill}>
                    <Plus className="h-4 w-4" /> Add skill
                  </button>
                </div>
                <div className="grid gap-3">
                  <input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none" placeholder="Skill name" value={newSkillName} onChange={(event) => setNewSkillName(event.target.value)} />
                  <textarea className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none" rows={2} placeholder="Skill description" value={newSkillDescription} onChange={(event) => setNewSkillDescription(event.target.value)} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none" value={newSkillLevel} onChange={(event) => setNewSkillLevel(event.target.value as SkillLevel)}>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                    <input type="number" min={0} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none" placeholder="Years" value={newSkillYears} onChange={(event) => setNewSkillYears(Number(event.target.value))} />
                  </div>
                </div>
              </div>
              {skills.length ? (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                      <div>
                        <div className="font-medium text-white">{skill.name}</div>
                        <div className="text-sm text-slate-400">{skill.level} · {skill.years} yrs</div>
                      </div>
                      <button className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" onClick={() => removeSkill(skill.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <button className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white" onClick={saveProfile}>Save profile</button>
              {message ? <div className="text-sm text-emerald-300">{message}</div> : null}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 text-cyan-200"><Sparkles className="h-4 w-4" /> Account overview</div>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">{currentUser?.role === "mentor" ? "Mentor" : "Learner"} account · {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "Joined recently"}</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Profile completeness: {Math.min(100, 50 + skills.length * 10)}%</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Membership: active · {currentUser?.favorites?.length ?? 0} saved mentors</div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
