'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useCoursesQuery } from '@/hooks/queries/useCourses';

interface CategoryDropdownProps {
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export function CategoryDropdown({ onClose, buttonRef }: CategoryDropdownProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 64 });
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
    category: hoveredCategory || undefined,
    limit: 5
  });

  const courses = coursesData?.data?.courses || [];

  // Calculate position based on button position
  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        left: rect.left,
        top: 64 // Header height
      });
    }
  }, [buttonRef]);

  const handleCategoryClick = (slug: string) => {
    router.push(`/courses?category=${slug}`);
    onClose();
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
    onClose();
  };


  return (
    <div
      className="category-dropdown fixed bg-card shadow-lg border border-border rounded-lg z-50 flex"
      onMouseLeave={onClose}
      style={{
        left: position.left,
        top: position.top
      }}
    >
      {/* Categories Column */}
      <div className="w-[220px] border-r border-border">
        {categories.map(cat => (
          <button
            key={cat.slug}
            onMouseEnter={() => setHoveredCategory(cat.slug)}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`w-full text-left px-4 py-3 nav-hover transition-colors flex items-center justify-between ${
              hoveredCategory === cat.slug ? 'bg-primary/10 text-primary' : ''
            }`}
          >
            <span className="font-medium">{cat.name}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Courses Column - Show on hover only when courses exist */}
      {hoveredCategory && courses.length > 0 && (
        <div className="w-[320px] border-r border-border">
          {courses.map((course: any) => (
            <button
              key={course.id}
              onMouseDown={() => handleCourseClick(course.id)}
              className="w-full text-left px-4 py-3 nav-hover transition-colors"
            >
              <span className="font-medium">{course.title}</span>
            </button>
          ))}

          <button
            onMouseDown={() => handleCategoryClick(hoveredCategory)}
            className="w-full text-left px-4 py-3 nav-hover transition-colors"
          >
            <span className="font-medium">View all →</span>
          </button>
        </div>
      )}
    </div>
  );
}