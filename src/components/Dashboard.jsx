import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import CallUI from './CallUI'
import toast from 'react-hot-toast'

const Dashboard = ({ user, setUser }) => {
  const [activeChat, setActiveChat] = useState(null)
  const [chats, setChats] = useState([])
  const [contacts, setContacts] = useState([])
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [activeCall, setActiveCall] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)

  useEffect(() => {
    if (user) {
      fetchChats()
      fetchContacts()
      setupRealtimeSubscriptions()
      updateOnlineStatus(true)
    }

    // Cleanup on unmount
    return () => {
      updateOnlineStatus(false)
    }
  }, [user])

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id)
    }
  }, [activeChat])

  const updateOnlineStatus = async (isOnline) => {
    if (!user) return

    try {
      await supabase
        .from('users')
        .update({ 
          is_online: isOnline, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', user.id)
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          participants:chat_participants(
            user:users(*)
          ),
          last_message:messages(
            content,
            created_at,
            sender:users(display_name)
          )
        `)
        .eq('chat_participants.user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const formattedChats = data.map(chat => ({
        ...chat,
        participants: chat.participants.map(p => p.user),
        last_message: chat.last_message?.[0] || null
      }))

      setChats(formattedChats)
    } catch (error) {
      console.error('Error fetching chats:', error)
      toast.error('Error loading chats')
    }
  }

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id)
        .order('display_name')

      if (error) throw error
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error('Error loading contacts')
    }
  }

  const fetchMessages = async (chatId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, display_name, avatar_url),
          attachments:message_attachments(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data)

      // Mark messages as read
      await supabase
        .from('message_reads')
        .upsert({
          message_id: data[data.length - 1]?.id,
          user_id: user.id,
          read_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Error loading messages')
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new
          if (activeChat && newMessage.chat_id === activeChat.id) {
            setMessages(prev => [...prev, {
              ...newMessage,
              sender: newMessage.sender_id === user.id ? user : 
                contacts.find(c => c.id === newMessage.sender_id) || { display_name: 'Unknown' }
            }])
          }
          // Update chat list
          fetchChats()
        }
      )
      .subscribe()

    // Subscribe to user presence
    const presenceSubscription = supabase
      .channel('presence')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedUser = payload.new
            setOnlineUsers(prev => {
              const newSet = new Set(prev)
              if (updatedUser.is_online) {
                newSet.add(updatedUser.id)
              } else {
                newSet.delete(updatedUser.id)
              }
              return newSet
            })
          }
        }
      )
      .subscribe()

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel('typing')
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, chat_id, is_typing } = payload.payload
        if (activeChat && chat_id === activeChat.id && user_id !== user.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            if (is_typing) {
              newSet.add(user_id)
            } else {
              newSet.delete(user_id)
            }
            return newSet
          })
        }
      })
      .subscribe()

    // Subscribe to call events
    const callSubscription = supabase
      .channel('calls')
      .on('broadcast', { event: 'call_offer' }, (payload) => {
        const { from_user, to_user, call_type, offer } = payload.payload
        if (to_user === user.id) {
          setIncomingCall({
            from_user,
            call_type,
            offer
          })
        }
      })
      .on('broadcast', { event: 'call_answer' }, (payload) => {
        const { from_user, to_user, answer } = payload.payload
        if (to_user === user.id && activeCall) {
          // Handle call answer
          setActiveCall(prev => ({ ...prev, answer }))
        }
      })
      .on('broadcast', { event: 'call_end' }, (payload) => {
        const { from_user, to_user } = payload.payload
        if (to_user === user.id || from_user === user.id) {
          setActiveCall(null)
          setIncomingCall(null)
        }
      })
      .subscribe()

    return () => {
      messagesSubscription.unsubscribe()
      presenceSubscription.unsubscribe()
      typingSubscription.unsubscribe()
      callSubscription.unsubscribe()
    }
  }

  const createOrGetChat = async (contactId, isGroup = false, groupName = '', groupMembers = []) => {
    try {
      if (isGroup) {
        // Create group chat
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert([{
            name: groupName,
            is_group: true,
            created_by: user.id
          }])
          .select()
          .single()

        if (chatError) throw chatError

        // Add participants
        const participants = [user.id, ...groupMembers].map(userId => ({
          chat_id: chat.id,
          user_id: userId,
          joined_at: new Date().toISOString()
        }))

        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert(participants)

        if (participantsError) throw participantsError

        await fetchChats()
        setActiveChat(chat)
      } else {
        // Check if 1:1 chat already exists
        const { data: existingChats, error: searchError } = await supabase
          .from('chat_participants')
          .select('chat_id, chats!inner(*)')
          .eq('user_id', user.id)
          .eq('chats.is_group', false)

        if (searchError) throw searchError

        let existingChat = null
        for (const chatParticipant of existingChats) {
          const { data: otherParticipants, error } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', chatParticipant.chat_id)
            .neq('user_id', user.id)

          if (!error && otherParticipants.length === 1 && otherParticipants[0].user_id === contactId) {
            existingChat = chatParticipant.chats
            break
          }
        }

        if (existingChat) {
          setActiveChat(existingChat)
        } else {
          // Create new 1:1 chat
          const { data: chat, error: chatError } = await supabase
            .from('chats')
            .insert([{
              is_group: false,
              created_by: user.id
            }])
            .select()
            .single()

          if (chatError) throw chatError

          // Add participants
          const participants = [
            { chat_id: chat.id, user_id: user.id, joined_at: new Date().toISOString() },
            { chat_id: chat.id, user_id: contactId, joined_at: new Date().toISOString() }
          ]

          const { error: participantsError } = await supabase
            .from('chat_participants')
            .insert(participants)

          if (participantsError) throw participantsError

          await fetchChats()
          setActiveChat(chat)
        }
      }
    } catch (error) {
      console.error('Error creating/getting chat:', error)
      toast.error('Error creating chat')
    }
  }

  const sendMessage = async (content, attachments = []) => {
    if (!activeChat || !content.trim()) return

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: activeChat.id,
          sender_id: user.id,
          content: content.trim(),
          message_type: attachments.length > 0 ? 'media' : 'text'
        }])
        .select()
        .single()

      if (error) throw error

      // Handle attachments
      if (attachments.length > 0) {
        const attachmentData = attachments.map(attachment => ({
          message_id: message.id,
          file_url: attachment.url,
          file_name: attachment.name,
          file_type: attachment.type,
          file_size: attachment.size
        }))

        await supabase
          .from('message_attachments')
          .insert(attachmentData)
      }

      // Update chat timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChat.id)

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Error sending message')
    }
  }

  const sendTypingIndicator = async (isTyping) => {
    if (!activeChat) return

    await supabase
      .channel('typing')
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          chat_id: activeChat.id,
          is_typing: isTyping
        }
      })
  }

  const startCall = async (contactId, callType) => {
    try {
      setActiveCall({
        type: callType,
        with_user: contactId,
        is_caller: true
      })

      // Send call offer via realtime
      await supabase
        .channel('calls')
        .send({
          type: 'broadcast',
          event: 'call_offer',
          payload: {
            from_user: user.id,
            to_user: contactId,
            call_type: callType,
            offer: null // WebRTC offer will be set by CallUI component
          }
        })
    } catch (error) {
      console.error('Error starting call:', error)
      toast.error('Error starting call')
    }
  }

  const answerCall = async () => {
    if (!incomingCall) return

    setActiveCall({
      type: incomingCall.call_type,
      with_user: incomingCall.from_user,
      is_caller: false
    })
    setIncomingCall(null)
  }

  const endCall = async () => {
    if (!activeCall) return

    await supabase
      .channel('calls')
      .send({
        type: 'broadcast',
        event: 'call_end',
        payload: {
          from_user: user.id,
          to_user: activeCall.with_user
        }
      })

    setActiveCall(null)
  }

  if (activeCall) {
    return (
      <CallUI
        call={activeCall}
        user={user}
        onEndCall={endCall}
      />
    )
  }

  return (
    <div className="h-screen w-screen flex bg-black">
      <Sidebar
        user={user}
        setUser={setUser}
        chats={chats}
        contacts={contacts}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        onCreateChat={createOrGetChat}
        onStartCall={startCall}
        onlineUsers={onlineUsers}
      />
      
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            messages={messages}
            user={user}
            onSendMessage={sendMessage}
            onSendTyping={sendTypingIndicator}
            typingUsers={typingUsers}
            onStartCall={startCall}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-chat-bg">
            <div className="text-center">
              <div className="w-32 h-32 bg-dark-bg rounded-full flex items-center justify-center mb-6 mx-auto">
                <div className="text-6xl">💬</div>
              </div>
              <h2 className="text-2xl font-semibold text-text-primary mb-2">Welcome to FamBase</h2>
              <p className="text-text-secondary">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-sidebar-bg border border-neon-green rounded-lg p-6 text-center">
            <div className="w-20 h-20 bg-neon-green rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📞</span>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Incoming {incomingCall.call_type} call
            </h3>
            <p className="text-text-secondary mb-6">
              From: {contacts.find(c => c.id === incomingCall.from_user)?.display_name || 'Unknown'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIncomingCall(null)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={answerCall}
                className="flex-1 bg-neon-green text-black py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Answer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

