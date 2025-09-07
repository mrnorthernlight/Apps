/**
 * Shared constants for Rupture Chat App
 * Used across web and mobile applications
 */

// App configuration
export const APP_CONFIG = {
  NAME: 'Rupture',
  VERSION: '1.0.0',
  DESCRIPTION: 'A WhatsApp-like chat application',
  AUTHOR: 'mrNorthernLight'
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// Supabase configuration
export const SUPABASE_CONFIG = {
  URL: process.env.REACT_APP_SUPABASE_URL || '',
  ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  REALTIME_CHANNEL: 'rupture-chat'
} as const;

// Theme colors (Dark theme as specified)
export const THEME_COLORS = {
  BACKGROUND: '#121212',
  TEXT: '#EDEDED',
  SENT_BUBBLE: '#075E54',
  RECEIVED_BUBBLE: '#262626',
  PRIMARY: '#075E54',
  SECONDARY: '#128C7E',
  ACCENT: '#25D366',
  BORDER: '#333333',
  INPUT_BACKGROUND: '#1E1E1E',
  HEADER_BACKGROUND: '#1F1F1F',
  ERROR: '#FF6B6B',
  SUCCESS: '#51CF66',
  WARNING: '#FFD43B',
  INFO: '#339AF0'
} as const;

// UI constants
export const UI_CONSTANTS = {
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 20,
    BUBBLE: 18
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32
  },
  FONT_SIZE: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 24,
    XXL: 32
  },
  FONT_WEIGHT: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700'
  },
  SHADOW: {
    SMALL: '0 2px 4px rgba(0, 0, 0, 0.1)',
    MEDIUM: '0 4px 8px rgba(0, 0, 0, 0.15)',
    LARGE: '0 8px 16px rgba(0, 0, 0, 0.2)'
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1050,
    TOOLTIP: 1100,
    NOTIFICATION: 1200
  }
} as const;

// Message constants
export const MESSAGE_CONSTANTS = {
  MAX_LENGTH: 4000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  PAGINATION_LIMIT: 50,
  TYPING_TIMEOUT: 3000, // 3 seconds
  DELIVERY_TIMEOUT: 30000 // 30 seconds
} as const;

// Chat constants
export const CHAT_CONSTANTS = {
  MAX_PARTICIPANTS: 256,
  MAX_GROUP_NAME_LENGTH: 255,
  MIN_GROUP_NAME_LENGTH: 1,
  SEARCH_DEBOUNCE: 300, // milliseconds
  REFRESH_INTERVAL: 30000 // 30 seconds
} as const;

// User constants
export const USER_CONSTANTS = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 6,
  USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ONLINE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  LAST_SEEN_UPDATE_INTERVAL: 60000 // 1 minute
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'rupture_auth_token',
  USER_DATA: 'rupture_user_data',
  THEME_PREFERENCE: 'rupture_theme',
  NOTIFICATION_SETTINGS: 'rupture_notifications',
  CHAT_DRAFTS: 'rupture_chat_drafts',
  LAST_ACTIVE_CHAT: 'rupture_last_active_chat'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed.',
  CHAT_NOT_FOUND: 'Chat not found.',
  MESSAGE_NOT_FOUND: 'Message not found.',
  USER_NOT_FOUND: 'User not found.',
  ALREADY_EXISTS: 'Already exists.',
  RATE_LIMITED: 'Too many requests. Please try again later.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  MESSAGE_SENT: 'Message sent!',
  MESSAGE_UPDATED: 'Message updated!',
  MESSAGE_DELETED: 'Message deleted!',
  CHAT_CREATED: 'Chat created!',
  CHAT_UPDATED: 'Chat updated!',
  CHAT_DELETED: 'Chat deleted!',
  PROFILE_UPDATED: 'Profile updated!',
  FILE_UPLOADED: 'File uploaded successfully!'
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  CHAT_INVITE: 'chat_invite',
  SYSTEM: 'system',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info'
} as const;

// Real-time event types
export const REALTIME_EVENTS = {
  MESSAGE_INSERT: 'message_insert',
  MESSAGE_UPDATE: 'message_update',
  MESSAGE_DELETE: 'message_delete',
  CHAT_INSERT: 'chat_insert',
  CHAT_UPDATE: 'chat_update',
  CHAT_DELETE: 'chat_delete',
  USER_STATUS: 'user_status',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop'
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1440
} as const;

// Media queries
export const MEDIA_QUERIES = {
  MOBILE: `(max-width: ${BREAKPOINTS.MOBILE}px)`,
  TABLET: `(max-width: ${BREAKPOINTS.TABLET}px)`,
  DESKTOP: `(min-width: ${BREAKPOINTS.DESKTOP}px)`,
  LARGE_DESKTOP: `(min-width: ${BREAKPOINTS.LARGE_DESKTOP}px)`
} as const;

// Date and time formats
export const DATE_FORMATS = {
  MESSAGE_TIME: 'HH:mm',
  MESSAGE_DATE: 'MMM dd',
  FULL_DATE: 'MMM dd, yyyy',
  FULL_DATETIME: 'MMM dd, yyyy HH:mm',
  LAST_SEEN: 'last seen MMM dd at HH:mm'
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_]{3,50}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  MENTION: /@([a-zA-Z0-9_]+)/g,
  HASHTAG: /#([a-zA-Z0-9_]+)/g
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_VOICE_MESSAGES: false,
  ENABLE_VIDEO_CALLS: false,
  ENABLE_FILE_SHARING: true,
  ENABLE_MESSAGE_REACTIONS: false,
  ENABLE_MESSAGE_FORWARDING: false,
  ENABLE_CHAT_THEMES: false,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_TYPING_INDICATORS: true,
  ENABLE_READ_RECEIPTS: true,
  ENABLE_ONLINE_STATUS: true
} as const;

// Performance constants
export const PERFORMANCE = {
  VIRTUAL_LIST_ITEM_HEIGHT: 60,
  MESSAGE_BATCH_SIZE: 20,
  IMAGE_LAZY_LOAD_THRESHOLD: 100,
  DEBOUNCE_SEARCH: 300,
  THROTTLE_SCROLL: 100,
  CACHE_TTL: 5 * 60 * 1000 // 5 minutes
} as const;

// Development constants
export const DEV_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG_TOOLS: process.env.NODE_ENV === 'development',
  MOCK_API_DELAY: 500,
  SHOW_PERFORMANCE_METRICS: false
} as const;
