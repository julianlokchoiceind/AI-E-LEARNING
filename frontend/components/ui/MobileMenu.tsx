'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, User, LogIn, LayoutDashboard, BookOpen, Headphones, Settings, LogOut } from 'lucide-react';
import { useCoursesQuery } from '@/hooks/queries/useCourses';
import { useUserProfileQuery } from '@/hooks/queries/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSwitcherMobile } from '@/components/ui/LanguageSwitcher';
import { useI18n, useLocalizedRouter } from '@/lib/i18n/context';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<{name: string, slug: string} | null>(null);
  const [isSubview, setIsSubview] = useState(false);
  const router = useLocalizedRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, locale } = useI18n();

  // Fetch user profile for avatar (same pattern as Header)
  const { data: profileData } = useUserProfileQuery(isAuthenticated);
  const profile = profileData?.data;

  // 4 main categories with translated names
  const categories = [
    { name: t('categories.ml_basics'), slug: "ml-basics" },
    { name: t('categories.generative_ai'), slug: "generative-ai" },
    { name: t('categories.deep_learning'), slug: "deep-learning" },
    { name: t('categories.ai_for_work'), slug: "ai-for-work" },
  ];

  // Fetch courses when category selected (filtered by current language)
  const { data: coursesData } = useCoursesQuery({
    category: selectedCategory?.slug,
    limit: 5,
    language: locale
  });

  const courses = coursesData?.data?.courses || [];

  // Body scroll lock - tái sử dụng từ Modal.tsx
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset view when menu opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Delay reset so close animation finishes first
      const t = setTimeout(() => { setSelectedCategory(null); setIsSubview(false); }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleCategoryClick = (category: {name: string, slug: string}) => {
    setSelectedCategory(category);
    setIsSubview(true);
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
    onClose();
  };

  const handleNavLinkClick = (href: string) => {
    router.push(href);
    onClose();
  };

  const goBack = () => {
    setIsSubview(false);
    setTimeout(() => setSelectedCategory(null), 280);
  };

  return (
    <>
      {/* Backdrop - fade in/out */}
      <div
        className={`fixed inset-0 bg-black z-40 md:hidden transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer - slide in from left */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-card z-50 transform transition-transform duration-300 ease-in-out md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          {/* Title slides between "Menu" and category name */}
          <div className="relative h-7 flex-1 overflow-hidden">
            <h2 className={`absolute text-lg font-semibold text-foreground transition-all duration-280 ease-in-out
              ${isSubview ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
              Menu
            </h2>
            <h2 className={`absolute text-lg font-semibold text-foreground transition-all duration-280 ease-in-out
              ${isSubview ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
              {selectedCategory?.name}
            </h2>
          </div>
          {/* Button: back arrow in subview, X in main */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <button
              onClick={goBack}
              className={`absolute inset-0 flex items-center justify-center p-2 bg-primary/10 text-primary rounded-lg transition-all duration-280
                ${isSubview ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className={`absolute inset-0 flex items-center justify-center p-2 bg-primary/10 text-primary rounded-lg transition-all duration-280
                ${isSubview ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content — sliding panels side by side */}
        <div className="flex-1 overflow-hidden">
          <div className={`flex h-full transition-transform duration-280 ease-in-out
            ${isSubview ? '-translate-x-1/2' : 'translate-x-0'}`}
            style={{ width: '200%' }}
          >
            {/* VIEW 1: Main Menu (left panel) */}
            <div className="w-1/2 h-full overflow-y-auto">
              {/* Categories Section */}
              <div className="py-2">
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">{category.name}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>

              <div className="border-t border-border/30 mx-4 my-2" />

              <div className="py-2">
                <button onClick={() => handleNavLinkClick('/about')} className="w-full text-left px-4 py-3 nav-hover transition-colors">
                  <span className="font-medium">{t('nav.about')}</span>
                </button>
                <button onClick={() => handleNavLinkClick('/faq')} className="w-full text-left px-4 py-3 nav-hover transition-colors">
                  <span className="font-medium">{t('nav.faq')}</span>
                </button>
              </div>

              <div className="border-t border-border/30 mx-4 my-2" />

              <div className="py-2">
                <div className="px-4 py-3">
                  <LanguageSwitcherMobile />
                </div>

                {isAuthenticated && user ? (
                  <>
                    <div className="px-4 py-3 flex items-center gap-3 border-b border-border/30 mb-2">
                      {profile?.profile?.avatar ? (
                        <img src={profile.profile.avatar} alt={profile?.name || user?.name || 'User'} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{profile?.name || user?.name || 'User'}</p>
                        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <button onClick={() => handleNavLinkClick('/dashboard')} className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center">
                      <LayoutDashboard className="h-4 w-4 mr-3" /><span className="font-medium">{t('nav.dashboard')}</span>
                    </button>
                    <button onClick={() => handleNavLinkClick('/my-courses')} className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center">
                      <BookOpen className="h-4 w-4 mr-3" /><span className="font-medium">{t('nav.myCourses')}</span>
                    </button>
                    <button onClick={() => handleNavLinkClick('/contact')} className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center">
                      <Headphones className="h-4 w-4 mr-3" /><span className="font-medium">{t('nav.support')}</span>
                    </button>
                    <button onClick={() => handleNavLinkClick('/settings')} className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center">
                      <Settings className="h-4 w-4 mr-3" /><span className="font-medium">{t('nav.settings')}</span>
                    </button>
                    <button onClick={() => { logout(); onClose(); }} className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center text-destructive">
                      <LogOut className="h-4 w-4 mr-3" /><span className="font-medium">{t('nav.logout')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleNavLinkClick('/login')} className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center">
                      <LogIn className="h-4 w-4 mr-3" /><span className="font-medium">{t('nav.login')}</span>
                    </button>
                    <button onClick={() => handleNavLinkClick('/register')} className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center">
                      <User className="h-4 w-4 mr-3" /><span className="font-medium">{t('nav.register')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* VIEW 2: Courses List (right panel) */}
            <div className="w-1/2 h-full overflow-y-auto">
              <div className="py-2">
                {courses.map((course: any) => (
                  <button key={course.id} onClick={() => handleCourseClick(course.id)} className="w-full text-left px-4 py-3 nav-hover transition-colors">
                    <span className="font-medium">{course.title}</span>
                  </button>
                ))}
                <button onClick={() => handleNavLinkClick(`/courses?category=${selectedCategory?.slug}`)} className="w-full text-left px-4 py-3 nav-hover transition-colors text-primary">
                  <span className="font-medium">View all →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}