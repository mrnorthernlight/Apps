import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // User status events
      newSocket.on('user_online', (data) => {
        console.log('User came online:', data);
      });

      newSocket.on('user_offline', (data) => {
        console.log('User went offline:', data);
      });

      setSocket(newSocket);

      // Cleanup on unmount or user change
      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [user, token]);

  // Join chat room
  const joinChat = (chatId) => {
    if (socket && connected) {
      socket.emit('join_chat', { chatId });
    }
  };

  // Leave chat room
  const leaveChat = (chatId) => {
    if (socket && connected) {
      socket.emit('leave_chat', { chatId });
    }
  };

  // Send message
  const sendMessage = (chatId, message) => {
    if (socket && connected) {
      socket.emit('send_message', {
        chatId,
        content: message.content,
        mediaUrl: message.mediaUrl
      });
    }
  };

  // Send typing indicator
  const sendTyping = (chatId, isTyping) => {
    if (socket && connected) {
      socket.emit('typing', { chatId, isTyping });
    }
  };

  // Mark messages as read
  const markAsRead = (chatId, messageIds) => {
    if (socket && connected) {
      socket.emit('mark_read', { chatId, messageIds });
    }
  };

  const value = {
    socket,
    connected,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    markAsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

