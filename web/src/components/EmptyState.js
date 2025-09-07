import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Zap } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="empty-state">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="empty-state-content"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <svg className="empty-state-logo" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="none" stroke="#4A5568" strokeWidth="20"/>
            <path d="M160 80 L240 80 L180 200 L220 200 L140 320 L200 180 L160 180 Z" 
                  fill="#F6AD55" 
                  stroke="#ED8936" 
                  strokeWidth="2"/>
          </svg>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <h2 className="empty-state-title">Welcome to Rupture</h2>
          <p className="empty-state-subtitle">
            Select a chat from the sidebar to start messaging, or create a new conversation
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginTop: '40px',
            maxWidth: '600px'
          }}
        >
          <div style={{
            padding: '24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Zap size={32} style={{ 
              color: 'var(--accent-primary)', 
              margin: '0 auto 12px' 
            }} />
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Lightning Fast
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              lineHeight: '1.4'
            }}>
              Real-time messaging with instant delivery and read receipts
            </p>
          </div>

          <div style={{
            padding: '24px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <MessageCircle size={32} style={{ 
              color: 'var(--accent-primary)', 
              margin: '0 auto 12px' 
            }} />
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Rich Messaging
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              lineHeight: '1.4'
            }}>
              Send text, images, and files with support for group chats
            </p>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            marginTop: '40px',
            padding: '20px',
            background: 'rgba(246, 173, 85, 0.1)',
            border: '1px solid rgba(246, 173, 85, 0.2)',
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--accent-primary)',
            marginBottom: '8px'
          }}>
            💡 Pro Tip
          </h4>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            Click the <strong>+</strong> button in the sidebar to start a new chat, 
            or drag and drop images directly into the message input
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EmptyState;

