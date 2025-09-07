import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Image, Smile } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle text input
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send text message
  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files are supported');
      return;
    }

    setUploading(true);
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file (this would typically go to your API)
      // For now, we'll create a local URL
      const mediaUrl = URL.createObjectURL(file);
      
      // Send message with media
      onSendMessage('', mediaUrl);
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true
  });

  return (
    <div className="message-input-container" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(246, 173, 85, 0.1)',
            border: '2px dashed var(--accent-primary)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          <div style={{
            textAlign: 'center',
            color: 'var(--accent-primary)',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            <Image size={48} style={{ margin: '0 auto 12px' }} />
            Drop image here to upload
          </div>
        </motion.div>
      )}

      <div className="message-input-wrapper">
        {/* Attachment Button */}
        <motion.button
          type="button"
          className="icon-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Attach file"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {uploading ? (
            <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
          ) : (
            <Paperclip size={18} />
          )}
        </motion.button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(Array.from(e.target.files))}
          style={{ display: 'none' }}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
          rows={1}
          style={{
            resize: 'none',
            overflow: 'hidden'
          }}
        />

        {/* Emoji Button */}
        <motion.button
          type="button"
          className="icon-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Add emoji"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Smile size={18} />
        </motion.button>

        {/* Send Button */}
        <motion.button
          type="button"
          onClick={handleSendMessage}
          disabled={!message.trim() || uploading}
          className="message-send-button"
          whileHover={{ scale: message.trim() ? 1.05 : 1 }}
          whileTap={{ scale: message.trim() ? 0.95 : 1 }}
          title="Send message"
        >
          <Send size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default MessageInput;

