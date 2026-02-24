'use client'

import Image from 'next/image'
import { LocaleLink } from '@/components/ui/LocaleLink'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, LogOut, ChevronDown, LayoutDashboard, BookOpen, Settings, Headphones } from 'lucide-react'
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
import { useUserProfileQuery } from '@/hooks/queries/useUserProfile'
import { useHeaderTransparency } from '@/lib/hooks/useHeaderTransparency'

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

  // Header transparency from context (set by homepage hero)
  // Default is false when outside HeaderTransparencyProvider (dashboard, etc.)
  const { transparent } = useHeaderTransparency()

  // Support notifications polling every 30 seconds
  const { unreadCount } = useSupportNotifications()

  // Fetch user profile for realtime avatar and name updates
  const { data: profileData } = useUserProfileQuery(isAuthenticated)
  const profile = profileData?.data

  // Generate user initials for avatar placeholder
  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const [isScrolled, setIsScrolled] = useState(false)

  // Navbar scroll state - transparent → white+shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

    const handleScrollClose = () => {
      setUserMenuOpen(false)
      setExplorerOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('scroll', handleScrollClose, true) // Use capture phase for all scroll events
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScrollClose, true)
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
      <header className={transparent
        ? `glass-navbar fixed top-0 left-0 right-0 w-full z-40${isScrolled ? ' scrolled' : ''}`
        : 'bg-background shadow-sm border-b fixed top-0 left-0 right-0 w-full z-40'
      }>
        <Container variant="header">
          <div className="flex h-20 items-center justify-between md:gap-4">
            {/* Mobile: Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-md ${transparent && !isScrolled ? 'text-white hover:bg-white/10' : 'nav-hover'}`}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop: Left Side - Logo + Explorer */}
            <div className="hidden md:flex items-center gap-4">
              <LocaleLink href="/" className="flex-shrink-0">
                <Image
                  src="/images/logo/heartht-logo-192x192.png"
                  alt="HEART HT"
                  width={50}
                  height={50}
                  className="w-9 h-9 md:w-[50px] md:h-[50px]"
                />
              </LocaleLink>

              {/* Explorer (Desktop Only) */}
              <div className="relative" ref={explorerRef}>
                <button
                  ref={exploreButtonRef}
                  onMouseEnter={() => setExplorerOpen(true)}
                  className={`px-3 py-2 text-sm font-medium rounded-md border border-transparent transition-all duration-200 ${transparent && !isScrolled ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20'}`}
                >
                  {t('nav.explore')}
                </button>
              </div>
            </div>

            {/* Mobile: Logo on Right */}
            <div className="md:hidden">
              <LocaleLink href="/" className="flex-shrink-0">
                <Image
                  src="/images/logo/heartht-logo-192x192.png"
                  alt="HEART HT"
                  width={40}
                  height={40}
                  className="w-9 h-9"
                />
              </LocaleLink>
            </div>

            {/* Center: Search Bar (Desktop Only) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
              <HeaderSearchBar transparent={transparent && !isScrolled} />
            </div>

            {/* Right: Navigation + Auth - Hidden on mobile for centered logo */}
            <div className="hidden md:flex items-center gap-2 md:gap-3">
              {/* Navigation Links (Desktop Only) */}
              <button
                onClick={() => router.push('/about')}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${transparent && !isScrolled ? 'text-white/90 hover:text-white' : 'link-hover'}`}
              >
                {navItems.about}
              </button>
              <button
                onClick={() => router.push('/faq')}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${transparent && !isScrolled ? 'text-white/90 hover:text-white' : 'link-hover'}`}
              >
                {navItems.faq}
              </button>

              {/* Language Switcher */}
              <LanguageSwitcherCompact className={transparent && !isScrolled ? 'text-white/90' : ''} />

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
                    className="flex items-center gap-2 px-2 py-2 text-sm nav-hover rounded-md transition-colors relative"
                  >
                    {/* Avatar with notification badge */}
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
                        {profile?.profile?.avatar ? (
                          <img
                            src={profile.profile.avatar}
                            alt={profile?.name || user?.name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {getInitials(profile?.name || user?.name || user?.email)}
                            </span>
                          </div>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-destructive rounded-full flex items-center justify-center border-[1.5px] border-background shadow-sm px-0.5 translate-x-1/4 -translate-y-1/4">
                          <span className="text-[9px] font-bold text-white leading-none">
                            {unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/login')}
                    className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${transparent && !isScrolled ? 'border-white/30 text-white hover:bg-white/10' : 'border-border hover:bg-primary/10 hover:text-primary'}`}
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
        className="fixed bg-card rounded-md shadow-lg z-50 border border-border w-64"
        style={{
          right: userMenuPosition.right,
          top: userMenuPosition.top
        }}
      >
        {/* User Info Header - GitHub Style */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
              {profile?.profile?.avatar ? (
                <img
                  src={profile.profile.avatar}
                  alt={profile?.name || user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <span className="text-base font-bold text-white">
                    {getInitials(profile?.name || user?.name || user?.email)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-sm">{profile?.name || user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
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
        </div>

        <div className="border-t border-border"></div>

        {/* Settings Section */}
        <div className="py-1">
        <button
          onClick={() => {
            router.push('/settings')
            setUserMenuOpen(false)
          }}
          className="flex items-center w-full px-4 py-2 text-sm nav-hover"
        >
          <Settings className="h-4 w-4 mr-3" />
          {navItems.settings}
        </button>
        </div>

        <div className="border-t border-border"></div>

        {/* Logout Section */}
        <div className="py-1">
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