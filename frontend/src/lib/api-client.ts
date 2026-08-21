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
    const token = response.data?.access_token || response.data?.data?.token || response.data?.token;
    if (token) {
      this.setAuthToken(token);
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
    const response = await this.client.post('/auth/forgot-password', { email });
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
    const response = await this.client.put('/profile/', data);
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

  // Fixed: backend uses PUT /profile/picture with JSON body (not multipart POST)
  async uploadProfilePicture(profilePictureUrl: string) {
    const response = await this.client.put('/profile/picture', {
      profile_picture_url: profilePictureUrl,
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

  async getLearnerProfileById(userId: string | number) {
    const response = await this.client.get(`/profile/learner/${userId}`);
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
    const response = await this.client.post('/sessions/', data);
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
    const response = await this.client.post('/availability/', data);
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

  // Fixed: backend route is /availability/mentor/<id>, not /mentors/<id>/availability
  async getMentorAvailability(mentorId: string) {
    const response = await this.client.get(`/availability/mentor/${mentorId}`);
    return response.data;
  }

  // ============= CHAT ENDPOINTS =============
  async sendChatMessage(data: { receiver_id: number | string; message: string }) {
    const response = await this.client.post('/chat/messages', data);
    return response.data;
  }

  async getReceivedMessages() {
    const response = await this.client.get('/chat/messages');
    return response.data;
  }

  async getUnreadMessages() {
    const response = await this.client.get('/chat/messages/unread');
    return response.data;
  }

  async getReadMessages() {
    const response = await this.client.get('/chat/messages/read');
    return response.data;
  }

  async getConversationInbox(search?: string) {
    const response = await this.client.get('/chat/conversations', {
      params: search ? { search } : undefined,
    });
    return response.data;
  }

  async getConversation(userId: number | string, page = 1, perPage = 20) {
    const response = await this.client.get(`/chat/conversations/${userId}`, {
      params: { page, per_page: perPage },
    });
    return response.data;
  }

  async searchMessages(query: string) {
    const response = await this.client.get('/chat/messages/search', {
      params: { query },
    });
    return response.data;
  }

  async searchConversation(userId: number | string, query: string, page = 1, perPage = 20) {
    const response = await this.client.get(`/chat/conversations/${userId}/search`, {
      params: { query, page, per_page: perPage },
    });
    return response.data;
  }

  async markMessageRead(messageId: number | string) {
    const response = await this.client.patch(`/chat/messages/${messageId}/read`);
    return response.data;
  }

  async markConversationRead(userId: number | string) {
    const response = await this.client.patch(`/chat/conversations/${userId}/read`);
    return response.data;
  }

  // ============= NOTIFICATION ENDPOINTS =============
  async getNotifications() {
    const response = await this.client.get('/notifications/');
    return response.data;
  }

  async markNotificationRead(notificationId: number | string) {
    const response = await this.client.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // ============= REVIEW ENDPOINTS =============
  async submitReview(data: {
    session_id: number | string;
    mentor_id: number | string;
    rating: number;
    review_text?: string;
  }) {
    const response = await this.client.post('/reviews/', data);
    return response.data;
  }

  async getMentorReviews(mentorId: number | string) {
    const response = await this.client.get(`/reviews/mentor/${mentorId}`);
    return response.data;
  }

  async reportReview(reviewId: number | string, data: { reason?: string; description?: string }) {
    const response = await this.client.post(`/reviews/${reviewId}/report`, data);
    return response.data;
  }

  // ============= ADMIN ENDPOINTS =============
  async getAdminUsers(params?: { search?: string; role?: string }) {
    const response = await this.client.get('/admin/users', { params });
    return response.data;
  }

  async getAdminUserDetails(userId: number | string) {
    const response = await this.client.get(`/admin/users/${userId}`);
    return response.data;
  }

  async suspendUser(userId: number | string, isSuspended: boolean) {
    const response = await this.client.patch(`/admin/users/${userId}/suspend`, {
      is_suspended: isSuspended,
    });
    return response.data;
  }

  async verifyMentor(userId: number | string, isVerified: boolean) {
    const response = await this.client.patch(`/admin/mentors/${userId}/verify`, {
      is_verified: isVerified,
    });
    return response.data;
  }

  async getAdminReports(params?: { status?: string }) {
    const response = await this.client.get('/admin/reports', { params });
    return response.data;
  }

  async getAdminReportDetails(reportId: number | string) {
    const response = await this.client.get(`/admin/reports/${reportId}`);
    return response.data;
  }

  async resolveReport(reportId: number | string, data?: { description?: string }) {
    const response = await this.client.patch(`/admin/reports/${reportId}/resolve`, data ?? {});
    return response.data;
  }

  async dismissReport(reportId: number | string, data?: { description?: string }) {
    const response = await this.client.patch(`/admin/reports/${reportId}/dismiss`, data ?? {});
    return response.data;
  }

  async getPlatformActivity() {
    const response = await this.client.get('/admin/activity');
    return response.data;
  }

  // ============= HEALTH CHECK =============
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
