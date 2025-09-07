import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Eye, EyeOff, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Update user online status
        if (data.user) {
          await supabase
            .from('users')
            .update({ 
              is_online: true, 
              last_seen: new Date().toISOString() 
            })
            .eq('id', data.user.id)
        }

      } else {
        // Sign up
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .single()

        if (existingUser) {
          throw new Error('Username is already taken')
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email: email,
                username: username,
                display_name: displayName || username,
                status_message: 'Hey there! I am using FamBase.',
                avatar_url: null,
                is_online: true,
                last_seen: new Date().toISOString()
              }
            ])

          if (profileError) throw profileError
          toast.success('Account created successfully!')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-black via-dark-bg to-darker-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-neon-green rounded-full mb-4">
            <MessageCircle size={40} className="text-black" />
          </div>
          <h1 className="text-4xl font-bold text-neon-green mb-2">FamBase</h1>
          <p className="text-text-secondary">Connect with your family and friends</p>
        </div>

        {/* Auth Form */}
        <div className="bg-sidebar-bg border border-border-dark rounded-lg p-6 shadow-2xl">
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-center font-medium rounded-l-lg transition-colors ${
                isLogin
                  ? 'bg-neon-green text-black'
                  : 'bg-input-bg text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-center font-medium rounded-r-lg transition-colors ${
                !isLogin
                  ? 'bg-neon-green text-black'
                  : 'bg-input-bg text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                    placeholder="Enter your display name"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-input-bg border border-border-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neon-green text-black font-medium py-2 px-4 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-neon-green focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-neon-green hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth

