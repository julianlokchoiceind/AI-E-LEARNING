'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, BookOpen, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { MobileMenu } from '@/components/ui/MobileMenu'
import { useNavigationTranslations } from '@/lib/i18n/hooks'
import { LanguageSwitcherCompact } from '@/components/ui/LanguageSwitcher'
import { useLocalizedRouter } from '@/lib/i18n/context'
import { Badge } from '@/components/ui/Badge'
import { Container } from '@/components/ui/Container'
import { SkeletonBox, SkeletonCircle } from '@/components/ui/LoadingStates'
import { useSupportNotifications } from '@/hooks/useSupportNotifications'

export function Header() {
  const { user, isAuthenticated, logout, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [userMenuPosition, setUserMenuPosition] = useState({ right: 0, top: 64 })
  const { navItems, t } = useNavigationTranslations()
  const router = useLocalizedRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  const explorerRef = useRef<HTMLDivElement>(null)
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  
  // Support notifications polling every 30 seconds
  const { unreadCount } = useSupportNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (explorerRef.current && !explorerRef.current.contains(event.target as Node)) {
        setExplorerOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate user menu position
  useEffect(() => {
    if (userButtonRef.current && userMenuOpen) {
      const rect = userButtonRef.current.getBoundingClientRect()
      setUserMenuPosition({
        right: window.innerWidth - rect.right,
        top: 64 // Header height
      })
    }
  }, [userMenuOpen])

  return (
    <>
      <header className="bg-background shadow-sm border-b relative">
        <Container variant="header">
          <div className="flex h-16 justify-between items-center">
            {/* Mobile Layout: 3-column structure */}
            <div className="flex items-center flex-1 md:flex-none">
              {/* Mobile hamburger menu - LEFT */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md nav-hover mr-3 md:hidden"
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="block h-6 w-6" />
              </button>

              {/* Logo - Center on mobile, left on desktop */}
              <div className="flex-1 flex justify-center md:flex-none md:justify-start">
                <Link href="/" className="flex-shrink-0">
                  <h1 className="text-2xl font-bold gradient-text">AI E-Learning</h1>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {/* Explorer Dropdown */}
                <div className="relative" ref={explorerRef}>
                  <button
                    ref={exploreButtonRef}
                    onMouseEnter={() => setExplorerOpen(true)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 border border-transparent px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md"
                  >
                    Explore
                  </button>
                </div>

              <button
                onClick={() => router.push('/about')}
                className="link-hover px-3 py-2 text-sm font-medium"
              >
                {navItems.about}
              </button>
              <button
                onClick={() => router.push('/faq')}
                className="link-hover px-3 py-2 text-sm font-medium"
              >
                {navItems.faq}
              </button>
            </div>
          </div>

          {/* Auth Section - Mobile: compact, Desktop: full */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <LanguageSwitcherCompact className="hidden md:block mr-2" />
            {loading ? (
              /* Show loading skeleton to prevent hydration mismatch */
              <div className="flex items-center space-x-2">
                <SkeletonCircle className="w-8 h-8" />
                <SkeletonBox className="w-20 h-4" />
              </div>
            ) : isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  ref={userButtonRef}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-sm nav-hover px-3 py-2 rounded-md transition-colors relative"
                >
                  <div className="relative inline-block mr-1 md:mr-1">
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
                  <span className="hidden md:inline">{user?.name || user?.email || 'User'}</span>
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform hidden md:inline ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="hidden md:inline-flex link-hover px-3 py-2 text-sm font-medium"
                >
                  {t('auth.signIn')}
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="hidden md:inline-flex btn-primary text-sm px-4"
                >
                  {t('auth.getStarted')}
                </button>
              </>
            )}
          </div>

        </div>

      </Container>
    </header>

    {/* Category Dropdown - Rendered outside header for full positioning freedom */}
    {explorerOpen && (
      <CategoryDropdown
        onClose={() => setExplorerOpen(false)}
        buttonRef={exploreButtonRef}
      />
    )}

    {/* User Dropdown - Rendered outside header for full positioning freedom */}
    {userMenuOpen && (
      <div
        ref={userMenuRef}
        className="fixed bg-card rounded-md shadow-lg py-1 z-50 border border-border w-56"
        style={{
          right: userMenuPosition.right,
          top: userMenuPosition.top
        }}
      >
        <button
          onClick={() => {
            router.push('/dashboard')
            setUserMenuOpen(false)
          }}
          className="flex items-center w-full px-4 py-2 text-sm nav-hover"
        >
          <LayoutDashboard className="h-4 w-4 mr-3" />
          {navItems.dashboard}
        </button>
        <button
          onClick={() => {
            router.push('/my-courses')
            setUserMenuOpen(false)
          }}
          className="flex items-center w-full px-4 py-2 text-sm nav-hover"
        >
          <BookOpen className="h-4 w-4 mr-3" />
          {navItems.myCourses}
        </button>
        <button
          onClick={() => {
            router.push('/profile')
            setUserMenuOpen(false)
          }}
          className="flex items-center w-full px-4 py-2 text-sm nav-hover"
        >
          <User className="h-4 w-4 mr-3" />
          {navItems.profile}
        </button>
        <button
          onClick={() => {
            router.push('/support')
            setUserMenuOpen(false)
          }}
          className="flex items-center w-full px-4 py-2 text-sm nav-hover relative"
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
          className="flex items-center w-full px-4 py-2 text-sm nav-hover"
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
          className="flex items-center w-full px-4 py-2 text-sm nav-hover"
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
          className="flex items-center w-full px-4 py-2 text-sm nav-hover"
        >
          <LogOut className="h-4 w-4 mr-3" />
          {t('auth.logout')}
        </button>
      </div>
    )}

    {/* Mobile Menu */}
    <MobileMenu
      isOpen={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    />
    </>
  )
}