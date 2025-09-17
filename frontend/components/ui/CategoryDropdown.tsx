'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useCoursesQuery } from '@/hooks/queries/useCourses';

interface CategoryDropdownProps {
  onClose: () => void;
}

export function CategoryDropdown({ onClose }: CategoryDropdownProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const router = useRouter();

  const categories = [
    { name: "AI Fundamentals", slug: "ml-basics" },
    { name: "Machine Learning", slug: "machine-learning" },
    { name: "Deep Learning", slug: "deep-learning" },
    { name: "NLP", slug: "nlp" },
    { name: "Computer Vision", slug: "computer-vision" },
    { name: "Generative AI", slug: "generative-ai" },
    { name: "AI in Business", slug: "ai-in-business" },
  ];

  // Fetch courses when hovering a category
  const { data: coursesData } = useCoursesQuery({
    category: hoveredCategory,
    limit: 5,
    enabled: !!hoveredCategory
  });

  const courses = coursesData?.data?.courses || [];

  const handleCategoryClick = (slug: string) => {
    router.push(`/courses?category=${slug}`);
    onClose();
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
    onClose();
  };

  const handleViewAllClick = () => {
    router.push('/courses');
    onClose();
  };

  return (
    <div
      className="category-dropdown absolute left-0 mt-2 bg-card rounded-lg shadow-lg border border-border z-50 flex"
      onMouseLeave={onClose}
    >
      {/* Categories Column */}
      <div className="w-[220px] border-r border-border">
        {categories.map(cat => (
          <button
            key={cat.slug}
            onMouseEnter={() => setHoveredCategory(cat.slug)}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center justify-between ${
              hoveredCategory === cat.slug ? 'bg-accent' : ''
            }`}
          >
            <span className="font-medium text-foreground">{cat.name}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}

        {/* View All Courses */}
        <div className="border-t border-border">
          <button
            onClick={handleViewAllClick}
            className="block w-full px-4 py-3 text-center text-primary hover:bg-accent transition-colors font-medium"
          >
            View All Courses →
          </button>
        </div>
      </div>

      {/* Courses Column - Show on hover */}
      {hoveredCategory && (
        <div className="w-[320px] p-4">
          {courses.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground mb-3">
                Courses in {categories.find(c => c.slug === hoveredCategory)?.name}
              </div>

              <div className="space-y-1">
                {courses.map((course: any) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className="block w-full text-left p-2 rounded hover:bg-accent transition-colors"
                  >
                    <div className="font-medium text-sm text-foreground line-clamp-1">
                      {course.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{course.lessons_count || 0} lessons</span>
                      <span className="text-primary font-medium">
                        {course.is_free ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* View all in category */}
              <button
                onClick={() => handleCategoryClick(hoveredCategory)}
                className="block w-full mt-3 pt-3 border-t border-border text-center text-sm text-primary hover:text-primary/80"
              >
                View all →
              </button>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No courses yet</p>
              <button
                onClick={handleViewAllClick}
                className="text-primary hover:text-primary/80 mt-2 inline-block"
              >
                Browse all courses →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}