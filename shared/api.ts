/**
 * Shared API client for Rupture Chat App
 * Used across web and mobile applications
 */

import { API_CONFIG, ERROR_MESSAGES } from './constants';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData,
  User,
  Chat,
  Message,
  CreateChatData,
  SendMessageData,
  UserSearchResult,
  SearchParams
} from './types';

// API Client class
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor(baseURL: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Get authentication token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Generic request method
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (this.authToken) {
      defaultHeaders.Authorization = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || this.getErrorMessage(response.status));
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  // Get error message based on status code
  private getErrorMessage(status: number): string {
    switch (status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 429:
        return ERROR_MESSAGES.RATE_LIMITED;
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.NETWORK_ERROR;
    }
  }

  // Authentication endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse['data']>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse['data']>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async searchUsers(params: SearchParams): Promise<ApiResponse<UserSearchResult>> {
    const queryParams = new URLSearchParams({
      q: params.query,
      ...(params.limit && { limit: params.limit.toString() }),
    });

    return this.request(`/api/auth/users/search?${queryParams}`);
  }

  // Chat endpoints
  async getChats(): Promise<ApiResponse<{ chats: Chat[] }>> {
    return this.request('/api/chats');
  }

  async createChat(data: CreateChatData): Promise<ApiResponse<{ chat: Chat }>> {
    return this.request('/api/chats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChatDetails(chatId: string): Promise<ApiResponse<{ chat: Chat }>> {
    return this.request(`/api/chats/${chatId}`);
  }

  async updateChat(chatId: string, data: { name: string }): Promise<ApiResponse<{ chat: Chat }>> {
    return this.request(`/api/chats/${chatId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteChat(chatId: string): Promise<ApiResponse> {
    return this.request(`/api/chats/${chatId}`, {
      method: 'DELETE',
    });
  }

  async addParticipants(chatId: string, userIds: string[]): Promise<ApiResponse> {
    return this.request(`/api/chats/${chatId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  async removeParticipant(chatId: string, userId: string): Promise<ApiResponse> {
    return this.request(`/api/chats/${chatId}/participants/${userId}`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  async getMessages(
    chatId: string,
    page: number = 1,
    limit: number = 50,
    before?: string
  ): Promise<ApiResponse<{ messages: Message[]; pagination: any }>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(before && { before }),
    });

    return this.request(`/api/messages/${chatId}?${queryParams}`);
  }

  async sendMessage(chatId: string, data: SendMessageData): Promise<ApiResponse<{ message: Message }>> {
    return this.request(`/api/messages/${chatId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadFile(chatId: string, file: File | Blob, caption?: string): Promise<ApiResponse<{ message: Message }>> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    return this.request(`/api/messages/${chatId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async updateMessage(messageId: string, content: string): Promise<ApiResponse<{ message: Message }>> {
    return this.request(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId: string): Promise<ApiResponse> {
    return this.request(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async markMessageAsRead(messageId: string): Promise<ApiResponse> {
    return this.request(`/api/messages/${messageId}/read`, {
      method: 'POST',
    });
  }

  async markAllMessagesAsRead(chatId: string): Promise<ApiResponse> {
    return this.request(`/api/messages/${chatId}/read-all`, {
      method: 'POST',
    });
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Utility functions for API calls
export const api = {
  // Authentication
  auth: {
    register: (data: RegisterData) => apiClient.register(data),
    login: (credentials: LoginCredentials) => apiClient.login(credentials),
    logout: () => apiClient.logout(),
    getProfile: () => apiClient.getProfile(),
    updateProfile: (data: Partial<User>) => apiClient.updateProfile(data),
    searchUsers: (params: SearchParams) => apiClient.searchUsers(params),
  },

  // Chats
  chats: {
    list: () => apiClient.getChats(),
    create: (data: CreateChatData) => apiClient.createChat(data),
    get: (chatId: string) => apiClient.getChatDetails(chatId),
    update: (chatId: string, data: { name: string }) => apiClient.updateChat(chatId, data),
    delete: (chatId: string) => apiClient.deleteChat(chatId),
    addParticipants: (chatId: string, userIds: string[]) => apiClient.addParticipants(chatId, userIds),
    removeParticipant: (chatId: string, userId: string) => apiClient.removeParticipant(chatId, userId),
  },

  // Messages
  messages: {
    list: (chatId: string, page?: number, limit?: number, before?: string) => 
      apiClient.getMessages(chatId, page, limit, before),
    send: (chatId: string, data: SendMessageData) => apiClient.sendMessage(chatId, data),
    upload: (chatId: string, file: File | Blob, caption?: string) => 
      apiClient.uploadFile(chatId, file, caption),
    update: (messageId: string, content: string) => apiClient.updateMessage(messageId, content),
    delete: (messageId: string) => apiClient.deleteMessage(messageId),
    markRead: (messageId: string) => apiClient.markMessageAsRead(messageId),
    markAllRead: (chatId: string) => apiClient.markAllMessagesAsRead(chatId),
  },

  // Utility methods
  setAuthToken: (token: string | null) => apiClient.setAuthToken(token),
  getAuthToken: () => apiClient.getAuthToken(),
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return ERROR_MESSAGES.NETWORK_ERROR;
};

// Retry utility for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = API_CONFIG.RETRY_ATTEMPTS,
  delay: number = API_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
};

export default api;
