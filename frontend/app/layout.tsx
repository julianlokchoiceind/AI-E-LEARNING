import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/session-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI E-Learning Platform',
  description: 'Master AI/ML through high-quality video courses with intelligent AI assistants',
  keywords: 'AI, Machine Learning, E-Learning, Online Courses, Programming, Vietnamese',
  authors: [{ name: 'AI E-Learning Team' }],
  openGraph: {
    title: 'AI E-Learning Platform',
    description: 'Master AI/ML through high-quality video courses with intelligent AI assistants',
    type: 'website',
    locale: 'vi_VN',
    alternateLocale: 'en_US',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}