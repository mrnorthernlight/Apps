// User roles in the system
export type UserRole = 'student' | 'teacher' | 'admin'

// User profile interface
export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Class interface
export interface Class {
  id: string
  name: string
  description?: string
  teacher_id: string
  teacher?: UserProfile
  created_at: string
  updated_at: string
}

// Channel types
export type ChannelType = 'text' | 'voice' | 'video'

// Channel interface
export interface Channel {
  id: string
  class_id: string
  name: string
  type: ChannelType
  description?: string
  created_at: string
  updated_at: string
}

// Message interface
export interface Message {
  id: string
  channel_id?: string
  dm_chat_id?: string
  sender_id: string
  sender?: UserProfile
  content: string
  media_url?: string
  parent_message_id?: string
  created_at: string
  updated_at: string
}

// Assignment interface
export interface Assignment {
  id: string
  class_id: string
  title: string
  description: string
  due_date: string
  file_url?: string
  created_at: string
  updated_at: string
}

// Submission interface
export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  student?: UserProfile
  file_url?: string
  content?: string
  submitted_at: string
  grade?: number
  feedback?: string
  graded_at?: string
}

// File interface
export interface FileRecord {
  id: string
  uploader_id: string
  uploader?: UserProfile
  class_id?: string
  channel_id?: string
  file_name: string
  file_type: string
  file_url: string
  file_size: number
  uploaded_at: string
}

// Call types
export type CallType = 'voice' | 'video'
export type ChatType = '1:1' | 'group'

// Call interface
export interface Call {
  id: string
  chat_type: ChatType
  channel_id?: string
  dm_chat_id?: string
  host_id: string
  host?: UserProfile
  type: CallType
  started_at: string
  ended_at?: string
  recording_url?: string
}

// Direct message chat interface
export interface DMChat {
  id: string
  user1_id: string
  user2_id: string
  user1?: UserProfile
  user2?: UserProfile
  created_at: string
  updated_at: string
}

// Class membership interface
export interface ClassMember {
  user_id: string
  class_id: string
  user?: UserProfile
  class?: Class
  joined_at: string
}

// Notification interface
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'assignment' | 'message' | 'call' | 'grade' | 'announcement'
  read: boolean
  data?: Record<string, any>
  created_at: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined
}

// Theme colors
export const THEME_COLORS = {
  primary: '#4FC3F7',      // Sky Blue
  accent: {
    yellow: '#FFEB3B',     // Sunshine Yellow
    green: '#8BC34A',      // Grass Green
    orange: '#FF7043',     // Coral Orange
  },
  neutral: {
    light: '#F5F5F5',      // Light Grey
    white: '#FFFFFF',      // White
    dark: '#263238',       // Chalkboard Dark
    text: '#333333',       // Dark Grey text
  }
} as const
