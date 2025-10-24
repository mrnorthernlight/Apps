import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'

export function Login() {
  const { user } = useAuth()
  const [isSignup, setIsSignup] = useState(false)

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ClassConnect
          </h1>
          <p className="text-white/80">
            Connecting students, teachers, and knowledge
          </p>
        </div>

        {/* Auth Form */}
        {isSignup ? (
          <SignupForm
            onSuccess={() => setIsSignup(false)}
            onSwitchToLogin={() => setIsSignup(false)}
          />
        ) : (
          <LoginForm
            onSwitchToSignup={() => setIsSignup(true)}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-white/60 text-sm">
          <p>© 2024 ClassConnect. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
