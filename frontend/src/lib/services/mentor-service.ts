import { apiClient } from "../api-client";

export interface MentorData {
  user_id: string;
  full_name: string;
  email: string;
  bio?: string;
  profile_picture_url?: string;
  rating?: number;
  reviews_count?: number;
  location?: string;
  skills?: Array<{
    skill_id: string;
    skill_name: string;
    proficiency_level: string;
  }>;
  years_of_experience?: number;
  society_id?: string;
  is_verified?: boolean;
}

class MentorService {
  async searchBySkill(skill: string): Promise<MentorData[]> {
    try {
      const response = await apiClient.searchMentorsBySkill(skill);
      return response || [];
    } catch (error) {
      console.error("Error searching mentors by skill:", error);
      throw error;
    }
  }

  async searchByLocation(location: string): Promise<MentorData[]> {
    try {
      const response = await apiClient.searchMentorsByLocation(location);
      return response || [];
    } catch (error) {
      console.error("Error searching mentors by location:", error);
      throw error;
    }
  }

  async filter(filters: {
    skill?: string;
    location?: string;
    minimum_rating?: number;
    sort?: string;
    order?: string;
  }): Promise<MentorData[]> {
    try {
      const response = await apiClient.filterMentors(filters);
      return response || [];
    } catch (error) {
      console.error("Error filtering mentors:", error);
      throw error;
    }
  }

  async getDetails(mentorId: string): Promise<MentorData> {
    try {
      const response = await apiClient.getMentorDetails(mentorId);
      return response;
    } catch (error) {
      console.error("Error getting mentor details:", error);
      throw error;
    }
  }

  async addToFavorites(mentorId: string): Promise<any> {
    try {
      const response = await apiClient.addFavoriteMentor(mentorId);
      return response;
    } catch (error) {
      console.error("Error adding mentor to favorites:", error);
      throw error;
    }
  }

  async removeFromFavorites(mentorId: string): Promise<any> {
    try {
      const response = await apiClient.removeFavoriteMentor(mentorId);
      return response;
    } catch (error) {
      console.error("Error removing mentor from favorites:", error);
      throw error;
    }
  }

  async getMyFavorites(): Promise<MentorData[]> {
    try {
      const response = await apiClient.getMyFavorites();
      return response || [];
    } catch (error) {
      console.error("Error getting favorites:", error);
      throw error;
    }
  }

  async getAvailability(mentorId: string): Promise<any[]> {
    try {
      const response = await apiClient.getMentorAvailability(mentorId);
      return response || [];
    } catch (error) {
      console.error("Error getting mentor availability:", error);
      throw error;
    }
  }
}

export const mentorService = new MentorService();
