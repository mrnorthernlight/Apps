'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { ChatSidebar } from '@/components/ChatSidebar'
import { ChatWindow } from '@/components/ChatWindow'
import { WelcomeScreen } from '@/components/WelcomeScreen'

export default function ChatPage() {
  const { user, isLoading } = useAuthStore()
  const { activeConversation } = useChatStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ChatSidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <ChatWindow />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  )
}

