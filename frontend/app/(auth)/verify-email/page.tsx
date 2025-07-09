'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { verifyEmail } from '@/lib/api/auth'
import { AnimatedButton, GlassCard } from '@/components/ui/modern/ModernComponents'
import { ToastService } from '@/lib/toast/ToastService'
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowLeft, Shield, Clock } from 'lucide-react'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. No token provided.')
      return
    }
    
    // Verify email with backend
    verifyEmail(token)
      .then((response) => {
        setStatus('success')
        setMessage(response.message || 'Email verified successfully!')
        ToastService.success(response.message || 'Something went wrong')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true')
        }, 3000)
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error.message || 'Email verification failed. Please try again.')
        ToastService.error(error.message || 'Something went wrong')
      })
  }, [searchParams, router])
  
  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-md w-full space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Loading Header */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Verifying Email
            </h2>
            <p className="text-gray-600 text-lg">
              Please wait while we verify your email address...
            </p>
          </motion.div>
          
          {/* Loading Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <GlassCard variant="light" className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Email Verification</h3>
                  <p className="text-gray-600">Processing your verification request</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
              <p className="text-center text-gray-600 text-sm">
                This should only take a moment...
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    )
  }
  
  // Success State
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-lg w-full space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success Header */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 text-lg">
              Your account is now activated. You can start your learning journey.
            </p>
          </motion.div>
          
          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <GlassCard variant="colored" className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Account Activated</h3>
                  <p className="text-gray-600">You can now access all features</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-gray-600 p-3 bg-green-50 rounded-lg">
                  <Clock className="w-4 h-4 mr-2 text-green-500" />
                  <span>Email verified successfully</span>
                </div>
                
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-2">What's Next:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Sign in to your account</li>
                    <li>• Explore our course catalog</li>
                    <li>• Start learning with AI assistance</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">Redirecting to login page in a few seconds...</p>
                <AnimatedButton
                  variant="gradient"
                  size="lg"
                  icon={<ArrowLeft className="w-5 h-5" />}
                  onClick={() => router.push('/login?verified=true')}
                >
                  Continue to Login
                </AnimatedButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    )
  }
  
  // Error State
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Error Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Verification Failed
          </h2>
          <p className="text-gray-600 text-lg">
            We couldn't verify your email address
          </p>
        </motion.div>
        
        {/* Error Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <GlassCard variant="light" className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Verification Error</h3>
                <p className="text-gray-600">Please try again or contact support</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800">{message}</p>
              </div>
              
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">Possible Solutions:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Check if the link has expired</li>
                  <li>• Request a new verification email</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <AnimatedButton
                variant="ghost"
                size="lg"
                icon={<ArrowLeft className="w-4 h-4" />}
                className="flex-1"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </AnimatedButton>
              
              <AnimatedButton
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => router.push('/register')}
              >
                Try Again
              </AnimatedButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Help Text */}
        <motion.div
          className="text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p>Need help? Contact our support team at <a href="mailto:support@elearning.com" className="text-primary hover:text-primary-hover">support@elearning.com</a></p>
        </motion.div>
      </motion.div>
    </div>
  )
}