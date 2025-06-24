'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold gradient-text">AI E-Learning</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/courses" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Courses
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/my-courses" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    My Learning
                  </Link>
                </>
              )}
              <Link href="/about" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                About
              </Link>
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="flex items-center text-sm text-gray-700 hover:text-gray-900">
                  <User className="h-5 w-5 mr-1" />
                  {user?.email?.split('@')[0]}
                </Link>
                <button
                  onClick={() => logout()}
                  className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/courses" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Courses
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Dashboard
                  </Link>
                  <Link href="/my-courses" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    My Learning
                  </Link>
                </>
              )}
              <Link href="/about" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                About
              </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="px-2 space-y-1">
                  <Link href="/profile" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Profile ({user?.email?.split('@')[0]})
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="px-2 space-y-1">
                  <Link href="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Sign In
                  </Link>
                  <Link href="/register" className="block px-3 py-2 text-base font-medium text-white bg-primary hover:bg-primary/90 text-center">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}