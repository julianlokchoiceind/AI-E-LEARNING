'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, BookOpen, Settings, Headphones, CreditCard } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { MobileMenu } from '@/components/ui/MobileMenu'
import { HeaderSearchBar } from '@/components/ui/HeaderSearchBar'
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

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (explorerRef.current && !explorerRef.current.contains(event.target as Node)) {
        setExplorerOpen(false)
      }
    }

    const handleScroll = () => {
      setUserMenuOpen(false)
      setExplorerOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('scroll', handleScroll, true) // Use capture phase for all scroll events
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
    }
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
          <div className="flex h-16 items-center justify-between md:gap-4">
            {/* Mobile: Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md nav-hover"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop: Left Side - Logo + Explorer */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/images/logo/choice-logo-192x192.png"
                  alt="CHOICE"
                  width={48}
                  height={48}
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </Link>

              {/* Explorer (Desktop Only) */}
              <div className="relative" ref={explorerRef}>
                <button
                  ref={exploreButtonRef}
                  onMouseEnter={() => setExplorerOpen(true)}
                  className="px-3 py-2 text-sm font-medium rounded-md border border-transparent text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all duration-200"
                >
                  Explore
                </button>
              </div>
            </div>

            {/* Mobile: Logo on Right */}
            <div className="md:hidden">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/images/logo/choice-logo-192x192.png"
                  alt="CHOICE"
                  width={48}
                  height={48}
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </Link>
            </div>

            {/* Center: Search Bar (Desktop Only - Full Width) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
              <HeaderSearchBar />
            </div>

            {/* Right: Navigation + Auth - Hidden on mobile for centered logo */}
            <div className="hidden md:flex items-center gap-2 md:gap-3">
              {/* Navigation Links (Desktop Only) */}
              <button
                onClick={() => router.push('/about')}
                className="px-3 py-2 text-sm font-medium link-hover whitespace-nowrap"
              >
                {navItems.about}
              </button>
              <button
                onClick={() => router.push('/faq')}
                className="px-3 py-2 text-sm font-medium link-hover whitespace-nowrap"
              >
                {navItems.faq}
              </button>

              {/* Language Switcher */}
              <LanguageSwitcherCompact />

              {/* Auth Section */}
              {loading ? (
                <div className="flex items-center gap-2">
                  <SkeletonCircle className="w-8 h-8" />
                  <SkeletonBox className="w-20 h-4" />
                </div>
              ) : isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    ref={userButtonRef}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1 px-3 py-2 text-sm nav-hover rounded-md transition-colors relative"
                  >
                    <div className="relative">
                      <User className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-destructive rounded-full flex items-center justify-center border-[1.5px] border-background shadow-sm px-0.5 translate-x-1/4 -translate-y-1/4">
                          <span className="text-[9px] font-bold text-white leading-none">
                            {unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="hidden md:inline">{user?.name || user?.email || 'User'}</span>
                    <ChevronDown className={`hidden md:inline h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {t('auth.signIn')}
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="px-4 py-2 text-sm btn-primary"
                  >
                    {t('auth.getStarted')}
                  </button>
                </div>
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
            <Headphones className="h-4 w-4" />
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
          <CreditCard className="h-4 w-4 mr-3" />
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