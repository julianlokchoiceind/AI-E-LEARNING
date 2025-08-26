'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, BookOpen, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigationTranslations } from '@/lib/i18n/hooks'
import { LanguageSwitcherCompact } from '@/components/ui/LanguageSwitcher'
import { useLocalizedRouter } from '@/lib/i18n/context'
import { Badge } from '@/components/ui/Badge'
import { useSupportNotifications } from '@/hooks/useSupportNotifications'

export function Header() {
  const { user, isAuthenticated, logout, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { navItems, t } = useNavigationTranslations()
  const router = useLocalizedRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // Support notifications polling every 30 seconds
  const { unreadCount } = useSupportNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-background shadow-sm border-b">
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
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium"
              >
                {navItems.courses}
              </button>
              <button
                onClick={() => router.push('/about')}
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium"
              >
                {navItems.about}
              </button>
              <button
                onClick={() => router.push('/faq')}
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium"
              >
                {navItems.faq}
              </button>
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <LanguageSwitcherCompact className="mr-2" />
            {loading ? (
              /* Show loading skeleton to prevent hydration mismatch */
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
              </div>
            ) : isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-accent transition-colors relative"
                >
                  <div className="relative inline-block mr-1">
                    <User className="h-5 w-5" />
                    {/* Support notification badge - consistent with AdminHeader */}
                    {unreadCount > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-destructive rounded-full flex items-center justify-center border-[1.5px] border-background shadow-sm px-0.5 transform translate-x-1/4 -translate-y-1/4">
                        <span className="text-[9px] font-bold text-white leading-none">
                          {unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <span>{user?.name || user?.email || 'User'}</span>
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg py-1 z-50 border border-border">
                    <button
                      onClick={() => {
                        router.push('/dashboard')
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-3" />
                      {navItems.dashboard}
                    </button>
                    <button
                      onClick={() => {
                        router.push('/my-courses')
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <BookOpen className="h-4 w-4 mr-3" />
                      {navItems.myCourses}
                    </button>
                    <button
                      onClick={() => {
                        router.push('/profile')
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <User className="h-4 w-4 mr-3" />
                      {navItems.profile}
                    </button>
                    <button
                      onClick={() => {
                        router.push('/support')
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent relative"
                    >
                      <div className="relative inline-block mr-3">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {/* Support notification badge - consistent with AdminHeader */}
                        {unreadCount > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-destructive rounded-full flex items-center justify-center border-[1.5px] border-background shadow-sm px-0.5 transform translate-x-1/4 -translate-y-1/4">
                            <span className="text-[9px] font-bold text-white leading-none">
                              {unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      {t('nav.support')}
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => {
                        router.push('/billing')
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Billing
                    </button>
                    <button
                      onClick={() => {
                        router.push('/settings')
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => {
                        logout()
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      {t('auth.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium"
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
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
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
                className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {navItems.courses}
              </button>
              <button
                onClick={() => router.push('/about')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {navItems.about}
              </button>
              <button
                onClick={() => router.push('/faq')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {navItems.faq}
              </button>
            </div>
            <div className="pt-4 pb-3 border-t border-border">
              <div className="px-2 mb-3">
                <LanguageSwitcherCompact />
              </div>
              {loading ? (
                /* Mobile loading skeleton */
                <div className="px-2 space-y-2">
                  <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
                  <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
                </div>
              ) : isAuthenticated ? (
                <div className="px-2 space-y-1">
                  <div className="px-3 py-2 text-base font-medium text-foreground">
                    {user?.name || user?.email || 'User'}
                  </div>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    {navItems.dashboard}
                  </button>
                  <button
                    onClick={() => router.push('/my-courses')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    {navItems.myCourses}
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    {navItems.profile}
                  </button>
                  <button
                    onClick={() => router.push('/support')}
                    className="flex items-center w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <span className="flex-1">{t('nav.support')}</span>
                    {/* Support notification badge for mobile */}
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        size="sm" 
                        className="h-4 w-4 p-0 flex items-center justify-center text-xs min-w-[16px]"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </button>
                  <button
                    onClick={() => router.push('/billing')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    Billing
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    Settings
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button
                    onClick={() => logout()}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <div className="px-2 space-y-1">
                  <button
                    onClick={() => router.push('/login')}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
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