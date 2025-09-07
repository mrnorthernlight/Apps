import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, Mic, X } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

const MessageInput = ({ onSendMessage, onTyping, disabled }) => {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  useEffect(() => {
    // Close emoji picker when clicking outside
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    
    // Send typing indicator
    if (onTyping) {
      onTyping(true)
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false)
      }, 3000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if ((!message.trim() && attachments.length === 0) || disabled || uploading) return

    // Stop typing indicator
    if (onTyping) {
      onTyping(false)
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    try {
      await onSendMessage(message, attachments)
      setMessage('')
      setAttachments([])
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    
    try {
      const uploadedFiles = []
      
      for (const file of files) {
        // File size validation removed - unlimited uploads allowed

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, file)

        if (error) throw error

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(fileName)

        uploadedFiles.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size
        })
      }

      setAttachments(prev => [...prev, ...uploadedFiles])
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`)
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        
        // Upload voice message
        setUploading(true)
        try {
          const fileName = `voice-${Date.now()}-${Math.random().toString(36).substring(2)}.webm`
          
          const { data, error } = await supabase.storage
            .from('message-attachments')
            .upload(fileName, file)

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(fileName)

          await onSendMessage('', [{
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size
          }])
          
          toast.success('Voice message sent')
        } catch (error) {
          console.error('Error uploading voice message:', error)
          toast.error('Failed to send voice message')
        } finally {
          setUploading(false)
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-sidebar-bg border-t border-border-dark p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-dark-bg rounded-lg p-2 flex items-center gap-2 max-w-xs">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{attachment.name}</p>
                <p className="text-xs text-text-muted">
                  {Math.round(attachment.size / 1024)}KB
                </p>
              </div>
              <button
                onClick={() => removeAttachment(index)}
                className="p-1 hover:bg-input-bg rounded transition-colors"
              >
                <X size={14} className="text-text-secondary" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-400 font-medium">Recording: {formatRecordingTime(recordingTime)}</span>
          <button
            onClick={stopRecording}
            className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 hover:bg-dark-bg rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach File"
        >
          <Paperclip size={20} className="text-text-secondary" />
        </button>

        {/* Message Input Container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled}
            className="w-full px-4 py-2 pr-12 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green resize-none min-h-[40px] max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-dark-bg rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add Emoji"
          >
            <Smile size={18} className="text-text-secondary" />
          </button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-10">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                width={300}
                height={400}
              />
            </div>
          )}
        </div>

        {/* Send/Voice Button */}
        {message.trim() || attachments.length > 0 ? (
          <button
            type="submit"
            disabled={disabled || uploading}
            className="p-2 bg-neon-green text-black rounded-full hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send Message"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-neon-green text-black hover:bg-opacity-90'
            }`}
            title={isRecording ? "Stop Recording" : "Record Voice Message"}
          >
            <Mic size={20} />
          </button>
        )}
      </form>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default MessageInput
