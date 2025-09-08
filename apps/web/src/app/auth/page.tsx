'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@fambase/ui'
import { auth } from '@/lib/supabase'
import { formatPhoneNumber, isValidPhoneNumber } from '@fambase/shared'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidPhoneNumber(phone)) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    
    try {
      const formattedPhone = formatPhoneNumber(phone)
      const { error } = await auth.signUp(formattedPhone)
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Verification code sent!')
        setStep('verify')
      }
    } catch (error) {
      toast.error('Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    
    try {
      const formattedPhone = formatPhoneNumber(phone)
      const { error } = await auth.verifyOtp(formattedPhone, otp)
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Welcome to FamBase!')
        router.push('/chat')
      }
    } catch (error) {
      toast.error('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FamBase</h1>
          <p className="text-gray-600">
            {step === 'phone' 
              ? 'Enter your phone number to get started' 
              : 'Enter the verification code sent to your phone'
            }
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  We'll send you a verification code via SMS
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                loading={loading}
                disabled={!phone.trim()}
              >
                Send Verification Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Code sent to {formatPhoneNumber(phone)}
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                loading={loading}
                disabled={otp.length !== 6}
              >
                Verify Code
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Change phone number
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a href="#" className="text-green-600 hover:text-green-700">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-green-600 hover:text-green-700">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

