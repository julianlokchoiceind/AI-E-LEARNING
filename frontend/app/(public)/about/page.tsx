'use client'

import { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { HeroSection } from '@/components/ui/HeroSection'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <HeroSection
        title="About AI E-Learning Platform"
        subtitle="Empowering developers to master AI/ML through high-quality video courses and intelligent AI assistants"
        align="center"
        size="md"
        backgroundImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&h=600&fit=crop"
        tabletImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1024&h=400&fit=crop"
        mobileImage="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=768&h=300&fit=crop"
      />

      <Container variant="public" className="py-8 md:py-12 lg:py-24">
        <div>
          <div className="prose prose-lg mx-auto">

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p>
                We believe that artificial intelligence education should be accessible, 
                practical, and engaging. Our platform combines expert-led video content 
                with cutting-edge AI assistance to create the most effective learning 
                experience for developers.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">What Makes Us Different</h2>
              <div className="grid md:grid-cols-2 gap-6 not-prose">
                <div className="bg-white p-6 rounded-lg shadow-sm card-glow">
                  <h3 className="text-lg font-semibold mb-2">🤖 AI Study Buddy</h3>
                  <p className="text-muted-foreground">
                    Get instant help from our Claude 3.5 Sonnet AI assistant 24/7
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm card-glow">
                  <h3 className="text-lg font-semibold mb-2">🎓 Expert Content</h3>
                  <p className="text-muted-foreground">
                    Learn from industry professionals with real-world experience
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm card-glow">
                  <h3 className="text-lg font-semibold mb-2">📈 Progress Tracking</h3>
                  <p className="text-muted-foreground">
                    Monitor your learning journey with detailed analytics
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm card-glow">
                  <h3 className="text-lg font-semibold mb-2">🇻🇳 Vietnamese Focus</h3>
                  <p className="text-muted-foreground">
                    Content optimized for Vietnamese developers and market
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p>
                Have questions? We'd love to hear from you. Reach out to our team 
                at <a href="mailto:info@ai-elearning.com" className="text-primary">
                info@ai-elearning.com</a>
              </p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  )
}