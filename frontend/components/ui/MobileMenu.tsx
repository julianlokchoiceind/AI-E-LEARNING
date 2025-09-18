'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, User, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCoursesQuery } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSwitcherCompact } from '@/components/ui/LanguageSwitcher';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<{name: string, slug: string} | null>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Categories from CategoryDropdown - tái sử dụng data
  const categories = [
    { name: "AI Fundamentals", slug: "ml-basics" },
    { name: "Machine Learning", slug: "machine-learning" },
    { name: "Deep Learning", slug: "deep-learning" },
    { name: "NLP", slug: "nlp" },
    { name: "Computer Vision", slug: "computer-vision" },
    { name: "Generative AI", slug: "generative-ai" },
    { name: "AI in Business", slug: "ai-in-business" },
  ];

  // Fetch courses when category selected - tái sử dụng từ CategoryDropdown
  const { data: coursesData } = useCoursesQuery({
    category: selectedCategory?.slug,
    limit: 5,
    enabled: !!selectedCategory
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

  // Reset view when menu opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(null);
    }
  }, [isOpen]);

  const handleCategoryClick = (category: {name: string, slug: string}) => {
    setSelectedCategory(category);
    // View will change automatically if courses exist (handled in render logic)
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
    setSelectedCategory(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - tái sử dụng từ MobileNavigationDrawer */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer - tái sử dụng structure từ MobileNavigationDrawer */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-card z-50 transform transition-transform duration-300 md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header - tái sử dụng style từ MobileNavigationDrawer */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold text-foreground">
            {!selectedCategory || courses.length === 0 ? 'Menu' : selectedCategory?.name}
          </h2>
          {selectedCategory && courses.length > 0 ? (
            <button
              onClick={goBack}
              className="p-2 bg-primary/10 text-primary rounded-lg"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-2 bg-primary/10 text-primary rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content - tái sử dụng scroll pattern từ MobileNavigationDrawer */}
        <div className="flex-1 overflow-y-auto">
          {!selectedCategory || courses.length === 0 ? (
            /* VIEW 1: Main Menu */
            <>
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

              {/* Divider - light grey separator */}
              <div className="border-t border-border/30 mx-4 my-2" />

              {/* Navigation Links Section */}
              <div className="py-2">
                <button
                  onClick={() => handleNavLinkClick('/about')}
                  className="w-full text-left px-4 py-3 nav-hover transition-colors"
                >
                  <span className="font-medium">About</span>
                </button>
                <button
                  onClick={() => handleNavLinkClick('/faq')}
                  className="w-full text-left px-4 py-3 nav-hover transition-colors"
                >
                  <span className="font-medium">FAQ</span>
                </button>
              </div>

              {/* Bottom Section: Language Switcher + Auth */}
              <div className="border-t border-border/30 mx-4 my-2" />

              <div className="py-2">
                {/* Language Switcher */}
                <div className="px-4 py-1">
                  <LanguageSwitcherCompact />
                </div>

                {/* Auth Section - Show for non-authenticated users */}
                {!isAuthenticated && (
                  <>
                    <button
                      onClick={() => handleNavLinkClick('/login')}
                      className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center"
                    >
                      <LogIn className="h-4 w-4 mr-3" />
                      <span className="font-medium">Sign In</span>
                    </button>
                    <button
                      onClick={() => handleNavLinkClick('/register')}
                      className="w-full text-left px-4 py-3 nav-hover transition-colors flex items-center"
                    >
                      <User className="h-4 w-4 mr-3" />
                      <span className="font-medium">Get Started</span>
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            /* VIEW 2: Courses List */
            <div className="py-2">
              {courses.map((course: any) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="w-full text-left px-4 py-3 nav-hover transition-colors"
                >
                  <span className="font-medium">{course.title}</span>
                </button>
              ))}

              {/* View all button */}
              <button
                onClick={() => handleNavLinkClick(`/courses?category=${selectedCategory?.slug}`)}
                className="w-full text-left px-4 py-3 nav-hover transition-colors"
              >
                <span className="font-medium">View all →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}