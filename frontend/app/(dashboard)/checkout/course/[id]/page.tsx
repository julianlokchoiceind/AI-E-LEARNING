'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CourseCheckoutForm } from '@/components/feature/CourseCheckoutForm';
import { getCourseById } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Clock, Users, BookOpen, ArrowLeft, Shield, CreditCard } from 'lucide-react';

export default function CourseCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/checkout/course/${courseId}`);
      return;
    }

    if (user && courseId) {
      fetchCourseAndInitializePayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, courseId, authLoading]);

  const fetchCourseAndInitializePayment = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await getCourseById(courseId);
      if (!courseResponse.success || !courseResponse.data) {
        throw new Error(courseResponse.message || 'Course not found');
      }
      
      const courseData = courseResponse.data;
      setCourse(courseData);

      // Check if course should be free for this user
      if (courseData.pricing.is_free) {
        toast.error('This course is free. Redirecting to course page...');
        router.push(`/courses/${courseId}`);
        return;
      }

      if (user?.premiumStatus) {
        toast.error('You already have access to this course. Redirecting...');
        router.push(`/courses/${courseId}`);
        return;
      }

    } catch (error: any) {
      console.error('Failed to fetch course:', error);
      toast.error(error.message || 'Something went wrong');
      router.push('/courses');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-lg">Course not found</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/courses/${courseId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
          <p className="text-gray-600 mt-2">
            You're one step away from accessing this amazing course!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Summary */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Course Summary</h2>
              
              <div className="flex gap-4">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Badge className={getLevelColor(course.level)}>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.total_duration)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.total_lessons} lessons</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{course.stats.total_enrollments} students</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Information
              </h2>
              
              <CourseCheckoutForm 
                course={course}
                onSuccess={() => {
                  toast.success('Payment successful! Redirecting to course...');
                  router.push(`/learn/${courseId}`);
                }}
                onError={(error: string) => {
                  toast.error(error);
                }}
              />
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Course Price</span>
                  <span className="font-semibold">
                    ${course.pricing.price}
                  </span>
                </div>
                
                {course.pricing.discount_price && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">
                        -${(course.pricing.price - course.pricing.discount_price).toFixed(2)}
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${course.pricing.discount_price}</span>
                    </div>
                  </>
                )}
                
                {!course.pricing.discount_price && (
                  <>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${course.pricing.price}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">What's Included:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Lifetime access to course content
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {formatDuration(course.total_duration)} of video content
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Interactive quizzes and assignments
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Certificate of completion
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    AI Study Buddy assistance
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Secure payment powered by Stripe</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  14-day money-back guarantee
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}