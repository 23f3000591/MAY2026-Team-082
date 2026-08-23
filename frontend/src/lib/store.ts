import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "learner" | "mentor" | "admin" | "manager" | "moderator";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface SkillEntry {
  id: string;
  name: string;
  level: SkillLevel;
  years: number;
  description: string;
}

export interface AvailabilitySlot {
  id: string;
  mentorId: string;
  day: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface Review {
  id: string;
  mentorId: string;
  learnerId: string;
  bookingId: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  reported: boolean;
}

export interface MessageItem {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  yearsExperience?: number;
  rating?: number;
  reviews?: number;
  skills?: SkillEntry[];
  favorites?: string[];
}

export interface LearningRequest {
  id: string;
  title: string;
  skill: string;
  goal: string;
  priority: "Low" | "Medium" | "High";
  createdAt: string;
  userId: string;
}

export interface MentorSession {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  price: string;
  mentorId: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "Low" | "Medium" | "High";
  createdAt: string;
  authorId: string;
}

export interface Report {
  id: string;
  title: string;
  details: string;
  reason: string;
  description: string;
  status: "Open" | "Resolved" | "Escalated";
  createdAt: string;
  reporterId: string;
  reviewId?: string;
  resolvedById?: string;
}

export interface Booking {
  id: string;
  title: string;
  skill: string;
  mentor: string;
  mentorId: string;
  learnerId: string;
  date: string;
  time: string;
  mode: "Online" | "In-person" | "Hybrid";
  note: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled" | "Rejected";
  createdAt: string;
  userId: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  userId: string;
}

interface AppState {
  users: User[];
  currentUser: User | null;
  learningRequests: LearningRequest[];
  mentorSessions: MentorSession[];
  announcements: Announcement[];
  reports: Report[];
  bookings: Booking[];
  notifications: NotificationItem[];
  availability: AvailabilitySlot[];
  reviews: Review[];
  messages: MessageItem[];
  passwordResetTokens: PasswordResetToken[];
  authError: string | null;
  theme: "light" | "dark";
  login: (email: string, password: string) => boolean;
  signup: (data: { name: string; email: string; password: string; role: UserRole }) => boolean;
  logout: () => void;
  changeRole: (nextRole: UserRole) => void;
  toggleTheme: () => void;
  setCurrentUser: (user: User) => void;
  addFavoriteMentor: (mentorId: string) => void;
  removeFavoriteMentor: (mentorId: string) => void;
  addLearningRequest: (request: Omit<LearningRequest, "id" | "createdAt" | "userId">) => void;
  updateLearningRequest: (id: string, updates: Partial<LearningRequest>) => void;
  deleteLearningRequest: (id: string) => void;
  addMentorSession: (session: Omit<MentorSession, "id" | "createdAt" | "mentorId" | "status">) => void;
  updateMentorSession: (id: string, updates: Partial<MentorSession>) => void;
  deleteMentorSession: (id: string) => void;
  addAvailability: (availability: Omit<AvailabilitySlot, "id" | "createdAt">) => void;
  updateAvailability: (id: string, updates: Partial<AvailabilitySlot>) => void;
  deleteAvailability: (id: string) => void;
  addAnnouncement: (announcement: Omit<Announcement, "id" | "createdAt" | "authorId">) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  addReport: (report: Omit<Report, "id" | "createdAt" | "reporterId">) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  requestPasswordReset: (email: string) => string | null;
  resetPassword: (token: string, password: string) => boolean;
  updateUserProfile: (userId: string, updates: Partial<Pick<User, "name" | "avatarUrl" | "bio" | "location" | "yearsExperience" | "skills">>) => void;
  addReview: (review: Omit<Review, "id" | "createdAt" | "reported">) => void;
  reportReview: (reviewId: string, reason: string, description: string) => void;
  sendMessage: (message: Omit<MessageItem, "id" | "createdAt" | "read">) => void;
  markMessageRead: (id: string) => void;
  addBooking: (booking: Omit<Booking, "id" | "createdAt" | "userId" | "learnerId" | "status">) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  addNotification: (notification: Omit<NotificationItem, "id" | "createdAt" | "userId">) => void;
  updateNotification: (id: string, updates: Partial<NotificationItem>) => void;
  deleteNotification: (id: string) => void;
}

const createId = () => Math.random().toString(36).slice(2, 10);

const initialUsers: User[] = [
  {
    id: "1",
    name: "Akhil",
    email: "akhil@gmail.com",
    password: "Password123!",
    role: "admin",
    createdAt: new Date().toISOString(),
    bio: "Lead Platform Administrator for Community Skill Exchange.",
    location: "Metropolis",
    yearsExperience: 10,
    skills: [],
    favorites: [],
  },
  {
    id: "2",
    name: "Saanvi",
    email: "saanvi@gmail.com",
    password: "Password123!",
    role: "mentor",
    createdAt: new Date().toISOString(),
    bio: "Senior Full-stack Engineer with expertise in Python, Web Development, and Cloud architecture.",
    location: "Green Valley Heights",
    yearsExperience: 8,
    rating: 4.9,
    reviews: 14,
    skills: [
      { id: createId(), name: "Python Programming", level: "Expert", years: 8, description: "Backend development, Flask, API design, algorithms." },
      { id: createId(), name: "Web Development", level: "Advanced", years: 6, description: "Modern React, Next.js, and scalable web apps." },
    ],
    favorites: [],
  },
  {
    id: "3",
    name: "Karthick",
    email: "karthick@gmail.com",
    password: "Password123!",
    role: "mentor",
    createdAt: new Date().toISOString(),
    bio: "Lead Data Scientist and Machine Learning Engineer. Passionate about AI ethics, statistics, and neural networks.",
    location: "Green Valley Heights",
    yearsExperience: 6,
    rating: 4.8,
    reviews: 11,
    skills: [
      { id: createId(), name: "Data Science", level: "Expert", years: 6, description: "Pandas, ML models, exploratory data analysis, predictive modeling." },
      { id: createId(), name: "Mathematics", level: "Advanced", years: 5, description: "Linear algebra, calculus, and discrete mathematics." },
    ],
    favorites: [],
  },
  {
    id: "4",
    name: "Harsh Kumar",
    email: "harshkumar@gmail.com",
    password: "Password123!",
    role: "mentor",
    createdAt: new Date().toISOString(),
    bio: "Professional Musician, Vocalist, and certified Yoga instructor with over 7 years of community teaching experience.",
    location: "Green Valley Heights",
    yearsExperience: 7,
    rating: 5.0,
    reviews: 18,
    skills: [
      { id: createId(), name: "Guitar", level: "Expert", years: 7, description: "Acoustic and electric guitar fundamentals, fingerstyle, chords." },
      { id: createId(), name: "Yoga & Fitness", level: "Expert", years: 5, description: "Hatha yoga, breathwork, posture correction, and mobility." },
    ],
    favorites: [],
  },
  {
    id: "5",
    name: "Harshad",
    email: "harshad@gmail.com",
    password: "Password123!",
    role: "learner",
    createdAt: new Date().toISOString(),
    bio: "Aspiring software developer eager to master Python backend design and modern frontend frameworks.",
    location: "Green Valley Heights",
    yearsExperience: 1,
    skills: [
      { id: createId(), name: "Python Programming", level: "Beginner", years: 1, description: "Learning syntax and basic data structures." },
    ],
    favorites: ["2", "3"],
  },
  {
    id: "6",
    name: "Athul",
    email: "athul@gmail.com",
    password: "Password123!",
    role: "learner",
    createdAt: new Date().toISOString(),
    bio: "Passionate about Machine Learning, Mathematics, and Data Visualizations.",
    location: "Green Valley Heights",
    yearsExperience: 1,
    skills: [
      { id: createId(), name: "Mathematics", level: "Intermediate", years: 2, description: "Calculus and probability." },
    ],
    favorites: ["3"],
  },
  {
    id: "7",
    name: "Sooraj",
    email: "sooraj@gmail.com",
    password: "Password123!",
    role: "learner",
    createdAt: new Date().toISOString(),
    bio: "Learning Acoustic Guitar and Vocal rhythm for live performances.",
    location: "Green Valley Heights",
    yearsExperience: 1,
    skills: [],
    favorites: ["4"],
  },
  {
    id: "8",
    name: "Manas",
    email: "manas@gmail.com",
    password: "Password123!",
    role: "learner",
    createdAt: new Date().toISOString(),
    bio: "Interested in Yoga, physical wellness, and public speaking confidence.",
    location: "Green Valley Heights",
    yearsExperience: 1,
    skills: [],
    favorites: ["4"],
  },
];

const initialLearningRequests: LearningRequest[] = [
  {
    id: createId(),
    title: "Python Backend Architecture Guidance",
    skill: "Python Programming",
    goal: "Learn Flask API architecture and database relationships",
    priority: "High",
    createdAt: new Date().toISOString(),
    userId: "5",
  },
];

const initialMentorSessions: MentorSession[] = [
  {
    id: createId(),
    title: "Full-stack Python & React Workshop",
    description: "Hands-on session building modern reactive applications.",
    date: "2026-08-30",
    duration: "60 min",
    price: "Free Community",
    mentorId: "2",
    status: "Approved",
    createdAt: new Date().toISOString(),
  },
];

const initialAnnouncements: Announcement[] = [
  {
    id: createId(),
    title: "New neighborhood hackathon",
    content: "Join this weekend to build with local creators.",
    priority: "High",
    createdAt: new Date().toISOString(),
    authorId: "maya-chen",
  },
];

const initialReports: Report[] = [
  {
    id: createId(),
    title: "Inappropriate listing",
    details: "A user reported fake booking activity on a session post.",
    reason: "Content violation",
    description: "The review appears to be spam and contains misleading claims.",
    status: "Open",
    createdAt: new Date().toISOString(),
    reporterId: "noah-singh",
  },
];

const initialBookings: Booking[] = [
  {
    id: createId(),
    title: "AI workflow sprint",
    skill: "AI Product Design",
    mentor: "Ava Morales",
    mentorId: "ava-morales",
    learnerId: "noah-singh",
    date: "2026-07-10",
    time: "7:00 PM",
    mode: "Online",
    note: "Looking for a practical session on AI roadmap planning.",
    status: "Confirmed",
    createdAt: new Date().toISOString(),
    userId: "noah-singh",
  },
];

const initialNotifications: NotificationItem[] = [
  {
    id: createId(),
    title: "Session reminder",
    message: "Your mentorship session starts in 30 minutes.",
    createdAt: new Date().toISOString(),
    userId: "noah-singh",
  },
];

const initialAvailability: AvailabilitySlot[] = [
  {
    id: createId(),
    mentorId: "ava-morales",
    day: "Wednesday",
    startTime: "4:00 PM",
    endTime: "6:00 PM",
    createdAt: new Date().toISOString(),
  },
];

const initialReviews: Review[] = [
  {
    id: createId(),
    mentorId: "ava-morales",
    learnerId: "noah-singh",
    bookingId: null,
    rating: 5,
    comment: "Ava helped me shape a stronger portfolio and gave clear feedback.",
    createdAt: new Date().toISOString(),
    reported: false,
  },
];

const initialMessages: MessageItem[] = [
  {
    id: createId(),
    fromId: "ava-morales",
    toId: "noah-singh",
    content: "Hi Noah, I’m available this week if you want to book a quick portfolio review.",
    createdAt: new Date().toISOString(),
    read: false,
  },  {
    id: createId(),
    fromId: "maya-chen",
    toId: "noah-singh",
    content: "Your photography skills are impressive! I'd love to collaborate on a project.",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: createId(),
    fromId: "jordan-alvarez",
    toId: "noah-singh",
    content: "Thanks for joining my AI workshop last week. Great questions!",
    createdAt: new Date().toISOString(),
    read: true,
  },
  {
    id: createId(),
    fromId: "sofia-patel",
    toId: "noah-singh",
    content: "I'm hosting a speaking workshop this weekend. Are you interested?",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: createId(),
    fromId: "noah-singh",
    toId: "maya-chen",
    content: "Hi Ma'am, I'm very interested in learning photography. When can we schedule a session?",
    createdAt: new Date().toISOString(),
    read: true,
  },
  {
    id: createId(),
    fromId: "noah-singh",
    toId: "jordan-alvarez",
    content: "Thank you for the workshop! Can you share the resources you mentioned?",
    createdAt: new Date().toISOString(),
    read: true,
  },
  {
    id: createId(),
    fromId: "noah-singh",
    toId: "ava-morales",
    content: "Sure! I'd love to get your feedback on my portfolio pieces.",
    createdAt: new Date().toISOString(),
    read: true,
  },
  {
    id: createId(),
    fromId: "noah-singh",
    toId: "sofia-patel",
    content: "Yes! I'm definitely interested. What topics will be covered?",
    createdAt: new Date().toISOString(),
    read: true,
  },
];

const initialPasswordResetTokens: PasswordResetToken[] = [];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      currentUser: null,
      learningRequests: initialLearningRequests,
      mentorSessions: initialMentorSessions,
      announcements: initialAnnouncements,
      reports: initialReports,
      bookings: initialBookings,
      notifications: initialNotifications,
      availability: initialAvailability,
      reviews: initialReviews,
      messages: initialMessages,
      passwordResetTokens: initialPasswordResetTokens,
      authError: null,
      theme: "light",
      login: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = password.trim();
        const found = get().users.find((user) => user.email.toLowerCase() === normalizedEmail && user.password === normalizedPassword);

