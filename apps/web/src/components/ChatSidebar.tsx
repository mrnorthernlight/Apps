'use client'

import { useState, useEffect } from 'react'
import { Avatar, Button } from '@fambase/ui'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { auth, supabase } from '@/lib/supabase'
import { formatTimestamp } from '@fambase/shared'
import type { ChatListItem } from '@fambase/shared'
import toast from 'react-hot-toast'

export function ChatSidebar() {
  const { user, profile, signOut } = useAuthStore()
  const { conversations, setConversations, setActiveConversation, activeConversation } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_list')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message_sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Avatar 
                src={profile?.avatar_url} 
                alt={profile?.display_name || 'You'}
                size="sm"
              />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Profile Dropdown */}
      {showProfile && (
        <div className="absolute top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-64">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar 
                src={profile?.avatar_url} 
                alt={profile?.display_name || 'You'}
                size="md"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {profile?.display_name || 'Set your name'}
                </div>
                <div className="text-sm text-gray-500">
                  {profile?.about || 'Hey there! I am using FamBase.'}
                </div>
              </div>
            </div>
          </div>
          <div className="p-2">
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
              Profile
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">
              Settings
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 mb-4">Start a new conversation to get started</p>
            <Button size="sm">New Chat</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversation?.id === conversation.id}
                onClick={() => setActiveConversation(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

interface ConversationItemProps {
  conversation: ChatListItem
  isActive: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer hover:bg-gray-50 ${
        isActive ? 'bg-green-50 border-r-2 border-green-500' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <Avatar
          src={conversation.avatar_url}
          alt={conversation.title || 'Chat'}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {conversation.title || 'Unknown Chat'}
            </h3>
            <span className="text-xs text-gray-500">
              {conversation.last_message_at && formatTimestamp(conversation.last_message_at)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-500 truncate">
              {conversation.last_message_type === 'text' 
                ? '[Encrypted Message]' 
                : `${conversation.last_message_type} message`
              }
            </p>
            {conversation.unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-500 rounded-full">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

