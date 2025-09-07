import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Camera, Save, User, MessageSquare, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

const Profile = ({ user, setUser }) => {
  const [displayName, setDisplayName] = useState(user.display_name || '')
  const [statusMessage, setStatusMessage] = useState(user.status_message || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // File size validation removed - unlimited uploads allowed

    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update user profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      setUser(updatedUser)
      toast.success('Avatar updated successfully!')

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required')
      return
    }

    setSaving(true)

    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim(),
          status_message: statusMessage.trim() || 'Hey there! I am using FamBase.'
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setUser(updatedUser)
      toast.success('Profile updated successfully!')
      navigate('/')

    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-dark-bg rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Profile Settings</h1>
        </div>

        {/* Profile Form */}
        <div className="bg-sidebar-bg border border-border-dark rounded-lg p-6 space-y-6">
          {/* Avatar Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-neon-green" />
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-neon-green text-black rounded-full flex items-center justify-center hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Change Avatar"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera size={16} />
                )}
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <User size={16} />
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                placeholder="Enter your display name"
                maxLength={50}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <MessageSquare size={16} />
                Status Message
              </label>
              <textarea
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                className="w-full px-3 py-2 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green resize-none"
                placeholder="Enter your status message"
                rows={3}
                maxLength={150}
              />
              <p className="text-xs text-text-muted mt-1">
                {statusMessage.length}/150 characters
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <Mail size={16} />
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 bg-dark-bg border border-border-dark rounded-lg text-text-muted cursor-not-allowed"
              />
              <p className="text-xs text-text-muted mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                <User size={16} />
                Username
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-3 py-2 bg-dark-bg border border-border-dark rounded-lg text-text-muted cursor-not-allowed"
              />
              <p className="text-xs text-text-muted mt-1">
                Username cannot be changed
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2 px-4 bg-input-bg text-text-secondary rounded-lg hover:bg-dark-bg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving || !displayName.trim()}
              className="flex-1 py-2 px-4 bg-neon-green text-black rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-6 text-center">
          <p className="text-text-muted text-sm">
            Account created: {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Profile
