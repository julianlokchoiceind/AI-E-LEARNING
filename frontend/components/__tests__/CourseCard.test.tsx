import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CourseCard } from '../feature/CourseCard';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('next-auth/react');
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('CourseCard Component', () => {
  const mockCourse = {
    _id: 'course-123',
    title: 'AI Programming Fundamentals',
    description: 'Learn the basics of AI programming with Python',
    short_description: 'Basic AI programming course',
    thumbnail: '/course-thumbnail.jpg',
    category: 'ai-fundamentals',
    level: 'beginner',
    creator_name: 'John Doe',
    pricing: {
      is_free: false,
      price: 49.99,
      currency: 'USD'
    },
    stats: {
      total_enrollments: 150,
      average_rating: 4.5,
      total_reviews: 30
    },
    total_duration: 120,
    total_lessons: 12
  };

  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      status: 'authenticated'
    } as any);
    jest.clearAllMocks();
  });

  describe('Course Information Display', () => {
    it('should display course title and description', () => {
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
      expect(screen.getByText(mockCourse.short_description)).toBeInTheDocument();
    });

    it('should display course instructor', () => {
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText(`By ${mockCourse.creator_name}`)).toBeInTheDocument();
    });

    it('should display course metadata', () => {
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('12 lessons')).toBeInTheDocument();
      expect(screen.getByText('2h')).toBeInTheDocument();
    });

    it('should display course rating', () => {
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('(30 reviews)')).toBeInTheDocument();
    });

    it('should display enrollment count', () => {
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText('150 students')).toBeInTheDocument();
    });
  });

  describe('Pricing Display', () => {
    it('should display price for paid courses', () => {
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    it('should display Free badge for free courses', () => {
      const freeCourse = {
        ...mockCourse,
        pricing: { ...mockCourse.pricing, is_free: true, price: 0 }
      };
      
      render(<CourseCard course={freeCourse} />);
      
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.queryByText('$49.99')).not.toBeInTheDocument();
    });

    it('should display discount price when available', () => {
      const discountCourse = {
        ...mockCourse,
        pricing: {
          ...mockCourse.pricing,
          discount_price: 29.99,
          discount_expires: new Date(Date.now() + 86400000).toISOString()
        }
      };
      
      render(<CourseCard course={discountCourse} />);
      
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toHaveClass('line-through');
    });
  });

  describe('Enrollment Actions', () => {
    it('should show "Enroll Now" button for unenrolled courses', () => {
      render(<CourseCard course={mockCourse} enrolled={false} />);
      
      expect(screen.getByText('Enroll Now')).toBeInTheDocument();
    });

    it('should show "Continue Learning" for enrolled courses', () => {
      render(<CourseCard course={mockCourse} enrolled={true} />);
      
      expect(screen.getByText('Continue Learning')).toBeInTheDocument();
    });

    it('should navigate to course page when clicking on course card', () => {
      render(<CourseCard course={mockCourse} />);
      
      fireEvent.click(screen.getByRole('article'));
      
      expect(mockRouter.push).toHaveBeenCalledWith('/courses/course-123');
    });

    it('should handle enrollment for free courses', async () => {
      const freeCourse = {
        ...mockCourse,
        pricing: { ...mockCourse.pricing, is_free: true, price: 0 }
      };
      
      const mockOnEnroll = jest.fn().mockResolvedValue(true);
      render(<CourseCard course={freeCourse} onEnroll={mockOnEnroll} />);
      
      fireEvent.click(screen.getByText('Enroll Now'));
      
      await waitFor(() => {
        expect(mockOnEnroll).toHaveBeenCalledWith(freeCourse._id);
      });
    });

    it('should navigate to checkout for paid courses', () => {
      render(<CourseCard course={mockCourse} />);
      
      fireEvent.click(screen.getByText('Enroll Now'));
      
      expect(mockRouter.push).toHaveBeenCalledWith('/checkout/course/course-123');
    });
  });

  describe('Authentication States', () => {
    it('should prompt login for unauthenticated users', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any);
      
      render(<CourseCard course={mockCourse} />);
      
      fireEvent.click(screen.getByText('Enroll Now'));
      
      expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=/courses/course-123');
    });

    it('should show loading state during authentication', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      } as any);
      
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes', () => {
      render(<CourseCard course={mockCourse} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveClass('hover:shadow-lg');
      expect(card).toHaveClass('transition-shadow');
    });

    it('should handle mobile-friendly touch interactions', () => {
      render(<CourseCard course={mockCourse} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('active:scale-95');
      expect(card).toHaveClass('active:shadow-md');
    });
  });

  describe('Course Categories', () => {
    it('should display category badge', () => {
      render(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText('AI Fundamentals')).toBeInTheDocument();
    });

    it('should handle different course levels', () => {
      const advancedCourse = {
        ...mockCourse,
        level: 'advanced' as const
      };
      
      render(<CourseCard course={advancedCourse} />);
      
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing course data gracefully', () => {
      const incompleteCourse = {
        ...mockCourse,
        thumbnail: undefined,
        stats: undefined
    } as any;
      
      render(<CourseCard course={incompleteCourse} />);
      
      expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
    });

    it('should handle enrollment errors', async () => {
      const mockOnEnroll = jest.fn().mockRejectedValue(new Error('Enrollment failed'));
      render(<CourseCard course={mockCourse} onEnroll={mockOnEnroll} />);
      
      const freeCourse = {
        ...mockCourse,
        pricing: { ...mockCourse.pricing, is_free: true }
      };
      
      render(<CourseCard course={freeCourse} onEnroll={mockOnEnroll} />);
      
      fireEvent.click(screen.getByText('Enroll Now'));
      
      await waitFor(() => {
        expect(mockOnEnroll).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CourseCard course={mockCourse} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining(mockCourse.title));
    });

    it('should have keyboard navigation support', () => {
      render(<CourseCard course={mockCourse} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should handle keyboard events', () => {
      render(<CourseCard course={mockCourse} />);
      
      const card = screen.getByRole('article');
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockRouter.push).toHaveBeenCalledWith('/courses/course-123');
      
      fireEvent.keyDown(card, { key: ' ' });
      expect(mockRouter.push).toHaveBeenCalledWith('/courses/course-123');
    });
  });

  describe('Performance', () => {
    it('should have optimized image loading', () => {
      render(<CourseCard course={mockCourse} />);
      
      const image = screen.getByAltText(mockCourse.title);
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should prevent unnecessary re-renders', () => {
      const { rerender } = render(<CourseCard course={mockCourse} />);
      
      // Simulate same props re-render
      rerender(<CourseCard course={mockCourse} />);
      
      expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
    });
  });
});