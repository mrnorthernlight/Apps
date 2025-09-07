import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import toast from 'react-hot-toast'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
        if (event === 'SIGNED_IN') {
          toast.success('Welcome to FamBase!')
        }
      } else {
        setUser(null)
        if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully')
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If user doesn't exist in users table, create profile
        if (error.code === 'PGRST116') {
          await createUserProfile(userId)
        } else {
          throw error
        }
      } else {
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Error loading profile')
    }
  }

  const createUserProfile = async (userId) => {
    try {
      const { data: authUser } = await supabase.auth.getUser()
      const email = authUser.user?.email || ''
      const username = email.split('@')[0] || `user_${userId.slice(0, 8)}`

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email,
            username: username,
            display_name: username,
            status_message: 'Hey there! I am using FamBase.',
            avatar_url: null,
            is_online: true,
            last_seen: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error creating user profile:', error)
      toast.error('Error creating profile')
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-neon-green mb-2">FamBase</h1>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="h-screen w-screen bg-black overflow-hidden">
        <Routes>
          <Route 
            path="/auth" 
            element={!session ? <Auth /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/profile" 
            element={session && user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/" 
            element={session && user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/auth" replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App

