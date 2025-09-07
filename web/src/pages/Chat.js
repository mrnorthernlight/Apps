import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatSidebar from '../components/ChatSidebar';
import MessagesContainer from '../components/MessagesContainer';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { apiClient } from '../../../shared/api';
import toast from 'react-hot-toast';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const { user } = useAuth();
  const { socket, connected, joinChat, leaveChat } = useSocket();
  const navigate = useNavigate();

  // Load user chats
  useEffect(() => {
    const loadChats = async () => {
      try {
        const response = await apiClient.get('/chats');
        if (response.success) {
          setChats(response.data.chats || []);
        } else {
          toast.error('Failed to load chats');
        }
      } catch (error) {
        console.error('Error loading chats:', error);
        toast.error('Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadChats();
    }
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (socket && connected) {
      // Listen for new messages
      socket.on('new_message', (message) => {
        // Update messages if it's for the current chat
        if (selectedChat && message.chat_id === selectedChat.id) {
          setMessages(prev => [...prev, message]);
        }
        
        // Update chat list with latest message
        setChats(prev => prev.map(chat => 
          chat.id === message.chat_id 
            ? { 
                ...chat, 
                last_message: message.content,
                last_message_time: message.created_at,
                unread_count: chat.id === selectedChat?.id ? 0 : (chat.unread_count || 0) + 1
              }
            : chat
        ));
      });

      // Listen for message updates
      socket.on('message_updated', (message) => {
        if (selectedChat && message.chat_id === selectedChat.id) {
          setMessages(prev => prev.map(msg => 
            msg.id === message.id ? message : msg
          ));
        }
      });

      // Listen for message deletions
      socket.on('message_deleted', (data) => {
        if (selectedChat && data.chat_id === selectedChat.id) {
          setMessages(prev => prev.filter(msg => msg.id !== data.message_id));
        }
      });

      // Listen for typing indicators
      socket.on('user_typing', (data) => {
        // Handle typing indicators
        console.log('User typing:', data);
      });

      // Listen for read receipts
      socket.on('messages_read', (data) => {
        if (selectedChat && data.chat_id === selectedChat.id) {
          setMessages(prev => prev.map(msg => 
            data.message_ids.includes(msg.id) 
              ? { ...msg, read_by: [...(msg.read_by || []), data.user_id] }
              : msg
          ));
        }
      });

      return () => {
        socket.off('new_message');
        socket.off('message_updated');
        socket.off('message_deleted');
        socket.off('user_typing');
        socket.off('messages_read');
      };
    }
  }, [socket, connected, selectedChat]);

  // Handle chat selection
  const handleChatSelect = async (chat) => {
    // Leave previous chat room
    if (selectedChat) {
      leaveChat(selectedChat.id);
    }

    setSelectedChat(chat);
    setMessagesLoading(true);
    
    // Join new chat room
    joinChat(chat.id);
    
    // Load messages for selected chat
    try {
      const response = await apiClient.get(`/messages/${chat.id}`);
      if (response.success) {
        setMessages(response.data.messages || []);
        
        // Mark messages as read
        const unreadMessages = response.data.messages
          .filter(msg => msg.sender_id !== user.id && !msg.read_by?.includes(user.id))
          .map(msg => msg.id);
          
        if (unreadMessages.length > 0) {
          await apiClient.post(`/messages/${chat.id}/read`, {
            messageIds: unreadMessages
          });
        }
        
        // Update chat unread count
        setChats(prev => prev.map(c => 
          c.id === chat.id ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
    
    // Update URL
    navigate(`/chat/${chat.id}`);
  };

  // Handle new chat creation
  const handleNewChat = async (userData) => {
    try {
      const response = await apiClient.post('/chats', {
        participants: [userData.id],
        name: userData.username
      });
      
      if (response.success) {
        const newChat = response.data.chat;
        setChats(prev => [newChat, ...prev]);
        handleChatSelect(newChat);
        toast.success(`Started chat with ${userData.username}`);
      } else {
        toast.error('Failed to create chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    }
  };

  // Handle message send
  const handleSendMessage = async (content, mediaUrl = null) => {
    if (!selectedChat || (!content.trim() && !mediaUrl)) return;

    try {
      const response = await apiClient.post(`/messages/${selectedChat.id}`, {
        content: content.trim(),
        mediaUrl
      });

      if (response.success) {
        // Message will be added via socket event
        // Update chat in sidebar
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { 
                ...chat, 
                last_message: content || 'Media',
                last_message_time: new Date().toISOString()
              }
            : chat
        ));
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <svg className="loading-logo" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="none" stroke="#4A5568" strokeWidth="20"/>
            <path d="M160 80 L240 80 L180 200 L220 200 L140 320 L200 180 L160 180 Z" 
                  fill="#F6AD55" 
                  stroke="#ED8936" 
                  strokeWidth="2"/>
          </svg>
          <div className="loading-text">Rupture</div>
          <div className="loading-subtitle">Loading chats...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="chat-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        selectedChat={selectedChat}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        user={user}
      />

      {/* Main Content */}
      <div className="chat-main">
        <Routes>
          <Route 
            path="/" 
            element={<EmptyState />} 
          />
          <Route 
            path="/:chatId" 
            element={
              selectedChat ? (
                <MessagesContainer
                  chat={selectedChat}
                  messages={messages}
                  loading={messagesLoading}
                  onSendMessage={handleSendMessage}
                  currentUser={user}
                />
              ) : (
                <EmptyState />
              )
            } 
          />
        </Routes>
      </div>
    </motion.div>
  );
};

export default Chat;

