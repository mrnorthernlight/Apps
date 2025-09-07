import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Users, Plus } from 'lucide-react';
import { apiClient } from '../../../shared/api';
import toast from 'react-hot-toast';

const NewChatModal = ({ isOpen, onClose, onCreateChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !isOpen) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await apiClient.get(`/auth/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.success) {
          setSearchResults(response.data.users || []);
        }
      } catch (error) {
        console.error('User search error:', error);
        toast.error('Failed to search users');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setIsGroupChat(false);
      setGroupName('');
    }
  }, [isOpen]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUserSelect = (user) => {
    if (isGroupChat) {
      // For group chats, allow multiple selections
      setSelectedUsers(prev => {
        const isSelected = prev.find(u => u.id === user.id);
        if (isSelected) {
          return prev.filter(u => u.id !== user.id);
        } else {
          return [...prev, user];
        }
      });
    } else {
      // For 1:1 chats, create chat immediately
      onCreateChat(user);
      onClose();
    }
  };

  const handleCreateGroupChat = () => {
    if (selectedUsers.length < 2) {
      toast.error('Group chat requires at least 2 participants');
      return;
    }

    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    // Create group chat
    onCreateChat({
      isGroup: true,
      name: groupName,
      participants: selectedUsers
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              New Chat
            </h2>
            
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Type Toggle */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsGroupChat(false)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !isGroupChat ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: !isGroupChat ? 'var(--bg-primary)' : 'var(--text-primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <User size={16} />
                Direct Message
              </button>
              
              <button
                onClick={() => setIsGroupChat(true)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isGroupChat ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: isGroupChat ? 'var(--bg-primary)' : 'var(--text-primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Users size={16} />
                Group Chat
              </button>
            </div>
          </div>

          {/* Group Name Input (for group chats) */}
          {isGroupChat && (
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <input
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          {/* Search */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Selected Users (for group chats) */}
          {isGroupChat && selectedUsers.length > 0 && (
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Selected ({selectedUsers.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      background: 'var(--accent-primary)',
                      color: 'var(--bg-primary)',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {user.username}
                    <button
                      onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: '200px' }}>
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'var(--text-secondary)'
              }}>
                <div className="spinner" style={{ marginRight: '12px' }}></div>
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  {searchQuery ? 'No users found' : 'Search for users'}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {searchQuery ? 'Try a different search term' : 'Enter a username or email to find users'}
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                {searchResults.map(user => {
                  const isSelected = selectedUsers.find(u => u.id === user.id);
                  
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(246, 173, 85, 0.1)' : 'transparent',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        margin: '4px 0'
                      }}
                      onClick={() => handleUserSelect(user)}
                      whileHover={{ background: 'var(--bg-tertiary)' }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        color: 'var(--bg-primary)',
                        marginRight: '12px'
                      }}>
                        {getInitials(user.username)}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {user.username}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {user.email}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Plus size={12} style={{ color: 'var(--bg-primary)' }} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer (for group chats) */}
          {isGroupChat && selectedUsers.length > 0 && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)'
            }}>
              <button
                onClick={handleCreateGroupChat}
                disabled={selectedUsers.length < 2 || !groupName.trim()}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (selectedUsers.length < 2 || !groupName.trim()) ? 0.5 : 1
                }}
              >
                Create Group Chat ({selectedUsers.length} members)
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;