        if (!found) {
          const defaultUser = initialUsers.find((user) => user.email.toLowerCase() === normalizedEmail && user.password === normalizedPassword);
          if (defaultUser) {
            set((state) => ({
              users: state.users.some((user) => user.email.toLowerCase() === normalizedEmail) ? state.users : [...state.users, defaultUser],
              currentUser: defaultUser,
              authError: null,
            }));
            return true;
          }

          set({ authError: "Invalid email or password." });
          return false;
        }

        set({ currentUser: found, authError: null });
        return true;
      },
      signup: (data) => {
        const exists = get().users.some((user) => user.email.toLowerCase() === data.email.toLowerCase());
        if (exists) {
          set({ authError: "An account already exists with that email." });
          return false;
        }
        const user: User = {
          id: createId(),
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          createdAt: new Date().toISOString(),
          favorites: [],
          skills: [],
        };
        set((state) => ({ users: [...state.users, user], currentUser: user, authError: null }));
        return true;
      },
      logout: () => set({ currentUser: null, authError: null }),
      setCurrentUser: (user: User) => set({ currentUser: user, authError: null }),
      changeRole: (nextRole) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        const updatedUser = { ...currentUser, role: nextRole };
        set((state) => ({
          currentUser: updatedUser,
          users: state.users.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
        }));
      },
      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      addLearningRequest: (request) => {
        if (!get().currentUser) return;
        const item: LearningRequest = {
          id: createId(),
          ...request,
          createdAt: new Date().toISOString(),
          userId: get().currentUser!.id,
        };
        set((state) => ({ learningRequests: [item, ...state.learningRequests] }));
      },
      updateLearningRequest: (id, updates) => {
        set((state) => ({
          learningRequests: state.learningRequests.map((request) => (request.id === id ? { ...request, ...updates } : request)),
        }));
      },
      deleteLearningRequest: (id) => {
        set((state) => ({ learningRequests: state.learningRequests.filter((request) => request.id !== id) }));
      },
      addMentorSession: (session) => {
        if (!get().currentUser) return;
        const item: MentorSession = {
          id: createId(),
          ...session,
          status: "Pending",
          createdAt: new Date().toISOString(),
          mentorId: get().currentUser!.id,
        };
        set((state) => ({ mentorSessions: [item, ...state.mentorSessions] }));
      },
      updateMentorSession: (id, updates) => {
        set((state) => ({ mentorSessions: state.mentorSessions.map((session) => (session.id === id ? { ...session, ...updates } : session)) }));
      },
      deleteMentorSession: (id) => {
        set((state) => ({ mentorSessions: state.mentorSessions.filter((session) => session.id !== id) }));
      },
      addAnnouncement: (announcement) => {
        if (!get().currentUser) return;
        const item: Announcement = {
          id: createId(),
          ...announcement,
          createdAt: new Date().toISOString(),
          authorId: get().currentUser!.id,
        };
        set((state) => ({ announcements: [item, ...state.announcements] }));
      },
      updateAnnouncement: (id, updates) => {
        set((state) => ({ announcements: state.announcements.map((item) => (item.id === id ? { ...item, ...updates } : item)) }));
      },
      deleteAnnouncement: (id) => {
        set((state) => ({ announcements: state.announcements.filter((item) => item.id !== id) }));
      },
      addReport: (report) => {
        if (!get().currentUser) return;
        const item: Report = {
          id: createId(),
          ...report,
          createdAt: new Date().toISOString(),
          reporterId: get().currentUser!.id,
        };
        set((state) => ({ reports: [item, ...state.reports] }));
      },
      updateReport: (id, updates) => {
        set((state) => ({ reports: state.reports.map((item) => (item.id === id ? { ...item, ...updates } : item)) }));
      },
      deleteReport: (id) => {
        set((state) => ({ reports: state.reports.filter((item) => item.id !== id) }));
      },
      addBooking: (booking) => {
        if (!get().currentUser) return;
        const item: Booking = {
          id: createId(),
          ...booking,
          status: "Pending",
          createdAt: new Date().toISOString(),
          userId: get().currentUser!.id,
          learnerId: get().currentUser!.id,
        };
        set((state) => ({ bookings: [item, ...state.bookings] }));
      },
      updateBooking: (id, updates) => {
        set((state) => ({ bookings: state.bookings.map((item) => (item.id === id ? { ...item, ...updates } : item)) }));
      },
      deleteBooking: (id) => {
        set((state) => ({ bookings: state.bookings.filter((item) => item.id !== id) }));
      },
      addNotification: (notification) => {
        if (!get().currentUser) return;
        const item: NotificationItem = {
          id: createId(),
          ...notification,
          createdAt: new Date().toISOString(),
          userId: get().currentUser!.id,
        };
        set((state) => ({ notifications: [item, ...state.notifications] }));
      },
      updateNotification: (id, updates) => {
        set((state) => ({ notifications: state.notifications.map((item) => (item.id === id ? { ...item, ...updates } : item)) }));
      },
      deleteNotification: (id) => {
        set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) }));
      },
      addFavoriteMentor: (mentorId) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        const updatedFavorites = Array.from(new Set([...(currentUser.favorites ?? []), mentorId]));
        const updatedUser = { ...currentUser, favorites: updatedFavorites };
        set((state) => ({ currentUser: updatedUser, users: state.users.map((user) => (user.id === updatedUser.id ? updatedUser : user)) }));
      },
      removeFavoriteMentor: (mentorId) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        const updatedFavorites = (currentUser.favorites ?? []).filter((id) => id !== mentorId);
        const updatedUser = { ...currentUser, favorites: updatedFavorites };
        set((state) => ({ currentUser: updatedUser, users: state.users.map((user) => (user.id === updatedUser.id ? updatedUser : user)) }));
      },
      addAvailability: (availability) => {
        if (!get().currentUser) return;
        const item: AvailabilitySlot = {
          id: createId(),
          ...availability,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ availability: [item, ...state.availability] }));
      },
      updateAvailability: (id, updates) => {
        set((state) => ({ availability: state.availability.map((item) => (item.id === id ? { ...item, ...updates } : item)) }));
      },
      deleteAvailability: (id) => {
        set((state) => ({ availability: state.availability.filter((item) => item.id !== id) }));
      },
      requestPasswordReset: (email) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find((item) => item.email.toLowerCase() === normalizedEmail);
        if (!user) return null;
        const token = Math.random().toString(36).slice(2, 10);
        const item: PasswordResetToken = {
          id: createId(),
          email: normalizedEmail,
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        };
        set((state) => ({ passwordResetTokens: [item, ...state.passwordResetTokens], authError: null }));
        return token;
      },
      resetPassword: (token, password) => {
        const normalizedToken = token.trim();
        const tokenEntry = get().passwordResetTokens.find((item) => item.token === normalizedToken);
        if (!tokenEntry || new Date(tokenEntry.expiresAt) < new Date()) {
          set({ authError: "Invalid or expired password reset token." });
          return false;
        }
        set((state) => ({
          users: state.users.map((user) => (user.email.toLowerCase() === tokenEntry.email ? { ...user, password } : user)),
          passwordResetTokens: state.passwordResetTokens.filter((item) => item.token !== normalizedToken),
          authError: null,
        }));
        return true;
      },
      updateUserProfile: (userId, updates) => {
        set((state) => ({
          users: state.users.map((user) => (user.id === userId ? { ...user, ...updates } : user)),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser,
        }));
      },
      addReview: (review) => {
        if (!get().currentUser) return;
        const item: Review = {
          id: createId(),
          ...review,
          createdAt: new Date().toISOString(),
          reported: false,
        };
        set((state) => ({ reviews: [item, ...state.reviews] }));
      },
      reportReview: (reviewId, reason, description) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        const review = get().reviews.find((item) => item.id === reviewId);
        if (!review) return;
        const report: Report = {
          id: createId(),
          title: "Reported review",
          details: `Review flagged for ${reason}`,
          reason,
          description,
          status: "Open",
          createdAt: new Date().toISOString(),
          reporterId: currentUser.id,
          reviewId,
        };
        set((state) => ({ reports: [report, ...state.reports], reviews: state.reviews.map((item) => (item.id === reviewId ? { ...item, reported: true } : item)) }));
      },
      sendMessage: (message) => {
        const item: MessageItem = {
          id: createId(),
          ...message,
          createdAt: new Date().toISOString(),
          read: false,
        };
        set((state) => ({ messages: [item, ...state.messages] }));
      },
      markMessageRead: (id) => {
        set((state) => ({ messages: state.messages.map((item) => (item.id === id ? { ...item, read: true } : item)) }));
      },
    }),
    {
      name: "nexchange-store",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Reset store for old versions
          return {
            users: initialUsers,
            currentUser: null,
            learningRequests: initialLearningRequests,
            mentorSessions: initialMentorSessions,
            announcements: initialAnnouncements,
            reports: initialReports,
            bookings: initialBookings,
            notifications: initialNotifications,
            availability: initialAvailability,
            reviews: initialReviews,
            messages: initialMessages,
            passwordResetTokens: initialPasswordResetTokens,
            authError: null,
            theme: "light",
          };
        }
        return persistedState;
      },
    },
  ),
);
