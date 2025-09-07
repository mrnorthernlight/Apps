/**
 * Shared utility functions for Rupture Chat App
 * Used across web and mobile applications
 */

import { DATE_FORMATS, STORAGE_KEYS, REGEX_PATTERNS } from './constants';
import { User, Message, Chat } from './types';

// Date and time utilities
export const formatDate = (date: string | Date, format: string = DATE_FORMATS.FULL_DATE): string => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Return relative time for recent messages
  if (format === DATE_FORMATS.MESSAGE_TIME) {
    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  // Format based on specified format
  switch (format) {
    case DATE_FORMATS.MESSAGE_DATE:
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    case DATE_FORMATS.FULL_DATETIME:
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case DATE_FORMATS.LAST_SEEN:
      return `last seen ${d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })} at ${d.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`;
    default:
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
  }
};

export const getRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};

export const isToday = (date: string | Date): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isYesterday = (date: string | Date): boolean => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};

// String utilities
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const generateInitials = (name: string): string => {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  return REGEX_PATTERNS.EMAIL.test(email);
};

export const validateUsername = (username: string): boolean => {
  return REGEX_PATTERNS.USERNAME.test(username);
};

export const validateUrl = (url: string): boolean => {
  return REGEX_PATTERNS.URL.test(url);
};

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(extension);
};

export const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const extension = getFileExtension(originalName);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${userId}_${timestamp}_${randomString}.${extension}`;
};

// Array utilities
export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

// Object utilities
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Storage utilities (works for both localStorage and AsyncStorage)
export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment
        localStorage.setItem(key, serializedValue);
      } else {
        // React Native environment - would need AsyncStorage
        // This is a placeholder - actual implementation would use AsyncStorage
        console.warn('Storage not available in this environment');
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  async getItem(key: string): Promise<any> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } else {
        // React Native environment - would need AsyncStorage
        console.warn('Storage not available in this environment');
        return null;
      }
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment
        localStorage.removeItem(key);
      } else {
        // React Native environment - would need AsyncStorage
        console.warn('Storage not available in this environment');
      }
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment
        localStorage.clear();
      } else {
        // React Native environment - would need AsyncStorage
        console.warn('Storage not available in this environment');
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};

// Chat utilities
export const getChatDisplayName = (chat: Chat, currentUserId: string): string => {
  if (chat.isGroup) {
    return chat.name || 'Group Chat';
  }
  
  // For 1:1 chats, find the other participant
  const otherParticipant = chat.participants?.find(p => p.userId !== currentUserId);
  return otherParticipant?.username || 'Unknown User';
};

export const getChatAvatar = (chat: Chat, currentUserId: string): string | undefined => {
  if (chat.isGroup) {
    return undefined; // Group chats might have their own avatar logic
  }
  
  // For 1:1 chats, use the other participant's avatar
  const otherParticipant = chat.participants?.find(p => p.userId !== currentUserId);
  return otherParticipant?.profilePicUrl;
};

export const getLastMessagePreview = (message: string | undefined, messageType: string = 'text'): string => {
  if (!message) return 'No messages yet';
  
  switch (messageType) {
    case 'image':
      return '📷 Photo';
    case 'file':
      return '📎 File';
    case 'system':
      return message;
    default:
      return truncateText(message, 50);
  }
};

// Message utilities
export const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
  return groupBy(messages, (message) => {
    const date = new Date(message.createdAt);
    return date.toDateString();
  } as any);
};

export const isConsecutiveMessage = (
  currentMessage: Message,
  previousMessage: Message | null,
  timeThreshold: number = 5 * 60 * 1000 // 5 minutes
): boolean => {
  if (!previousMessage) return false;
  
  const timeDiff = new Date(currentMessage.createdAt).getTime() - new Date(previousMessage.createdAt).getTime();
  return (
    currentMessage.sender.id === previousMessage.sender.id &&
    timeDiff < timeThreshold
  );
};

// User utilities
export const getUserDisplayName = (user: User): string => {
  return user.username || user.email.split('@')[0] || 'Unknown User';
};

export const getUserInitials = (user: User): string => {
  return generateInitials(getUserDisplayName(user));
};

export const isUserOnline = (user: User): boolean => {
  if (!user.isOnline) return false;
  
  // Consider user offline if last seen is more than 5 minutes ago
  if (user.lastSeen) {
    const lastSeenTime = new Date(user.lastSeen).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - lastSeenTime) < fiveMinutes;
  }
  
  return user.isOnline;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Random utilities
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const generateColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Platform detection
export const isWeb = (): boolean => {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
};

export const isMobile = (): boolean => {
  return !isWeb() || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Error utilities
export const createError = (message: string, code?: string, details?: any) => {
  const error = new Error(message) as any;
  if (code) error.code = code;
  if (details) error.details = details;
  return error;
};

export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || 
         error?.message?.includes('network') ||
         error?.message?.includes('fetch');
};

// URL utilities
export const buildUrl = (base: string, path: string, params?: Record<string, string>): string => {
  const url = new URL(path, base);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
};

export const parseUrl = (url: string): { pathname: string; search: string; hash: string } => {
  try {
    const parsed = new URL(url);
    return {
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash
    };
  } catch {
    return { pathname: '', search: '', hash: '' };
  }
};

export default {
  formatDate,
  getRelativeTime,
  isToday,
  isYesterday,
  truncateText,
  capitalizeFirst,
  generateInitials,
  sanitizeInput,
  validateEmail,
  validateUsername,
  validateUrl,
  formatFileSize,
  getFileExtension,
  isImageFile,
  generateFileName,
  uniqueBy,
  sortBy,
  groupBy,
  deepClone,
  omit,
  pick,
  storage,
  getChatDisplayName,
  getChatAvatar,
  getLastMessagePreview,
  groupMessagesByDate,
  isConsecutiveMessage,
  getUserDisplayName,
  getUserInitials,
  isUserOnline,
  debounce,
  throttle,
  generateId,
  generateColor,
  isWeb,
  isMobile,
  createError,
  isNetworkError,
  buildUrl,
  parseUrl
};
