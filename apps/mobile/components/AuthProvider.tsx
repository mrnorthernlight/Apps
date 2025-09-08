import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { auth } from '../lib/supabase'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    // Get initial session
    auth.getSession().then(({ session }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  return <>{children}</>
}

