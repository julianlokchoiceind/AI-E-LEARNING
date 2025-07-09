'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { AnimatedButton, GlassCard } from '@/components/ui/modern/ModernComponents'
import { useApiMutation } from '@/hooks/useApiMutation'
import { forgotPassword } from '@/lib/api/auth'
import { ToastService } from '@/lib/toast/ToastService'
import { Mail, ArrowLeft, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // React Query mutation for forgot password
  const { mutate: sendResetEmail, loading } = useApiMutation(
    (email: string) => forgotPassword(email),
    {
      onSuccess: (response) => {
        const message = response.message || 'Password reset email sent! Please check your inbox.';
        setSuccessMessage(message);
        setSuccess(true);
        ToastService.success(message);
      },
      onError: (error: any) => {
        ToastService.error(error.message || 'Something went wrong');
      }
    }
  )
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendResetEmail(email)
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
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
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Check your email
            </h2>
            <p className="text-gray-600 text-lg">
              If an account exists for <span className="font-semibold text-primary">{email}</span>, you will receive a password reset link.
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
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Email Sent Successfully!</h3>
                  <p className="text-gray-600">Check your inbox and spam folder</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Reset link expires in 15 minutes</span>
                </div>
                
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-2">Didn't receive the email?</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Check your spam/junk folder</li>
                    <li>• Verify the email address is correct</li>
                    <li>• Wait a few minutes and try again</li>
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
                  onClick={() => setSuccess(false)}
                >
                  Send Another Email
                </AnimatedButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-gray-600 text-lg">
            Enter your email address and we'll send you a secure link to reset your password.
          </p>
        </motion.div>
        
        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <GlassCard variant="light" className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
              
              <AnimatedButton
                type="submit"
                variant="gradient"
                size="lg"
                loading={loading}
                className="w-full"
                icon={<Mail className="w-5 h-5" />}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </AnimatedButton>
            </form>
          </GlassCard>
        </motion.div>
        
        {/* Navigation Links */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <AnimatedButton
            variant="ghost"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            className="flex-1"
            onClick={() => router.push('/login')}
          >
            Back to Login
          </AnimatedButton>
          
          <AnimatedButton
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => router.push('/register')}
          >
            Create Account
          </AnimatedButton>
        </motion.div>

        {/* Help Text */}
        <motion.div
          className="text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p>Need help? Contact our support team at <a href="mailto:support@elearning.com" className="text-primary hover:text-primary-hover">support@elearning.com</a></p>
        </motion.div>
      </motion.div>
    </div>
  )
}