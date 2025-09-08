import { create } from 'zustand'
import type { ChatListItem, MessageWithSender, Conversation } from '@fambase/shared'

interface ChatState {
  conversations: ChatListItem[]
  activeConversation: Conversation | null
  messages: MessageWithSender[]
  isLoading: boolean
  
  // Actions
  setConversations: (conversations: ChatListItem[]) => void
  setActiveConversation: (conversation: Conversation | null) => void
  setMessages: (messages: MessageWithSender[]) => void
  addMessage: (message: MessageWithSender) => void
  updateMessage: (messageId: string, updates: Partial<MessageWithSender>) => void
  setLoading: (loading: boolean) => void
  
  // Typing indicators
  typingUsers: Record<string, string[]>
  setTypingUsers: (conversationId: string, users: string[]) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  typingUsers: {},
  
  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (activeConversation) => set({ 
    activeConversation,
    messages: [] // Clear messages when switching conversations
  }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [message, ...state.messages]
  })),
  
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    )
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setTypingUsers: (conversationId, users) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [conversationId]: users
    }
  }))
}))

