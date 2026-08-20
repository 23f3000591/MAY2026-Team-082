import { apiClient } from "../api-client";

export interface AvailabilitySlot {
  availability_id: string;
  mentor_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at?: string;
}

class AvailabilityService {
  async addAvailability(data: {
    day_of_week: string;
    start_time: string;
    end_time: string;
  }): Promise<AvailabilitySlot> {
    try {
      const response = await apiClient.addAvailability(data);
      if (response.status === "success") {
        return response.data;
      }
      throw new Error(response.message || "Failed to add availability");
    } catch (error) {
      console.error("Error adding availability:", error);
      throw error;
    }
  }

  async editAvailability(availabilityId: string, data: any): Promise<AvailabilitySlot> {
    try {
      const response = await apiClient.editAvailability(availabilityId, data);
      if (response.status === "success") {
        return response.data;
      }
      throw new Error(response.message || "Failed to edit availability");
    } catch (error) {
      console.error("Error editing availability:", error);
      throw error;
    }
  }

  async deleteAvailability(availabilityId: string): Promise<any> {
    try {
      const response = await apiClient.deleteAvailability(availabilityId);
      return response;
    } catch (error) {
      console.error("Error deleting availability:", error);
      throw error;
    }
  }

  async getMentorAvailability(mentorId: string): Promise<AvailabilitySlot[]> {
    try {
      const response = await apiClient.getMentorAvailability(mentorId);
      return response || [];
    } catch (error) {
      console.error("Error getting mentor availability:", error);
      throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
