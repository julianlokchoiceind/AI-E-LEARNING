# SEO Implementation Examples

## Basic Page SEO

```tsx
// app/courses/page.tsx
import { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useSEO, usePageTracking } from '@/hooks/useSEO';

export const metadata: Metadata = generateMetadata({
  title: 'AI Programming Courses - Learn with Expert Instructors',
  description: 'Discover our comprehensive AI programming courses. Learn Python, Machine Learning, Deep Learning and more with hands-on projects.',
  keywords: ['AI courses', 'programming', 'machine learning', 'python'],
  canonical: '/courses',
  locale: 'vi'
});

export default function CoursesPage() {
  // Track page views
  usePageTracking();

  const breadcrumbItems = [
    { name: 'Courses', current: true }
  ];

  return (
    <div>
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />
      {/* Page content */}
    </div>
  );
}
```

## Course Detail Page SEO

```tsx
// app/courses/[id]/page.tsx
import { Metadata } from 'next';
import { generateCourseMetadata } from '@/lib/seo/metadata';
import { CourseStructuredData } from '@/components/seo/StructuredData';
import { CourseBreadcrumbs } from '@/components/seo/Breadcrumbs';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const course = await fetchCourse(params.id);
  return generateCourseMetadata({ course });
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { course } = useCourse(params.id);
  const { trackCourseView } = usePageTracking();

  useEffect(() => {
    if (course) {
      trackCourseView(course._id, course.title);
    }
  }, [course]);

  if (!course) return <div>Loading...</div>;

  return (
    <div>
      {/* Course Structured Data */}
      <CourseStructuredData
        name={course.title}
        description={course.description}
        provider={{
          name: "AI E-Learning Platform",
          url: process.env.NEXT_PUBLIC_APP_URL!
        }}
        instructor={{
          name: course.creator_name
        }}
        category={course.category}
        level={course.level}
        duration={course.total_duration}
        lessons={course.total_lessons}
        price={course.pricing.is_free ? undefined : {
          amount: course.pricing.price,
          currency: 'USD'
        }}
        rating={course.stats.total_reviews > 0 ? {
          value: course.stats.average_rating,
          count: course.stats.total_reviews
        } : undefined}
        image={course.thumbnail}
        url={`${process.env.NEXT_PUBLIC_APP_URL}/courses/${course._id}`}
      />

      <CourseBreadcrumbs course={course} className="mb-6" />
      
      {/* Page content */}
    </div>
  );
}
```

## Lesson Page SEO

```tsx
// app/learn/[courseId]/[lessonId]/page.tsx
import { generateLessonMetadata } from '@/lib/seo/metadata';
import { VideoStructuredData } from '@/components/seo/StructuredData';
import { LessonBreadcrumbs } from '@/components/seo/Breadcrumbs';

export async function generateMetadata({ params }: { 
  params: { courseId: string; lessonId: string } 
}): Promise<Metadata> {
  const [course, lesson] = await Promise.all([
    fetchCourse(params.courseId),
    fetchLesson(params.lessonId)
  ]);
  
  return generateLessonMetadata({ lesson, course });
}

export default function LessonPage({ params }: { 
  params: { courseId: string; lessonId: string } 
}) {
  const { course, lesson } = useLesson(params.courseId, params.lessonId);
  const { trackVideoPlay } = usePageTracking();

  const handleVideoPlay = (position: number) => {
    trackVideoPlay(lesson.id, lesson.title, position);
  };

  return (
    <div>
      {/* Video Structured Data */}
      {lesson.video && (
        <VideoStructuredData
          name={lesson.title}
          description={lesson.description || `Lesson from ${course.title}`}
          thumbnail={lesson.video.thumbnail}
          duration={lesson.video.duration}
          uploadDate={lesson.created_at}
          publisher={{
            name: "AI E-Learning Platform",
            logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
          }}
        />
      )}

      <LessonBreadcrumbs course={course} lesson={lesson} className="mb-6" />
      
      {/* Video player and content */}
    </div>
  );
}
```

## FAQ Page SEO

```tsx
// app/faq/page.tsx
import { generateFAQMetadata } from '@/lib/seo/metadata';
import { FAQStructuredData } from '@/components/seo/StructuredData';

export async function generateMetadata(): Promise<Metadata> {
  const faqs = await fetchFAQs();
  return generateFAQMetadata({ faqs });
}

export default function FAQPage() {
  const { faqs } = useFAQs();

  return (
    <div>
      {/* FAQ Structured Data */}
      <FAQStructuredData 
        items={faqs.map(faq => ({
          question: faq.question,
          answer: faq.answer
        }))}
      />
      
      {/* FAQ content */}
    </div>
  );
}
```

## Dynamic SEO Updates

```tsx
// For client-side SEO updates
function MyComponent() {
  const { updateOpenGraph, updateTwitterCard } = useSocialMeta();
  
  useEffect(() => {
    // Update social meta tags dynamically
    updateOpenGraph({
      title: 'Dynamic Title',
      description: 'Dynamic description',
      image: '/dynamic-image.jpg'
    });
    
    updateTwitterCard({
      card: 'summary_large_image',
      title: 'Dynamic Title',
      description: 'Dynamic description'
    });
  }, []);
}
```

## Search Tracking

```tsx
function SearchPage() {
  const { trackSearch } = usePageTracking();
  
  const handleSearch = (query: string, results: any[]) => {
    trackSearch(query, results.length);
  };
}
```

## Course Enrollment Tracking

```tsx
function EnrollButton({ course }: { course: Course }) {
  const { trackCourseEnrollment } = usePageTracking();
  
  const handleEnroll = async () => {
    await enrollInCourse(course._id);
    trackCourseEnrollment(course._id, course.title, course.pricing.price);
  };
}
```