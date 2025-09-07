import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Users, Check, CheckCheck } from 'lucide-react'

const ChatList = ({ chats, activeChat, setActiveChat, user, onlineUsers }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = (now - date) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    } catch (error) {
      return ''
    }
  }

  const getChatDisplayInfo = (chat) => {
    if (chat.is_group) {
      return {
        name: chat.name || 'Unnamed Group',
        avatar: null,
        isOnline: false
      }
    } else {
      const otherParticipant = chat.participants?.find(p => p.id !== user.id)
      return {
        name: otherParticipant?.display_name || 'Unknown User',
        avatar: otherParticipant?.avatar_url,
        isOnline: otherParticipant ? onlineUsers.has(otherParticipant.id) : false
      }
    }
  }

  const getLastMessagePreview = (message) => {
    if (!message) return 'No messages yet'
    
    const senderName = message.sender?.display_name || 'Unknown'
    const isOwnMessage = message.sender_id === user.id
    const prefix = isOwnMessage ? 'You: ' : `${senderName}: `
    
    if (message.message_type === 'media') {
      return `${prefix}📎 Media`
    }
    
    return `${prefix}${message.content}`
  }

  const getMessageStatus = (message) => {
    if (!message || message.sender_id !== user.id) return null
    
    // This would typically check read receipts from the database
    // For now, we'll show delivered status
    return <CheckCheck size={16} className="text-text-muted" />
  }

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No chats yet</h3>
          <p className="text-text-secondary text-sm">Start a conversation with your contacts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-2">
        <h3 className="text-sm font-medium text-text-secondary mb-2 px-2">
          Chats ({chats.length})
        </h3>
        
        {chats.map(chat => {
          const { name, avatar, isOnline } = getChatDisplayInfo(chat)
          const isActive = activeChat?.id === chat.id
          
          return (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-neon-green bg-opacity-10 border border-neon-green border-opacity-30' 
                  : 'hover:bg-dark-bg'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-dark-bg rounded-full flex items-center justify-center overflow-hidden">
                  {chat.is_group ? (
                    <Users size={20} className="text-neon-green" />
                  ) : avatar ? (
                    <img 
                      src={avatar} 
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-neon-green font-semibold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Online indicator for 1:1 chats */}
                {!chat.is_group && (
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-sidebar-bg ${
                    isOnline ? 'bg-online' : 'bg-offline'
                  }`}></div>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium truncate ${
                    isActive ? 'text-neon-green' : 'text-text-primary'
                  }`}>
                    {name}
                  </h4>
                  <span className="text-xs text-text-muted flex-shrink-0 ml-2">
                    {formatTime(chat.last_message?.created_at || chat.updated_at)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary truncate flex-1">
                    {getLastMessagePreview(chat.last_message)}
                  </p>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {getMessageStatus(chat.last_message)}
                    
                    {/* Unread count - would be calculated from database */}
                    {/* <div className="w-5 h-5 bg-neon-green rounded-full flex items-center justify-center">
                      <span className="text-xs text-black font-medium">3</span>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ChatList

