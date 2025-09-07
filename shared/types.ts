/**
 * Shared TypeScript types for Rupture Chat App
 * Used across web and mobile applications
 */

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  profilePicUrl?: string;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
}

export interface UserProfile extends User {
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  profilePicUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// Chat types
export interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  lastSenderUsername?: string;
  unreadCount: number;
  participants?: ChatParticipant[];
  createdBy?: string;
  createdAt?: string;
}

export interface ChatParticipant {
  userId: string;
  username: string;
  profilePicUrl?: string;
  isOnline?: boolean;
  lastSeen?: string;
  isAdmin: boolean;
  joinedAt?: string;
}

export interface CreateChatData {
  participantIds: string[];
  name?: string;
  isGroup?: boolean;
}

// Message types
export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Message {
  id: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  messageType: MessageType;
  replyTo?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    username: string;
    profilePicUrl?: string;
  };
}

export interface SendMessageData {
  content?: string;
  messageType?: MessageType;
  replyTo?: string;
}

export interface MessagePagination {
  page: number;
  limit: number;
  hasMore: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T & {
    pagination?: MessagePagination;
  };
}

// Real-time event types
export interface RealtimeEvent {
  type: 'message' | 'chat' | 'user_status' | 'typing';
  payload: any;
}

export interface MessageEvent extends RealtimeEvent {
  type: 'message';
  payload: {
    action: 'insert' | 'update' | 'delete';
    message: Message;
    chatId: string;
  };
}

export interface ChatEvent extends RealtimeEvent {
  type: 'chat';
  payload: {
    action: 'insert' | 'update' | 'delete';
    chat: Chat;
  };
}

export interface UserStatusEvent extends RealtimeEvent {
  type: 'user_status';
  payload: {
    userId: string;
    isOnline: boolean;
    lastSeen?: string;
  };
}

export interface TypingEvent extends RealtimeEvent {
  type: 'typing';
  payload: {
    chatId: string;
    userId: string;
    username: string;
    isTyping: boolean;
  };
}

// File upload types
export interface FileUploadData {
  file: File | Blob;
  caption?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Theme types
export interface ThemeColors {
  background: string;
  text: string;
  sentBubble: string;
  receivedBubble: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  inputBackground: string;
  headerBackground: string;
}

export interface Theme {
  colors: ThemeColors;
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    fontWeight: {
      normal: string;
      medium: string;
      bold: string;
    };
  };
}

// App state types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  isLoading: boolean;
  error: string | null;
}

// Navigation types (for React Native)
export interface NavigationParams {
  ChatList: undefined;
  Chat: {
    chatId: string;
    chatName: string;
  };
  Profile: undefined;
  Settings: undefined;
  Login: undefined;
  Register: undefined;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface NetworkError extends AppError {
  code: 'NETWORK_ERROR';
  status?: number;
}

export interface ValidationErrors extends AppError {
  code: 'VALIDATION_ERROR';
  errors: ValidationError[];
}

// Search types
export interface UserSearchResult {
  users: User[];
}

export interface SearchParams {
  query: string;
  limit?: number;
}

// Notification types
export interface NotificationData {
  title: string;
  body: string;
  data?: {
    chatId?: string;
    messageId?: string;
    type: 'message' | 'chat_invite' | 'system';
  };
}

// Storage types
export interface StorageKeys {
  AUTH_TOKEN: 'rupture_auth_token';
  USER_DATA: 'rupture_user_data';
  THEME_PREFERENCE: 'rupture_theme';
  NOTIFICATION_SETTINGS: 'rupture_notifications';
}

// Constants
export const STORAGE_KEYS: StorageKeys = {
  AUTH_TOKEN: 'rupture_auth_token',
  USER_DATA: 'rupture_user_data',
  THEME_PREFERENCE: 'rupture_theme',
  NOTIFICATION_SETTINGS: 'rupture_notifications'
};

export const MESSAGE_TYPES: Record<MessageType, MessageType> = {
  text: 'text',
  image: 'image',
  file: 'file',
  system: 'system'
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    SEARCH_USERS: '/api/auth/users/search'
  },
  CHATS: {
    LIST: '/api/chats',
    CREATE: '/api/chats',
    DETAILS: (chatId: string) => `/api/chats/${chatId}`,
    UPDATE: (chatId: string) => `/api/chats/${chatId}`,
    DELETE: (chatId: string) => `/api/chats/${chatId}`,
    ADD_PARTICIPANTS: (chatId: string) => `/api/chats/${chatId}/participants`,
    REMOVE_PARTICIPANT: (chatId: string, userId: string) => `/api/chats/${chatId}/participants/${userId}`
  },
  MESSAGES: {
    LIST: (chatId: string) => `/api/messages/${chatId}`,
    SEND: (chatId: string) => `/api/messages/${chatId}`,
    UPLOAD: (chatId: string) => `/api/messages/${chatId}/upload`,
    UPDATE: (messageId: string) => `/api/messages/${messageId}`,
    DELETE: (messageId: string) => `/api/messages/${messageId}`,
    MARK_READ: (messageId: string) => `/api/messages/${messageId}/read`,
    MARK_ALL_READ: (chatId: string) => `/api/messages/${chatId}/read-all`
  }
} as const;
