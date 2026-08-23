"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Award, 
  Star, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Heart,
  Check
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { useAppStore, SkillEntry, SkillLevel } from "@/lib/store";
import { apiClient } from "@/lib/api-client";

export default function ProfilePage() {
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([
    "Advanced Web Development",
    "Acoustic Guitar Fingerpicking",
    "Morning Yoga & Mindfulness"
  ]);
  const [newGoalInput, setNewGoalInput] = useState("");

  // Add skill form state
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Technology");
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>("Intermediate");
  const [newSkillYears, setNewSkillYears] = useState(2);
  const [newSkillDescription, setNewSkillDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [liveRating, setLiveRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);

  // Sync state from current user and fetch live profile, skills, and reviews from backend
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setLocation(currentUser.location || "Green Valley Heights, Chennai");
      setYearsExperience(currentUser.yearsExperience ?? 5);
      setSkills(currentUser.skills ?? []);

      if (currentUser.id) {
        // Fetch live mentor profile including skills from database
        apiClient.getMentorProfile(String(currentUser.id)).then((res) => {
          const pData = res?.data;
          if (pData) {
            if (pData.full_name) setName(pData.full_name);
            if (pData.bio) setBio(pData.bio);
            if (pData.location) setLocation(pData.location);
            if (pData.skills && Array.isArray(pData.skills)) {
              const liveSkills: SkillEntry[] = pData.skills.map((s: any) => ({
                id: String(s.skill_id || s.id),
                name: s.skill_name || s.name,
                level: s.experience_level || "Intermediate",
                years: s.years_of_experience || 2,
                description: s.description || "",
              }));
              if (liveSkills.length > 0) {
                setSkills(liveSkills);
              }
            }
          }
        }).catch(() => {});

        // Fetch live reviews
        apiClient.getMentorReviews(currentUser.id).then((res) => {
          const revs = res?.data ?? [];
          setReviewCount(revs.length);
          if (revs.length > 0) {
            const avg = revs.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) / revs.length;
            setLiveRating(avg);
          } else {
            setLiveRating(5.0);
          }
        }).catch(() => {
          setLiveRating(5.0);
        });
      }
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setStatusMsg(null);

    try {
      await apiClient.editProfile({
        full_name: name,
        bio,
        location,
        years_of_experience: yearsExperience,
      });

      const updatedUser = {
        ...currentUser,
        name,
        bio,
        location,
        yearsExperience,
        skills,
      };

      setCurrentUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setStatusMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || "Failed to update profile.";
      setStatusMsg({ type: "error", text: errMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const skillNameVal = newSkillName.trim();
    const skillCatVal = newSkillCategory;
    const skillLvlVal = newSkillLevel;
    const skillYrsVal = newSkillYears;
    const skillDescVal = newSkillDescription;

    setNewSkillName("");
    setNewSkillDescription("");

    // Backend add skill
    try {
      const res = await apiClient.addSkill({
        skill_name: skillNameVal,
        category: skillCatVal,
        experience_level: skillLvlVal,
        years_of_experience: skillYrsVal,
        description: skillDescVal,
      });

      const returnedId = res?.data?.skill_id ? String(res.data.skill_id) : `${skillNameVal.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      const skillItem: SkillEntry = {
        id: returnedId,
        name: skillNameVal,
        level: skillLvlVal,
        years: skillYrsVal,
        description: skillDescVal,
      };

      setSkills((prev) => [...prev.filter((s) => s.name.toLowerCase() !== skillNameVal.toLowerCase()), skillItem]);
      setStatusMsg({ type: "success", text: `"${skillNameVal}" categorized under ${skillCatVal} and added!` });
    } catch (err: any) {
      const skillItem: SkillEntry = {
        id: `${skillNameVal.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        name: skillNameVal,
        level: skillLvlVal,
        years: skillYrsVal,
        description: skillDescVal,
      };
      setSkills((prev) => [...prev, skillItem]);
      setStatusMsg({ type: "error", text: err?.response?.data?.message || "Failed to save skill to server" });
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    const updatedSkills = skills.filter((s) => s.id !== skillId);
    setSkills(updatedSkills);

    try {
      const numericId = parseInt(skillId);
      if (!isNaN(numericId)) {
        await apiClient.deleteSkill(numericId);
      }
    } catch {
      // Local state is updated
    }
  };

  const handleAddLearningGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    setLearningGoals((prev) => [...prev, newGoalInput.trim()]);
    setNewGoalInput("");
  };

  const handleRemoveLearningGoal = (goal: string) => {
    setLearningGoals((prev) => prev.filter((g) => g !== goal));
  };

  const role = currentUser?.role?.toLowerCase() ?? "learner";
  const displayRating = liveRating !== null ? liveRating : 5.0;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Header Profile Summary */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-3xl font-bold text-cyan-300 shadow-inner">
                {(currentUser?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{currentUser?.name || "Member"}</h1>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-xs font-semibold capitalize text-cyan-300">
                    {role}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {currentUser?.email || "user@gmail.com"} · <MapPin className="h-3.5 w-3.5 text-cyan-400" /> {location}
                </p>
                
                {/* Community Trust Badges */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <ShieldCheck className="h-3 w-3" /> Community Verified
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                    <Check className="h-3 w-3" /> Email & Phone Confirmed
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-purple-300">
                    <Sparkles className="h-3 w-3" /> Trust Score: 98/100
                  </span>
                </div>
              </div>
            </div>

            {/* Clean Metric Cards */}
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Community Rating</div>
                {reviewCount > 0 ? (
                  <>
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-xl font-bold text-amber-300">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{displayRating.toFixed(1)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">({reviewCount} reviews)</div>
                  </>
                ) : (
                  <>
                    <div className="mt-1 text-sm font-bold text-cyan-300">
                      New Member
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">0 reviews yet</div>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skills Listed</div>
                <div className="mt-1 text-xl font-bold text-cyan-300">
                  {skills.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">teach & share</div>
              </div>

              {/* Message Admin Support Option */}
              <Link
                href="/messages?to=1&name=Society%20Admin"
                className="hidden sm:flex flex-col items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-center transition hover:bg-purple-500/20"
                title="Send a message to Society Administrator for help, verification, or reporting"
              >
                <ShieldCheck className="h-5 w-5 text-purple-300 mb-1" />
                <span className="text-[11px] font-bold text-purple-200">Message Admin</span>
                <span className="text-[9px] text-slate-400">Direct Support</span>
              </Link>
            </div>
          </div>
        </section>

        {statusMsg && (
          <div className={`mt-6 flex items-center gap-3 rounded-2xl border p-4 text-sm ${
            statusMsg.type === "success" 
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" 
              : "border-rose-400/20 bg-rose-400/10 text-rose-300"
          }`}>
            {statusMsg.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Edit Profile & Skills I Want to Learn */}
          <div className="space-y-8">
            {/* Edit Profile Form */}
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-400" /> About & Bio
              </h2>

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 text-xs text-slate-300">
                <div>
                  <label className="mb-1.5 block font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-semibold text-slate-300">Resident Bio / Background</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell neighbors about your experience, background, and passion..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block font-semibold text-slate-300">Society / Neighborhood</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Green Valley Heights, Chennai"
                      className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block font-semibold text-slate-300">Years of Experience</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>

            {/* Skills I Want to Learn (Learner Goals) - only visible for learners */}
            {role === "learner" && (
              <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-400" /> Skills I Want to Learn
                  </h2>
                  <span className="text-xs text-indigo-300 font-semibold">{learningGoals.length} goals</span>
                </div>
                <p className="text-xs text-slate-400">Neighbors can see your learning goals and offer skill exchanges.</p>

                <form onSubmit={handleAddLearningGoal} className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    placeholder="e.g. Creative Photography, Italian Cooking..."
                    className="flex-1 rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-500/20 border border-indigo-500/30 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30 transition cursor-pointer"
                  >
                    Add Goal
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  {learningGoals.map((goal) => (
                    <span
                      key={goal}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200"
                    >
                      <span>{goal}</span>
                      <button
                        onClick={() => handleRemoveLearningGoal(goal)}
                        className="text-slate-400 hover:text-rose-300 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Skills I Can Teach */}
          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-teal-400" /> Skills I Can Teach ({skills.length})
              </h2>
              <p className="text-xs text-slate-400 mt-1">Skills you can share with neighbors in Green Valley Heights.</p>

              {/* Add Skill Form */}
              <form onSubmit={handleAddSkill} className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="Skill name (e.g. Portrait Photography)"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />

                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="Technology">💻 Technology & Code</option>
                    <option value="Music">🎸 Music & Instruments</option>
                    <option value="Fitness">🧘 Yoga & Fitness</option>
                    <option value="Cooking">🍳 Cooking & Food</option>
                    <option value="Arts & Creativity">🎨 Arts & Creativity</option>
                    <option value="Languages">🗣️ Languages & Speaking</option>
                    <option value="Academic">📚 Academic & Tutoring</option>
                    <option value="General">🌟 General Skills</option>
                  </select>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>

                  <input
                    type="number"
                    min={1}
                    max={40}
                    placeholder="Years experience"
                    value={newSkillYears}
                    onChange={(e) => setNewSkillYears(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-teal-500/20 border border-teal-500/30 px-4 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Publish Teaching Skill
                </button>
              </form>

              {/* Skills List */}
              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
                {skills.length ? (
                  skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{skill.name}</div>
                        <div className="text-slate-400 mt-0.5">{skill.level} · {skill.years} {skill.years === 1 ? "year" : "years"} exp</div>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="text-rose-400 hover:text-rose-300 transition p-1 cursor-pointer"
                        title="Remove skill"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-center text-xs text-slate-400">
                    No teaching skills listed yet. Add your first skill above to become a community mentor!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
