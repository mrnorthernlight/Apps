import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase client factory
export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: any
): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    ...options,
  })
}

// Phone number utilities
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Add country code if missing (assuming US +1 for demo)
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  return `+${cleaned}`
}

export function hashPhoneNumber(phone: string): string {
  // Simple hash for demo - in production use proper hashing
  const formatted = formatPhoneNumber(phone)
  return btoa(formatted).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

// Time utilities
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

export function formatLastSeen(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) {
    return 'online'
  } else if (diffMinutes < 60) {
    return `last seen ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60)
    return `last seen ${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffMinutes / 1440)
    return `last seen ${days} day${days > 1 ? 's' : ''} ago`
  }
}

// File utilities
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function getFileType(filename: string): 'image' | 'video' | 'audio' | 'document' {
  const ext = getFileExtension(filename)
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return 'image'
  } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
    return 'video'
  } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return 'audio'
  } else {
    return 'document'
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Message utilities
export function generateMessageId(): string {
  return crypto.randomUUID()
}

export function generateConversationId(): string {
  return crypto.randomUUID()
}

// Validation utilities
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Crypto utilities (basic - will be extended in crypto package)
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Error handling
export class FamBaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'FamBaseError'
  }
}

export function handleSupabaseError(error: any): FamBaseError {
  if (error?.code) {
    switch (error.code) {
      case '23505':
        return new FamBaseError('Resource already exists', 'DUPLICATE_RESOURCE', 409)
      case '23503':
        return new FamBaseError('Referenced resource not found', 'FOREIGN_KEY_VIOLATION', 400)
      case 'PGRST116':
        return new FamBaseError('Resource not found', 'NOT_FOUND', 404)
      default:
        return new FamBaseError(error.message || 'Database error', 'DATABASE_ERROR', 500)
    }
  }
  
  return new FamBaseError(error?.message || 'Unknown error', 'UNKNOWN_ERROR', 500)
}

// Constants
export const CONSTANTS = {
  MESSAGE_TYPES: {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    VOICE: 'voice',
    FILE: 'file',
    SYSTEM: 'system'
  } as const,
  
  MESSAGE_STATUS: {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read'
  } as const,
  
  PRESENCE_STATUS: {
    ONLINE: 'online',
    AWAY: 'away',
    OFFLINE: 'offline'
  } as const,
  
  DEVICE_TYPES: {
    PHONE: 'phone',
    DESKTOP: 'desktop',
    WEB: 'web'
  } as const,
  
  CALL_TYPES: {
    OFFER: 'offer',
    ANSWER: 'answer',
    ICE: 'ice',
    HANGUP: 'hangup'
  } as const,
  
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_MESSAGE_LENGTH: 4096,
  STATUS_EXPIRY_HOURS: 24,
  TYPING_TIMEOUT_MS: 3000,
  PRESENCE_TIMEOUT_MS: 30000
} as const

