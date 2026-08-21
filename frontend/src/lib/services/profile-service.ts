import { apiClient } from "../api-client";

export interface ProfileData {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  bio?: string;
  profile_picture_url?: string;
  location?: string;
  years_of_experience?: number;
  rating?: number;
  reviews_count?: number;
  is_learner: boolean;
  is_mentor: boolean;
  skills?: Array<{
    skill_id: string;
    skill_name: string;
    proficiency_level: string;
    years_of_experience?: number;
  }>;
  availability?: Array<{
    availability_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  }>;
  created_at: string;
  updated_at: string;
}

class ProfileService {
  async createLearnerProfile(data: {
    bio: string;
    profile_picture_url?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.createLearnerProfile(data);
      return response;
    } catch (error) {
      console.error("Error creating learner profile:", error);
      throw error;
    }
  }

  async createMentorProfile(data: {
    bio: string;
    profile_picture_url?: string;
    expertise?: string;
    years_of_experience?: number;
  }): Promise<any> {
    try {
      const response = await apiClient.createMentorProfile(data);
      return response;
    } catch (error) {
      console.error("Error creating mentor profile:", error);
      throw error;
    }
  }

  async editProfile(data: any): Promise<any> {
    try {
      const response = await apiClient.editProfile(data);
      return response;
    } catch (error) {
      console.error("Error editing profile:", error);
      throw error;
    }
  }

  async addSkill(data: {
    skill_id: string | number;
    experience_level: string;
    years_of_experience?: number;
    description?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.addSkill(data);
      return response;
    } catch (error) {
      console.error("Error adding skill:", error);
      throw error;
    }
  }

  async uploadProfilePicture(file: File): Promise<any> {
    try {
      const response = await apiClient.uploadProfilePicture(file);
      return response;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  }

  async getLearnerProfile(): Promise<ProfileData> {
    try {
      const response = await apiClient.getLearnerProfile();
      return response;
    } catch (error) {
      console.error("Error getting learner profile:", error);
      throw error;
    }
  }

  async getMentorProfile(mentorId: string): Promise<ProfileData> {
    try {
      const response = await apiClient.getMentorProfile(mentorId);
      return response;
    } catch (error) {
      console.error("Error getting mentor profile:", error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
