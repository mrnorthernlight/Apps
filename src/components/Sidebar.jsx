import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signOut } from '../supabaseClient'
import ChatList from './ChatList'
import { 
  Search, 
  MessageCircle, 
  Settings, 
  LogOut, 
  Users, 
  Plus,
  Phone,
  Video,
  MoreVertical
} from 'lucide-react'
import toast from 'react-hot-toast'

const Sidebar = ({ 
  user, 
  setUser, 
  chats, 
  contacts, 
  activeChat, 
  setActiveChat, 
  onCreateChat, 
  onStartCall,
  onlineUsers 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showContacts, setShowContacts] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState([])
  const [groupName, setGroupName] = useState('')
  const navigate = useNavigate()

  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true
    
    if (chat.is_group) {
      return chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    } else {
      const otherParticipant = chat.participants?.find(p => p.id !== user.id)
      return otherParticipant?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
    }
  })

  const filteredContacts = contacts.filter(contact =>
    contact.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSignOut = async () => {
    try {
      // Update offline status
      await supabase
        .from('users')
        .update({ 
          is_online: false, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', user.id)

      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Error signing out')
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) {
      toast.error('Please enter group name and select contacts')
      return
    }

    await onCreateChat(null, true, groupName, selectedContacts)
    setShowNewGroup(false)
    setGroupName('')
    setSelectedContacts([])
  }

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  return (
    <div className="w-80 bg-sidebar-bg border-r border-border-dark flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-dark">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-neon-green rounded-full flex items-center justify-center">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-black font-semibold">
                    {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-online rounded-full border-2 border-sidebar-bg"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-text-primary truncate">{user.display_name}</h2>
              <p className="text-xs text-text-secondary truncate">{user.status_message}</p>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 hover:bg-dark-bg rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-text-secondary" />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-input-bg border border-border-dark rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    navigate('/profile')
                    setShowUserMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-dark-bg text-text-primary flex items-center gap-2"
                >
                  <Settings size={16} />
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    setShowContacts(!showContacts)
                    setShowUserMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-dark-bg text-text-primary flex items-center gap-2"
                >
                  <Users size={16} />
                  Contacts
                </button>
                <button
                  onClick={() => {
                    setShowNewGroup(true)
                    setShowUserMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-dark-bg text-text-primary flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Group
                </button>
                <hr className="border-border-dark" />
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left hover:bg-dark-bg text-red-400 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search chats and contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowContacts(!showContacts)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              showContacts 
                ? 'bg-neon-green text-black' 
                : 'bg-input-bg text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users size={16} className="inline mr-1" />
            Contacts
          </button>
          <button
            onClick={() => setShowNewGroup(true)}
            className="p-2 bg-input-bg hover:bg-dark-bg rounded-lg transition-colors"
            title="New Group"
          >
            <Plus size={16} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showContacts ? (
          <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="p-2">
              <h3 className="text-sm font-medium text-text-secondary mb-2 px-2">
                Contacts ({filteredContacts.length})
              </h3>
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 hover:bg-dark-bg rounded-lg cursor-pointer group"
                  onClick={() => onCreateChat(contact.id)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-dark-bg rounded-full flex items-center justify-center">
                      {contact.avatar_url ? (
                        <img 
                          src={contact.avatar_url} 
                          alt={contact.display_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-neon-green font-semibold">
                          {contact.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-sidebar-bg ${
                      onlineUsers.has(contact.id) ? 'bg-online' : 'bg-offline'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text-primary truncate">{contact.display_name}</h4>
                    <p className="text-sm text-text-secondary truncate">@{contact.username}</p>
                    <p className="text-xs text-text-muted truncate">{contact.status_message}</p>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartCall(contact.id, 'audio')
                      }}
                      className="p-2 hover:bg-neon-green hover:text-black rounded-full transition-colors"
                      title="Audio Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartCall(contact.id, 'video')
                      }}
                      className="p-2 hover:bg-neon-green hover:text-black rounded-full transition-colors"
                      title="Video Call"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredContacts.length === 0 && (
                <div className="text-center py-8">
                  <Users size={48} className="text-text-muted mx-auto mb-2" />
                  <p className="text-text-secondary">No contacts found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <ChatList
            chats={filteredChats}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            user={user}
            onlineUsers={onlineUsers}
          />
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-sidebar-bg border border-neon-green rounded-lg p-6 w-96 max-h-96 overflow-hidden">
            <h3 className="text-xl font-semibold text-text-primary mb-4">Create New Group</h3>
            
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green mb-4"
            />

            <div className="mb-4">
              <h4 className="text-sm font-medium text-text-secondary mb-2">
                Select Contacts ({selectedContacts.length})
              </h4>
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-2 hover:bg-dark-bg rounded-lg cursor-pointer"
                    onClick={() => toggleContactSelection(contact.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleContactSelection(contact.id)}
                      className="w-4 h-4 text-neon-green bg-input-bg border-border-dark rounded focus:ring-neon-green"
                    />
                    <div className="w-8 h-8 bg-dark-bg rounded-full flex items-center justify-center">
                      {contact.avatar_url ? (
                        <img 
                          src={contact.avatar_url} 
                          alt={contact.display_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-neon-green text-sm font-semibold">
                          {contact.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="text-text-primary">{contact.display_name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewGroup(false)
                  setGroupName('')
                  setSelectedContacts([])
                }}
                className="flex-1 py-2 px-4 bg-input-bg text-text-secondary rounded-lg hover:bg-dark-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedContacts.length === 0}
                className="flex-1 py-2 px-4 bg-neon-green text-black rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar

