'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ModernCourseCard, StatsCard, AnimatedButton, GlassCard } from '@/components/ui/modern/ModernComponents'
import { BookOpen, Award, Users, Star, Play, ArrowRight, Bot, TrendingUp, Clock } from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  // Sample featured courses
  const featuredCourses = [
    {
      id: '1',
      title: 'AI Programming Fundamentals',
      description: 'Learn the basics of AI programming with Python, machine learning algorithms, and neural networks.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Dr. Minh Nguyen',
      duration: '12h 30m',
      students: 2340,
      rating: 4.9,
      price: 0,
      level: 'Beginner' as const,
      category: 'AI Fundamentals',
      isPremium: false
    },
    {
      id: '2',
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts including custom hooks, context patterns, and performance optimization.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Sarah Chen',
      duration: '8h 45m',
      students: 1250,
      rating: 4.8,
      price: 99,
      level: 'Advanced' as const,
      category: 'React',
      isPremium: true
    },
    {
      id: '3',
      title: 'Machine Learning with Python',
      description: 'Deep dive into machine learning algorithms, data preprocessing, and model evaluation techniques.',
      thumbnail: '/api/placeholder/400/225',
      instructor: 'Alex Kim',
      duration: '15h 20m',
      students: 3200,
      rating: 4.9,
      price: 149,
      level: 'Intermediate' as const,
      category: 'Machine Learning',
      isPremium: true
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI E-Learning
              </span>
              <br />
              <span className="text-gray-900">Platform</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Master AI/ML through high-quality video courses with intelligent AI assistants. 
              Learn from experts, get instant help, and track your progress.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AnimatedButton 
                variant="gradient" 
                size="lg"
                icon={<Play className="w-5 h-5" />}
              >
                <Link href={isAuthenticated ? '/dashboard' : '/register'}>
                  Start Learning Now
                </Link>
              </AnimatedButton>
              
              <AnimatedButton 
                variant="secondary" 
                size="lg"
                icon={<BookOpen className="w-5 h-5" />}
              >
                <Link href="/courses">
                  Browse Courses
                </Link>
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <StatsCard
              title="Total Students"
              value="10,000+"
              change={25}
              icon={<Users className="w-6 h-6" />}
              variant="success"
            />
            <StatsCard
              title="Courses Available"
              value={150}
              change={12}
              icon={<BookOpen className="w-6 h-6" />}
              variant="default"
            />
            <StatsCard
              title="Certificates Issued"
              value="5,400+"
              change={18}
              icon={<Award className="w-6 h-6" />}
              variant="warning"
            />
            <StatsCard
              title="Success Rate"
              value="94%"
              change={8}
              icon={<TrendingUp className="w-6 h-6" />}
              variant="success"
            />
          </motion.div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Courses
            </h2>
            <p className="text-gray-600 text-lg">
              Start your journey with our most popular courses
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              >
                <ModernCourseCard
                  {...course}
                  variant={index === 1 ? 'featured' : 'default'}
                  onClick={() => window.open(`/courses/${course.id}`, '_blank')}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-gray-600 text-lg">
              Experience the future of online learning
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard variant="light" className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Quality Courses</h3>
              <p className="text-gray-600">
                Learn from expert instructors with structured video content and hands-on projects
              </p>
            </GlassCard>

            <GlassCard variant="colored" className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Study Buddy</h3>
              <p className="text-gray-600">
                Get instant help from our intelligent AI assistant powered by Claude 3.5 Sonnet
              </p>
            </GlassCard>

            <GlassCard variant="light" className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your learning journey, earn certificates, and showcase your achievements
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start Your AI Journey?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Join thousands of students learning AI/ML with our comprehensive platform
            </p>
            
            <AnimatedButton 
              variant="secondary" 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              <Link href={isAuthenticated ? '/dashboard' : '/register'}>
                Get Started Today
              </Link>
            </AnimatedButton>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}