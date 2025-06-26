'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigationTranslations } from '@/lib/i18n/hooks'
import { LanguageSwitcherCompact } from '@/components/ui/LanguageSwitcher'
import { useLocalizedRouter } from '@/lib/i18n/context'

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { navItems, t } = useNavigationTranslations()
  const router = useLocalizedRouter()

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
              <button
                onClick={() => router.push('/courses')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                {navItems.courses}
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    {navItems.dashboard}
                  </button>
                  <button
                    onClick={() => router.push('/my-courses')}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    {navItems.myCourses}
                  </button>
                  <button
                    onClick={() => router.push('/support')}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    {t('nav.support')}
                  </button>
                </>
              )}
              <button
                onClick={() => router.push('/about')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                {navItems.about}
              </button>
              <button
                onClick={() => router.push('/faq')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                {navItems.faq}
              </button>
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <LanguageSwitcherCompact className="mr-2" />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                >
                  <User className="h-5 w-5 mr-1" />
                  {user?.email?.split('@')[0]}
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  {t('auth.signIn')}
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="btn-primary text-sm"
                >
                  {t('auth.getStarted')}
                </button>
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
              <button
                onClick={() => router.push('/courses')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                {navItems.courses}
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {navItems.dashboard}
                  </button>
                  <button
                    onClick={() => router.push('/my-courses')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {navItems.myCourses}
                  </button>
                  <button
                    onClick={() => router.push('/support')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {t('nav.support')}
                  </button>
                </>
              )}
              <button
                onClick={() => router.push('/about')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                {navItems.about}
              </button>
              <button
                onClick={() => router.push('/faq')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                {navItems.faq}
              </button>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-2 mb-3">
                <LanguageSwitcherCompact />
              </div>
              {isAuthenticated ? (
                <div className="px-2 space-y-1">
                  <button
                    onClick={() => router.push('/profile')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {navItems.profile} ({user?.email?.split('@')[0]})
                  </button>
                  <button
                    onClick={() => logout()}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <div className="px-2 space-y-1">
                  <button
                    onClick={() => router.push('/login')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    {t('auth.signIn')}
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="block w-full px-3 py-2 text-base font-medium text-white bg-primary hover:bg-primary/90 text-center"
                  >
                    {t('auth.getStarted')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}