import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        this.token = savedToken;
        this.setAuthToken(savedToken);
      }
    }

    // Add response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token on unauthorized
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
  }

  clearAuthToken() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
  }

  // ============= AUTH ENDPOINTS =============
  async registerLearner(data: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    society_id: number | string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async registerMentor(data: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    society_id: number | string;
  }) {
    const response = await this.client.post('/auth/register/mentor', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.data?.token) {
      this.setAuthToken(response.data.data.token);
    }
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthToken();
    }
  }

  async requestPasswordReset(email: string) {
    const response = await this.client.post('/auth/request-password-reset', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await this.client.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  }

  // ============= PROFILE ENDPOINTS =============
  async createLearnerProfile(data: {
    bio?: string;
    profile_picture_url?: string;
  }) {
    const response = await this.client.post('/profile/learner', data);
    return response.data;
  }

  async createMentorProfile(data: {
    bio?: string;
    profile_picture_url?: string;
    expertise?: string;
    years_of_experience?: number;
  }) {
    const response = await this.client.post('/profile/mentor', data);
    return response.data;
  }

  async editProfile(data: any) {
    const response = await this.client.put('/profile', data);
    return response.data;
  }

  async addSkill(data: {
    skill_id: number | string;
    experience_level: string;
    years_of_experience?: number;
    description?: string;
  }) {
    const response = await this.client.post('/profile/skills', data);
    return response.data;
  }

  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('profile_picture', file);
    const response = await this.client.post('/profile/upload-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getLearnerProfile() {
    const response = await this.client.get('/profile/learner');
    return response.data;
  }

  async getMentorProfile(mentorId: string) {
    const response = await this.client.get(`/profile/mentor/${mentorId}`);
    return response.data;
  }

  // ============= MENTOR ENDPOINTS =============
  async searchMentorsBySkill(skill: string) {
    const response = await this.client.get('/mentors/search', {
      params: { skill },
    });
    return response.data;
  }

  async searchMentorsByLocation(location: string) {
    const response = await this.client.get('/mentors/search/location', {
      params: { location },
    });
    return response.data;
  }

  async filterMentors(filters: {
    skill?: string;
    location?: string;
    minimum_rating?: number;
    sort?: string;
    order?: string;
  }) {
    const response = await this.client.get('/mentors/filter', {
      params: filters,
    });
    return response.data;
  }

  async getMentorDetails(mentorId: string) {
    const response = await this.client.get(`/mentors/${mentorId}`);
    return response.data;
  }

  // ============= FAVORITES ENDPOINTS =============
  async addFavoriteMentor(mentorId: string) {
    const response = await this.client.post(`/mentors/${mentorId}/favorite`);
    return response.data;
  }

  async removeFavoriteMentor(mentorId: string) {
    const response = await this.client.delete(`/mentors/${mentorId}/favorite`);
    return response.data;
  }

  async getMyFavorites() {
    const response = await this.client.get('/users/me/favorites');
    return response.data;
  }

  // ============= SESSION/BOOKING ENDPOINTS =============
  async bookSession(data: {
    mentor_id: string | number;
    skill_id: string | number;
    availability_id?: string | number;
    session_mode: 'online' | 'in-person';
    session_date: string;
    meeting_link?: string;
    location?: string;
    learner_note?: string;
  }) {
    const response = await this.client.post('/sessions', data);
    return response.data;
  }

  async acceptBooking(sessionId: number) {
    const response = await this.client.put(`/sessions/${sessionId}/accept`);
    return response.data;
  }

  async rejectBooking(sessionId: number, reason?: string) {
    const response = await this.client.put(`/sessions/${sessionId}/reject`, {
      rejection_reason: reason,
    });
    return response.data;
  }

  async cancelBooking(sessionId: number) {
    const response = await this.client.put(`/sessions/${sessionId}/cancel`);
    return response.data;
  }

  async rescheduleSession(sessionId: number, data: any) {
    const response = await this.client.put(`/sessions/${sessionId}/reschedule`, data);
    return response.data;
  }

  async getBookingHistory() {
    const response = await this.client.get('/sessions/history');
    return response.data;
  }

  // ============= AVAILABILITY ENDPOINTS =============
  async addAvailability(data: {
    day_of_week: string;
    start_time: string;
    end_time: string;
  }) {
    const response = await this.client.post('/availability', data);
    return response.data;
  }

  async editAvailability(availabilityId: string, data: any) {
    const response = await this.client.put(`/availability/${availabilityId}`, data);
    return response.data;
  }

  async deleteAvailability(availabilityId: string) {
    const response = await this.client.delete(`/availability/${availabilityId}`);
    return response.data;
  }

  async getMentorAvailability(mentorId: string) {
    const response = await this.client.get(`/mentors/${mentorId}/availability`);
    return response.data;
  }

  // ============= HEALTH CHECK =============
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
