import { z } from 'zod'

// User types
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  phone: z.string().optional(),
  phone_hash: z.string().optional(),
  display_name: z.string().optional(),
  avatar_url: z.string().optional(),
  about: z.string().optional(),
  created_at: z.string(),
  last_seen: z.string().optional(),
  is_deleted: z.boolean().default(false)
})

export type Profile = z.infer<typeof ProfileSchema>

// Message types
export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  ciphertext: z.instanceof(Uint8Array).optional(),
  content_type: z.enum(['text', 'image', 'video', 'voice', 'file', 'system']).default('text'),
  media_path: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  reply_to: z.string().uuid().optional(),
  status: z.enum(['sent', 'delivered', 'read']).default('sent'),
  server_timestamp: z.string(),
  created_at: z.string()
})

export type Message = z.infer<typeof MessageSchema>

// Conversation types
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  is_group: z.boolean().default(false),
  title: z.string().optional(),
  avatar_url: z.string().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string(),
  last_message_at: z.string().optional(),
  disappearing_seconds: z.number().optional(),
  invite_link: z.string().optional()
})

export type Conversation = z.infer<typeof ConversationSchema>

// Conversation member types
export const ConversationMemberSchema = z.object({
  conversation_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_admin: z.boolean().default(false),
  joined_at: z.string(),
  muted_until: z.string().optional(),
  pin_order: z.number().optional()
})

export type ConversationMember = z.infer<typeof ConversationMemberSchema>

// Device types
export const DeviceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  device_name: z.string().optional(),
  device_type: z.enum(['phone', 'desktop', 'web']),
  public_identity_key: z.string(),
  public_prekeys: z.record(z.any()),
  last_seen: z.string(),
  push_token: z.string().optional(),
  created_at: z.string()
})

export type Device = z.infer<typeof DeviceSchema>

// Typing status
export const TypingStatusSchema = z.object({
  conversation_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_typing: z.boolean().default(false),
  updated_at: z.string()
})

export type TypingStatus = z.infer<typeof TypingStatusSchema>

// Presence
export const PresenceSchema = z.object({
  user_id: z.string().uuid(),
  last_heartbeat: z.string(),
  status: z.enum(['online', 'away', 'offline']).default('offline')
})

export type Presence = z.infer<typeof PresenceSchema>

// Call signal types
export const CallSignalSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  from_user: z.string().uuid(),
  to_user: z.string().uuid(),
  type: z.enum(['offer', 'answer', 'ice', 'hangup']),
  payload: z.record(z.any()),
  created_at: z.string()
})

export type CallSignal = z.infer<typeof CallSignalSchema>

// Status/Story types
export const StatusSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  media_path: z.string().optional(),
  caption: z.string().optional(),
  created_at: z.string(),
  expires_at: z.string()
})

export type Status = z.infer<typeof StatusSchema>

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

// Realtime event types
export interface RealtimeEvent<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: T
  old_record?: T
}

// Encryption types
export interface EncryptedMessage {
  ciphertext: Uint8Array
  ephemeralKey: string
  mac: string
}

export interface DeviceBundle {
  identityKey: string
  preKeys: Array<{
    keyId: number
    publicKey: string
  }>
  signedPreKey: {
    keyId: number
    publicKey: string
    signature: string
  }
}

// WebRTC types
export interface RTCConfiguration {
  iceServers: RTCIceServer[]
}

export interface CallState {
  isInCall: boolean
  isVideoCall: boolean
  isMuted: boolean
  isVideoEnabled: boolean
  callStartTime?: Date
  participants: string[]
}

// Chat UI types
export interface ChatListItem extends Conversation {
  lastMessage?: Message
  unreadCount: number
  isPinned: boolean
  members?: ConversationMember[]
}

export interface MessageWithSender extends Message {
  sender?: Profile
  reactions?: Array<{
    user_id: string
    reaction: string
    user?: Profile
  }>
}

// Settings types
export interface UserSettings {
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody'
    readReceipts: boolean
    profilePhoto: 'everyone' | 'contacts' | 'nobody'
    about: 'everyone' | 'contacts' | 'nobody'
  }
  notifications: {
    messageNotifications: boolean
    groupNotifications: boolean
    callNotifications: boolean
    soundEnabled: boolean
  }
  chat: {
    autoDownloadMedia: boolean
    defaultDisappearingMessages: number | null
    fontSize: 'small' | 'medium' | 'large'
  }
  security: {
    twoFactorEnabled: boolean
    backupEnabled: boolean
  }
}

// Contact types
export const ContactSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  contact_phone: z.string(),
  contact_user_id: z.string().uuid().optional(),
  name_hint: z.string().optional(),
  added_at: z.string()
})

export type Contact = z.infer<typeof ContactSchema>

// Export all schemas for validation
export const Schemas = {
  Profile: ProfileSchema,
  Message: MessageSchema,
  Conversation: ConversationSchema,
  ConversationMember: ConversationMemberSchema,
  Device: DeviceSchema,
  TypingStatus: TypingStatusSchema,
  Presence: PresenceSchema,
  CallSignal: CallSignalSchema,
  Status: StatusSchema,
  Contact: ContactSchema
}

