import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiClient } from "./api-client";

export type UserRole = "learner" | "mentor" | "admin" | "manager" | "moderator";

export interface BackendUser {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  society_id?: string;
  role: UserRole;
  is_learner: boolean;
  is_mentor: boolean;
  is_verified: boolean;
  bio?: string;
  profile_picture_url?: string;
  created_at: string;
  token?: string;
}

export interface User extends BackendUser {
  id: string; // Alias for user_id for backward compatibility
}

export interface SkillEntry {
  id: string;
  name: string;
  level: string;
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
  currentUser: User | null;
  authError: string | null;
  isLoading: boolean;
  theme: "light" | "dark";
  
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  registerLearner: (data: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    society_id: string | number;
  }) => Promise<boolean>;
  registerMentor: (data: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    society_id: string | number;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => void;
  clearAuthError: () => void;
  
  // UI actions
  toggleTheme: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      authError: null,
      isLoading: false,
      theme: "light",

      login: async (email: string, password: string) => {
        set({ isLoading: true, authError: null });
        try {
          const response = await apiClient.login(email, password);
          
          if (response.status === "success" && response.data) {
            const user: User = {
              ...response.data,
              id: response.data.user_id,
            };
            set({ currentUser: user, authError: null });
            return true;
          } else {
            set({ authError: response.message || "Login failed" });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || "Login failed";
          set({ authError: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      registerLearner: async (data) => {
        set({ isLoading: true, authError: null });
        try {
          const response = await apiClient.registerLearner(data);
          
          if (response.status === "success" && response.data) {
            const user: User = {
              ...response.data,
              id: response.data.user_id,
            };
            set({ currentUser: user, authError: null });
            return true;
          } else {
            set({ authError: response.message || "Registration failed" });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || "Registration failed";
          set({ authError: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      registerMentor: async (data) => {
        set({ isLoading: true, authError: null });
        try {
          const response = await apiClient.registerMentor(data);
          
          if (response.status === "success" && response.data) {
            const user: User = {
              ...response.data,
              id: response.data.user_id,
            };
            set({ currentUser: user, authError: null });
            return true;
          } else {
            set({ authError: response.message || "Registration failed" });
            return false;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || "Registration failed";
          set({ authError: errorMessage });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.logout();
          set({ currentUser: null, authError: null });
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      checkAuthStatus: () => {
        try {
          const savedUser = localStorage.getItem("currentUser");
          if (savedUser) {
            const user = JSON.parse(savedUser);
            set({ currentUser: user });
          }
        } catch (error) {
          console.error("Error checking auth status:", error);
        }
      },

      clearAuthError: () => set({ authError: null }),

      toggleTheme: () => {
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" }));
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => {
        // Custom storage to persist currentUser
        return {
          getItem: (name: string) => {
            if (typeof window === "undefined") return null;
            const item = localStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          },
          setItem: (name: string, value: any) => {
            if (typeof window === "undefined") return;
            localStorage.setItem(name, JSON.stringify(value));
            // Also save currentUser separately for easy access
            if (value.state?.currentUser) {
              localStorage.setItem("currentUser", JSON.stringify(value.state.currentUser));
            }
          },
          removeItem: (name: string) => {
            if (typeof window === "undefined") return;
            localStorage.removeItem(name);
            localStorage.removeItem("currentUser");
          },
        };
      }),
      partialize: (state) => ({
        currentUser: state.currentUser,
        theme: state.theme,
      }),
    }
  )
);
