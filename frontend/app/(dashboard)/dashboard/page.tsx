'use client'

import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name || user?.email?.split('@')[0]}!</h1>
            <p className="mt-2 text-gray-600">Continue your learning journey</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Enrolled Courses</dt>
                      <dd className="text-lg font-semibold text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Hours Learned</dt>
                      <dd className="text-lg font-semibold text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Award className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Certificates</dt>
                      <dd className="text-lg font-semibold text-gray-900">0</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Current Streak</dt>
                      <dd className="text-lg font-semibold text-gray-900">0 days</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Learning Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Continue Learning</h2>
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
              <Link href="/courses" className="btn-primary">
                Browse Courses
              </Link>
            </div>
          </div>

          {/* Recommended Courses */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommended for You</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Programming Fundamentals</h3>
                    <p className="text-gray-600 text-sm mb-4">Learn the basics of AI programming with Python</p>
                    <div className="flex justify-between items-center">
                      <span className="text-primary font-semibold">$49.99</span>
                      <Link href={`/courses/${i}`} className="text-primary hover:text-primary/80 font-medium">
                        View Course →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}