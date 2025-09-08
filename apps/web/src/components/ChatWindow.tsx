'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageBubble, Avatar, Button } from '@fambase/ui'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { formatLastSeen } from '@fambase/shared'
import type { MessageWithSender } from '@fambase/shared'
import toast from 'react-hot-toast'

export function ChatWindow() {
  const { activeConversation, messages, setMessages, addMessage } = useChatStore()
  const { user } = useAuthStore()
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeConversation) {
      loadMessages()
      subscribeToMessages()
    }
  }, [activeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!activeConversation) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url),
          reactions:message_reactions(*)
        `)
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setMessages(data?.reverse() || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    if (!activeConversation) return

    const channel = supabase
      .channel(`messages:${activeConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversation.id}`
      }, (payload) => {
        const newMessage = payload.new as MessageWithSender
        addMessage(newMessage)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !activeConversation || !user) return

    const messageText = newMessage.trim()
    setNewMessage('')

    try {
      // In a real implementation, encrypt the message here
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          ciphertext: new TextEncoder().encode(messageText), // Simplified - should be encrypted
          content_type: 'text'
        })
        .select()
        .single()

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      setNewMessage(messageText) // Restore message on error
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!activeConversation || !user) return

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Send message with media
      const contentType = file.type.startsWith('image/') ? 'image' : 
                         file.type.startsWith('video/') ? 'video' : 'file'

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          content_type: contentType,
          media_path: filePath,
          media_metadata: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type
          }
        })

      if (messageError) throw messageError
      
      toast.success('File sent successfully')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to send file')
    }
  }

  if (!activeConversation) return null

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              src={activeConversation.avatar_url}
              alt={activeConversation.title || 'Chat'}
              size="md"
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {activeConversation.title || 'Unknown Chat'}
              </h2>
              <p className="text-sm text-gray-500">
                {activeConversation.is_group 
                  ? `${activeConversation.members?.length || 0} members`
                  : 'last seen recently' // In real app, show actual last seen
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto chat-background p-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                showSender={activeConversation.is_group}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex items-end space-x-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />
          </div>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(e)
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  )
}

