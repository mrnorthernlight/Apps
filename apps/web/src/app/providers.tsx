'use client'

import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { auth } from '@/lib/supabase'

export function Providers({ children }: { children: React.ReactNode }) {
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

  return (
    <>
      {children}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

