import { apiClient } from "../api-client";

export interface SessionBooking {
  session_id: string;
  learner_id: string;
  mentor_id: string;
  skill_id: string;
  availability_id?: string;
  session_mode: "online" | "in-person";
  session_date: string;
  meeting_link?: string;
  location?: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
  learner_note?: string;
  created_at: string;
  updated_at: string;
}

class SessionService {
  async bookSession(data: {
    mentor_id: string | number;
    skill_id: string | number;
    availability_id: string | number;
    session_mode: "online" | "in-person";
    session_date: string;
    meeting_link?: string;
    location?: string;
    learner_note?: string;
  }): Promise<SessionBooking> {
    try {
      const response = await apiClient.bookSession(data);
      if (response.status === "success") {
        return response.data;
      }
      throw new Error(response.message || "Failed to book session");
    } catch (error) {
      console.error("Error booking session:", error);
      throw error;
    }
  }

  async acceptBooking(sessionId: number): Promise<SessionBooking> {
    try {
      const response = await apiClient.acceptBooking(sessionId);
      if (response.status === "success") {
        return response.data;
      }
      throw new Error(response.message || "Failed to accept booking");
    } catch (error) {
      console.error("Error accepting booking:", error);
      throw error;
    }
  }

  async rejectBooking(sessionId: number, reason?: string): Promise<any> {
    try {
      const response = await apiClient.rejectBooking(sessionId, reason);
      return response;
    } catch (error) {
      console.error("Error rejecting booking:", error);
      throw error;
    }
  }

  async cancelBooking(sessionId: number): Promise<any> {
    try {
      const response = await apiClient.cancelBooking(sessionId);
      return response;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  }

  async rescheduleSession(sessionId: number, data: any): Promise<SessionBooking> {
    try {
      const response = await apiClient.rescheduleSession(sessionId, data);
      if (response.status === "success") {
        return response.data;
      }
      throw new Error(response.message || "Failed to reschedule session");
    } catch (error) {
      console.error("Error rescheduling session:", error);
      throw error;
    }
  }

  async getBookingHistory(): Promise<SessionBooking[]> {
    try {
      const response = await apiClient.getBookingHistory();
      return response || [];
    } catch (error) {
      console.error("Error getting booking history:", error);
      throw error;
    }
  }
}

export const sessionService = new SessionService();
