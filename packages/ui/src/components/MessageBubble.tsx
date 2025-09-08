import React from 'react'
import clsx from 'clsx'
import { formatTimestamp } from '@fambase/shared'
import type { MessageWithSender } from '@fambase/shared'

interface MessageBubbleProps {
  message: MessageWithSender
  isOwn: boolean
  showSender?: boolean
  showTimestamp?: boolean
  onReact?: (messageId: string, reaction: string) => void
  onReply?: (message: MessageWithSender) => void
}

export function MessageBubble({
  message,
  isOwn,
  showSender = false,
  showTimestamp = true,
  onReact,
  onReply
}: MessageBubbleProps) {
  const handleReaction = (reaction: string) => {
    onReact?.(message.id, reaction)
  }

  const renderContent = () => {
    switch (message.content_type) {
      case 'text':
        return (
          <div className="text-sm">
            {/* In real implementation, decrypt ciphertext here */}
            {message.ciphertext ? '[Encrypted Message]' : 'Message content'}
          </div>
        )
      
      case 'image':
        return (
          <div className="rounded-lg overflow-hidden max-w-xs">
            <img 
              src={message.media_path} 
              alt="Shared image"
              className="w-full h-auto"
            />
          </div>
        )
      
      case 'voice':
        return (
          <div className="flex items-center space-x-2 py-2">
            <button className="p-2 rounded-full bg-green-100 hover:bg-green-200">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex-1 h-8 bg-gray-200 rounded-full relative">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '30%' }} />
            </div>
            <span className="text-xs text-gray-500">0:15</span>
          </div>
        )
      
      default:
        return (
          <div className="text-sm text-gray-600">
            Unsupported message type: {message.content_type}
          </div>
        )
    }
  }

  return (
    <div className={clsx(
      'flex mb-4',
      isOwn ? 'justify-end' : 'justify-start'
    )}>
      <div className={clsx(
        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
        isOwn 
          ? 'bg-green-500 text-white' 
          : 'bg-white border border-gray-200'
      )}>
        {showSender && !isOwn && (
          <div className="text-xs font-medium text-gray-600 mb-1">
            {message.sender?.display_name || 'Unknown'}
          </div>
        )}
        
        {message.reply_to && (
          <div className={clsx(
            'text-xs p-2 rounded mb-2 border-l-2',
            isOwn 
              ? 'bg-green-400 border-green-300' 
              : 'bg-gray-50 border-gray-300'
          )}>
            Replying to message...
          </div>
        )}

        {renderContent()}

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-100 rounded-full px-2 py-1"
              >
                {reaction.reaction}
              </span>
            ))}
          </div>
        )}

        {showTimestamp && (
          <div className={clsx(
            'text-xs mt-1 flex items-center justify-end space-x-1',
            isOwn ? 'text-green-100' : 'text-gray-500'
          )}>
            <span>{formatTimestamp(message.created_at)}</span>
            {isOwn && (
              <div className="flex space-x-1">
                {message.status === 'sent' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {message.status === 'delivered' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {message.status === 'read' && (
                  <div className="flex">
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <svg className="w-3 h-3 text-blue-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

