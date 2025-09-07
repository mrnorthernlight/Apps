// File upload constants
export const MAX_FILE_SIZE = Infinity // Unlimited
export const MAX_AVATAR_SIZE = Infinity // Unlimited

export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Videos
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/mov',
  'video/wmv',
  
  // Audio
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/webm',
  
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-rar-compressed'
]

export const AVATAR_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  MEDIA: 'media',
  SYSTEM: 'system'
}

// Call types
export const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video'
}

// Call status
export const CALL_STATUS = {
  INITIATED: 'initiated',
  RINGING: 'ringing',
  ANSWERED: 'answered',
  ENDED: 'ended',
  MISSED: 'missed',
  DECLINED: 'declined'
}

// User roles in groups
export const GROUP_ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
  OWNER: 'owner'
}

// Typing indicator timeout
export const TYPING_TIMEOUT = 3000 // 3 seconds

// Online status timeout
export const ONLINE_TIMEOUT = 30000 // 30 seconds

// WebRTC configuration
export const RTC_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
}

// Theme colors (matching tailwind.config.js)
export const THEME_COLORS = {
  NEON_GREEN: '#39ff14',
  DARK_BG: '#1a1a1a',
  DARKER_BG: '#0f0f0f',
  SIDEBAR_BG: '#111111',
  CHAT_BG: '#000000',
  INPUT_BG: '#1f1f1f',
  BORDER_DARK: '#333333',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#b3b3b3',
  TEXT_MUTED: '#666666',
  ONLINE: '#39ff14',
  OFFLINE: '#666666'
}

// Validation constants
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  DISPLAY_NAME_MAX_LENGTH: 50,
  STATUS_MESSAGE_MAX_LENGTH: 150,
  GROUP_NAME_MAX_LENGTH: 100,
  MESSAGE_MAX_LENGTH: 4000
}

// Supabase table names
export const TABLES = {
  USERS: 'users',
  CHATS: 'chats',
  CHAT_PARTICIPANTS: 'chat_participants',
  MESSAGES: 'messages',
  MESSAGE_ATTACHMENTS: 'message_attachments',
  MESSAGE_READS: 'message_reads',
  CALLS: 'calls'
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  MESSAGE_ATTACHMENTS: 'message-attachments'
}

// Realtime channels
export const REALTIME_CHANNELS = {
  MESSAGES: 'messages',
  PRESENCE: 'presence',
  TYPING: 'typing',
  CALLS: 'calls'
}

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'fambase_theme',
  LAST_ACTIVE_CHAT: 'fambase_last_active_chat',
  NOTIFICATION_SETTINGS: 'fambase_notifications'
}

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  FILE_TOO_LARGE: 'File upload failed due to size restrictions.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  MESSAGE_SEND_FAILED: 'Failed to send message. Please try again.',
  CALL_FAILED: 'Call failed to connect. Please try again.',
  PERMISSION_DENIED: 'Permission denied. Please check your browser settings.'
}
