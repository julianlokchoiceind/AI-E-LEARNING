'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle, ArrowRight, Download, Clock } from 'lucide-react';
import { getCourseById } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const courseId = searchParams.get('course_id');
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    } else {
      setLoading(false);
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const courseData = await getCourseById(courseId!);
      setCourse(courseData);
    } catch (error: any) {
      console.error('Failed to fetch course:', error);
      toast.error(error.message || 'Operation Failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 text-lg">
            Welcome to your new course. You're all set to start learning!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Course Access Granted</h2>
            
            {course ? (
              <div>
                <div className="flex gap-4 mb-4">
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(course.total_duration)}
                      </span>
                      <span>{course.total_lessons} lessons</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Lifetime access to course content</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>All video lessons and materials</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Interactive quizzes and assignments</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span>AI Study Buddy assistance</span>
                  </div>
                </div>

                <Button 
                  onClick={() => router.push(`/learn/${courseId}`)}
                  className="w-full"
                  size="lg"
                >
                  Start Learning Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Course details will be available shortly.</p>
                <Button 
                  onClick={() => router.push('/my-courses')}
                  variant="outline"
                  className="mt-4"
                >
                  View My Courses
                </Button>
              </div>
            )}
          </Card>

          {/* Next Steps */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Start Your First Lesson</h3>
                  <p className="text-gray-600 text-sm">
                    Jump right into the course content and begin your learning journey.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Use AI Study Buddy</h3>
                  <p className="text-gray-600 text-sm">
                    Get instant help and explanations from our AI assistant throughout the course.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Complete Quizzes</h3>
                  <p className="text-gray-600 text-sm">
                    Test your knowledge with interactive quizzes after each lesson.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">4</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Earn Your Certificate</h3>
                  <p className="text-gray-600 text-sm">
                    Complete the course to receive a verified certificate of completion.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-3">Course Resources</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download Course Materials
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Actions */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline"
              onClick={() => router.push('/my-courses')}
            >
              View All My Courses
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/courses')}
            >
              Explore More Courses
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/profile')}
            >
              Update Profile
            </Button>
          </div>
        </div>

        {/* Payment Details */}
        {paymentIntentId && (
          <Card className="mt-8 p-6">
            <h3 className="font-medium mb-2">Payment Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Payment ID: {paymentIntentId}</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Amount: ${course?.pricing?.discount_price || course?.pricing?.price || 'N/A'}</p>
              <p>Email receipt sent to: {user?.email}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}