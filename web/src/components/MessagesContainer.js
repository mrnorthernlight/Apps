import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Image, 
  MoreVertical,
  Phone,
  Video,
  Users
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import MessageInput from './MessageInput';

const MessagesContainer = ({ chat, messages, loading, onSendMessage, currentUser }) => {
  const messagesEndRef = useRef(null);
  const [showChatInfo, setShowChatInfo] = useState(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM dd, yyyy');
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-header">
          <div className="messages-info">
            <div className="messages-avatar">
              {chat.is_group ? <Users size={20} /> : getInitials(chat.name)}
            </div>
            <div>
              <div className="messages-name">{chat.name}</div>
              <div className="messages-status">Loading...</div>
            </div>
          </div>
        </div>
        
        <div className="messages-list" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {/* Header */}
      <div className="messages-header">
        <div className="messages-info">
          <div className="messages-avatar">
            {chat.is_group ? <Users size={20} /> : getInitials(chat.name)}
          </div>
          <div>
            <div className="messages-name">{chat.name}</div>
            <div className="messages-status">
              {chat.is_group 
                ? `${chat.participant_count || 0} members`
                : 'Online' // TODO: Show actual online status
              }
            </div>
          </div>
        </div>
        
        <div className="messages-actions">
          <motion.button
            className="icon-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Voice Call"
          >
            <Phone size={20} />
          </motion.button>
          
          <motion.button
            className="icon-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Video Call"
          >
            <Video size={20} />
          </motion.button>
          
          <motion.button
            className="icon-button"
            onClick={() => setShowChatInfo(!showChatInfo)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Chat Info"
          >
            <MoreVertical size={20} />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-list">
        {Object.keys(groupedMessages).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <div className="messages-avatar" style={{ 
              width: '80px', 
              height: '80px', 
              fontSize: '32px',
              marginBottom: '16px',
              opacity: 0.5
            }}>
              {chat.is_group ? <Users size={40} /> : getInitials(chat.name)}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Start the conversation
            </div>
            <div style={{ fontSize: '14px' }}>
              Send a message to {chat.name}
            </div>
          </motion.div>
        ) : (
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                color: 'var(--text-muted)',
                fontSize: '14px'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ padding: '0 16px' }}>
                  {formatDateSeparator(dayMessages[0].created_at)}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              </div>

              {/* Messages for this date */}
              {dayMessages.map((message, index) => {
                const isOwn = message.sender_id === currentUser.id;
                const showAvatar = !isOwn && (
                  index === 0 || 
                  dayMessages[index - 1].sender_id !== message.sender_id
                );

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`message-group ${isOwn ? 'sent' : 'received'}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                      {!isOwn && (
                        <div style={{ width: '32px', height: '32px' }}>
                          {showAvatar && (
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--accent-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: 'var(--bg-primary)'
                            }}>
                              {getInitials(message.sender_username || 'U')}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {!isOwn && showAvatar && (
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            marginBottom: '4px',
                            marginLeft: '16px'
                          }}>
                            {message.sender_username}
                          </div>
                        )}
                        
                        <div className={`message-bubble ${isOwn ? 'sent' : 'received'}`}>
                          {message.media_url && (
                            <div style={{ marginBottom: message.content ? '8px' : '0' }}>
                              <img
                                src={message.media_url}
                                alt="Shared media"
                                style={{
                                  maxWidth: '100%',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(message.media_url, '_blank')}
                              />
                            </div>
                          )}
                          
                          {message.content && (
                            <div>{message.content}</div>
                          )}
                        </div>
                        
                        <div className="message-time">
                          {formatMessageTime(message.created_at)}
                          {isOwn && (
                            <span style={{ marginLeft: '4px' }}>
                              {message.read_by?.length > 1 ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
};

export default MessagesContainer;

