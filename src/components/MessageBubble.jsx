import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Check, CheckCheck, Download, Play, Pause } from 'lucide-react'

const MessageBubble = ({ message, isOwn, showSender, user }) => {
  const [showTime, setShowTime] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    } catch (error) {
      return ''
    }
  }

  const formatRelativeTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return ''
    }
  }

  const getMessageStatus = () => {
    if (!isOwn) return null
    
    // In a real app, this would check read receipts from the database
    // For now, we'll show delivered status for all sent messages
    return (
      <div className="flex items-center gap-1 ml-2">
        <CheckCheck size={14} className="text-neon-green" />
      </div>
    )
  }

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null

    return (
      <div className="space-y-2 mb-2">
        {message.attachments.map((attachment, index) => {
          const isImage = attachment.file_type?.startsWith('image/')
          const isVideo = attachment.file_type?.startsWith('video/')
          const isAudio = attachment.file_type?.startsWith('audio/')

          if (isImage) {
            return (
              <div key={index} className="relative max-w-xs">
                <img
                  src={attachment.file_url}
                  alt={attachment.file_name}
                  className={`rounded-lg max-w-full h-auto cursor-pointer transition-opacity ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onClick={() => window.open(attachment.file_url, '_blank')}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-dark-bg rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )
          }

          if (isVideo) {
            return (
              <div key={index} className="relative max-w-xs">
                <video
                  src={attachment.file_url}
                  controls
                  className="rounded-lg max-w-full h-auto"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )
          }

          if (isAudio) {
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg max-w-xs">
                <button className="p-2 bg-neon-green text-black rounded-full hover:bg-opacity-90 transition-colors">
                  <Play size={16} />
                </button>
                <div className="flex-1">
                  <p className="text-text-primary text-sm font-medium truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-text-muted text-xs">
                    Audio • {Math.round(attachment.file_size / 1024)}KB
                  </p>
                </div>
              </div>
            )
          }

          // Generic file
          return (
            <div key={index} className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg max-w-xs">
              <div className="p-2 bg-neon-green text-black rounded-full">
                <Download size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">
                  {attachment.file_name}
                </p>
                <p className="text-text-muted text-xs">
                  {Math.round(attachment.file_size / 1024)}KB
                </p>
              </div>
              <button
                onClick={() => window.open(attachment.file_url, '_blank')}
                className="p-1 hover:bg-input-bg rounded transition-colors"
              >
                <Download size={14} className="text-text-secondary" />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Sender name for group chats */}
        {showSender && !isOwn && (
          <div className="text-xs text-neon-green font-medium mb-1 px-3">
            {message.sender?.display_name || 'Unknown'}
          </div>
        )}
        
        {/* Message bubble */}
        <div
          className={`message-bubble px-3 py-2 rounded-lg cursor-pointer transition-all ${
            isOwn
              ? 'bg-message-sent text-text-primary message-sent ml-auto'
              : 'bg-message-received text-text-primary message-received border border-neon-green border-opacity-30'
          } ${showTime ? 'mb-1' : ''}`}
          onClick={() => setShowTime(!showTime)}
        >
          {/* Attachments */}
          {renderAttachments()}
          
          {/* Message content */}
          {message.content && (
            <div className="break-words">
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          )}
          
          {/* Message time and status */}
          <div className={`flex items-center justify-end mt-1 ${
            message.content ? 'mt-2' : ''
          }`}>
            <span className="text-xs text-text-muted">
              {formatTime(message.created_at)}
            </span>
            {getMessageStatus()}
          </div>
        </div>
        
        {/* Expanded time info */}
        {showTime && (
          <div className={`text-xs text-text-muted px-3 py-1 ${
            isOwn ? 'text-right' : 'text-left'
          }`}>
            {formatRelativeTime(message.created_at)}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble

