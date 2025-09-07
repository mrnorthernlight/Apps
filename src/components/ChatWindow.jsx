import React, { useState, useEffect, useRef } from 'react'
import { Phone, Video, MoreVertical, Users, ArrowLeft } from 'lucide-react'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

const ChatWindow = ({ 
  chat, 
  messages, 
  user, 
  onSendMessage, 
  onSendTyping, 
  typingUsers,
  onStartCall 
}) => {
  const [showChatInfo, setShowChatInfo] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getChatDisplayInfo = () => {
    if (chat.is_group) {
      return {
        name: chat.name || 'Unnamed Group',
        subtitle: `${chat.participants?.length || 0} members`,
        avatar: null,
        canCall: false // Group calls would need special handling
      }
    } else {
      const otherParticipant = chat.participants?.find(p => p.id !== user.id)
      return {
        name: otherParticipant?.display_name || 'Unknown User',
        subtitle: otherParticipant?.is_online ? 'Online' : 
          otherParticipant?.last_seen ? `Last seen ${new Date(otherParticipant.last_seen).toLocaleString()}` : 'Offline',
        avatar: otherParticipant?.avatar_url,
        canCall: true,
        contactId: otherParticipant?.id
      }
    }
  }

  const { name, subtitle, avatar, canCall, contactId } = getChatDisplayInfo()

  const getTypingIndicator = () => {
    if (typingUsers.size === 0) return null
    
    const typingUsersList = Array.from(typingUsers)
    if (typingUsersList.length === 1) {
      return (
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="w-8 h-8 bg-dark-bg rounded-full flex items-center justify-center">
            <span className="text-neon-green text-xs font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-text-secondary text-sm">{name} is typing</span>
            <div className="typing-indicator ml-2">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="w-8 h-8 bg-dark-bg rounded-full flex items-center justify-center">
            <Users size={16} className="text-neon-green" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-text-secondary text-sm">Multiple people are typing</span>
            <div className="typing-indicator ml-2">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-chat-bg">
      {/* Header */}
      <div className="bg-sidebar-bg border-b border-border-dark p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile back button */}
          <button className="md:hidden p-2 hover:bg-dark-bg rounded-full transition-colors">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          
          {/* Avatar */}
          <div className="w-10 h-10 bg-dark-bg rounded-full flex items-center justify-center overflow-hidden">
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
          
          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{name}</h3>
            <p className="text-sm text-text-secondary truncate">{subtitle}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canCall && contactId && (
            <>
              <button
                onClick={() => onStartCall(contactId, 'audio')}
                className="p-2 hover:bg-dark-bg rounded-full transition-colors"
                title="Audio Call"
              >
                <Phone size={20} className="text-text-secondary hover:text-neon-green" />
              </button>
              <button
                onClick={() => onStartCall(contactId, 'video')}
                className="p-2 hover:bg-dark-bg rounded-full transition-colors"
                title="Video Call"
              >
                <Video size={20} className="text-text-secondary hover:text-neon-green" />
              </button>
            </>
          )}
          
          <button
            onClick={() => setShowChatInfo(!showChatInfo)}
            className="p-2 hover:bg-dark-bg rounded-full transition-colors"
            title="Chat Info"
          >
            <MoreVertical size={20} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">Start the conversation</h3>
              <p className="text-text-secondary">Send a message to begin chatting</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1]
              const showSender = !prevMessage || 
                prevMessage.sender_id !== message.sender_id ||
                (new Date(message.created_at) - new Date(prevMessage.created_at)) > 300000 // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user.id}
                  showSender={showSender && chat.is_group}
                  user={user}
                />
              )
            })}
            
            {/* Typing Indicator */}
            {getTypingIndicator()}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onSendTyping}
        disabled={false}
      />

      {/* Chat Info Sidebar */}
      {showChatInfo && (
        <div className="fixed inset-y-0 right-0 w-80 bg-sidebar-bg border-l border-border-dark z-10 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">Chat Info</h3>
              <button
                onClick={() => setShowChatInfo(false)}
                className="p-2 hover:bg-dark-bg rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* Chat Avatar and Name */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
                {chat.is_group ? (
                  <Users size={32} className="text-neon-green" />
                ) : avatar ? (
                  <img 
                    src={avatar} 
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-neon-green text-2xl font-semibold">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h4 className="text-xl font-semibold text-text-primary">{name}</h4>
              <p className="text-text-secondary">{subtitle}</p>
            </div>

            {/* Group Members or Contact Info */}
            {chat.is_group ? (
              <div>
                <h5 className="text-sm font-medium text-text-secondary mb-3">
                  Members ({chat.participants?.length || 0})
                </h5>
                <div className="space-y-2">
                  {chat.participants?.map(participant => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg">
                      <div className="w-10 h-10 bg-dark-bg rounded-full flex items-center justify-center overflow-hidden">
                        {participant.avatar_url ? (
                          <img 
                            src={participant.avatar_url} 
                            alt={participant.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-neon-green font-semibold">
                            {participant.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-text-primary font-medium">
                          {participant.display_name}
                          {participant.id === user.id && ' (You)'}
                        </p>
                        <p className="text-sm text-text-secondary">@{participant.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-text-secondary mb-2">About</h5>
                  <p className="text-text-primary">
                    {chat.participants?.find(p => p.id !== user.id)?.status_message || 'No status message'}
                  </p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-text-secondary mb-2">Username</h5>
                  <p className="text-text-primary">
                    @{chat.participants?.find(p => p.id !== user.id)?.username || 'unknown'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatWindow

