'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Container } from '@/components/ui/Container'

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center p-24">
        <div className="z-10 w-full items-center justify-between text-sm">
          <h1 className="text-4xl font-bold text-center mb-8 gradient-text">
            AI E-Learning Platform
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Master AI/ML through high-quality video courses with intelligent AI assistants
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={isAuthenticated ? '/dashboard' : '/register'} className="btn-primary">
              Get Started
            </Link>
            <Link href="/courses" className="btn-secondary">
              Browse Courses
            </Link>
          </div>
        </div>
        
        <Container variant="public" className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-hover p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🎓 Quality Courses</h3>
            <p className="text-muted-foreground">
              Learn from expert creators with structured video content
            </p>
          </div>
          <div className="card-hover p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🤖 AI Study Buddy</h3>
            <p className="text-muted-foreground">
              Get instant help from our intelligent AI assistant 24/7
            </p>
          </div>
          <div className="card-hover p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">📈 Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor your learning journey and earn certificates
            </p>
          </div>
          </div>
        </Container>
      </div>
      
      <Footer />
    </div>
  )
}