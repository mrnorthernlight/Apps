import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Settings, 
  LogOut, 
  User,
  MessageCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import NewChatModal from './NewChatModal';

const ChatSidebar = ({ chats, selectedChat, onChatSelect, onNewChat, user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { logout } = useAuth();

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="flex items-center">
          <svg className="sidebar-logo" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="none" stroke="#4A5568" strokeWidth="20"/>
            <path d="M160 80 L240 80 L180 200 L220 200 L140 320 L200 180 L160 180 Z" 
                  fill="#F6AD55" 
                  stroke="#ED8936" 
                  strokeWidth="2"/>
          </svg>
          <h1 className="sidebar-title">Rupture</h1>
        </div>
        
        <div className="sidebar-actions">
          <motion.button
            className="icon-button"
            onClick={() => setShowNewChatModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="New Chat"
          >
            <Plus size={20} />
          </motion.button>
          
          <div style={{ position: 'relative' }}>
            <motion.button
              className="icon-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="User Menu"
            >
              <User size={20} />
            </motion.button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    minWidth: '200px',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {user?.username}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {user?.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // TODO: Open settings modal
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-color)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--error-color)',
                      textAlign: 'left',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--hover-color)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={20} 
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="chat-list">
        <AnimatePresence>
          {filteredChats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              {searchQuery ? (
                <>
                  <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <div>No chats found</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    Try a different search term
                  </div>
                </>
              ) : (
                <>
                  <MessageCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <div>No chats yet</div>
                  <div style={{ fontSize: '14px', marginTop: '4px' }}>
                    Start a new conversation
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            filteredChats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => onChatSelect(chat)}
              >
                <div className="chat-avatar">
                  {chat.is_group ? (
                    <Users size={20} />
                  ) : (
                    getInitials(chat.name)
                  )}
                </div>
                
                <div className="chat-info">
                  <div className="chat-name">{chat.name}</div>
                  <div className="chat-preview">
                    {chat.last_message || 'No messages yet'}
                  </div>
                </div>
                
                <div className="chat-meta">
                  {chat.last_message_time && (
                    <div className="chat-time">
                      {formatTime(chat.last_message_time)}
                    </div>
                  )}
                  {chat.unread_count > 0 && (
                    <div className="chat-badge">
                      {chat.unread_count > 99 ? '99+' : chat.unread_count}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreateChat={onNewChat}
      />
    </div>
  );
};

export default ChatSidebar;

