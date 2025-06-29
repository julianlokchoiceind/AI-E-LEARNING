'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { XCircle, ArrowLeft, RefreshCw, CreditCard, HelpCircle, AlertTriangle } from 'lucide-react';
import { getCourseById } from '@/lib/api/courses';
import { toast } from 'react-hot-toast';

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const courseId = searchParams.get('course_id');
  const errorMessage = searchParams.get('error');
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
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessageDisplay = () => {
    if (errorMessage) {
      // Map common Stripe error codes to user-friendly messages
      switch (errorMessage) {
        case 'card_declined':
          return 'Your card was declined. Please try a different payment method.';
        case 'insufficient_funds':
          return 'Insufficient funds. Please check your account balance or try a different card.';
        case 'expired_card':
          return 'Your card has expired. Please use a different payment method.';
        case 'incorrect_cvc':
          return 'The security code (CVC) is incorrect. Please check and try again.';
        case 'processing_error':
          return 'A processing error occurred. Please try again in a moment.';
        case 'authentication_required':
          return 'Your bank requires additional authentication. Please try again.';
        default:
          return errorMessage;
      }
    }
    return 'Your payment could not be processed at this time.';
  };

  const handleRetryPayment = () => {
    if (courseId) {
      router.push(`/checkout/course/${courseId}`);
    } else {
      router.push('/courses');
    }
  };

  const handleContactSupport = () => {
    // In a real app, this would open a support chat or redirect to contact form
    toast('Support contact feature coming soon. Please email support@elearning.com');
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
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600 text-lg">
            We couldn't process your payment. Don't worry, you can try again.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Error Details */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-semibold">What Happened?</h2>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">
                {getErrorMessageDisplay()}
              </p>
            </div>

            {course && (
              <div>
                <h3 className="font-semibold mb-3">Course You Were Purchasing:</h3>
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-16 h-12 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-sm">{course.title}</h4>
                    <p className="text-gray-600 text-xs line-clamp-2">
                      {course.description}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      ${course.pricing.discount_price || course.pricing.price}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Button 
                onClick={handleRetryPayment}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Payment Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/courses')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </div>
          </Card>

          {/* Troubleshooting */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Troubleshooting Tips</h2>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-200 pl-4">
                <h3 className="font-medium mb-1">Check Your Payment Details</h3>
                <p className="text-gray-600 text-sm">
                  Ensure your card number, expiry date, and security code are correct.
                </p>
              </div>

              <div className="border-l-4 border-blue-200 pl-4">
                <h3 className="font-medium mb-1">Try a Different Card</h3>
                <p className="text-gray-600 text-sm">
                  If one card doesn't work, try using a different payment method.
                </p>
              </div>

              <div className="border-l-4 border-blue-200 pl-4">
                <h3 className="font-medium mb-1">Check with Your Bank</h3>
                <p className="text-gray-600 text-sm">
                  Your bank might be blocking the transaction for security reasons.
                </p>
              </div>

              <div className="border-l-4 border-blue-200 pl-4">
                <h3 className="font-medium mb-1">Clear Browser Cache</h3>
                <p className="text-gray-600 text-sm">
                  Sometimes clearing your browser cache can resolve payment issues.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Still Having Issues?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Our support team is here to help you complete your purchase.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleContactSupport}
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          </Card>
        </div>

        {/* Alternative Options */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Alternative Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-medium mb-1">Try Different Payment</h3>
              <p className="text-gray-600 text-sm mb-3">
                Use a different credit card or payment method
              </p>
              <Button variant="outline" size="sm" onClick={handleRetryPayment}>
                Retry Payment
              </Button>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">Pro</span>
              </div>
              <h3 className="font-medium mb-1">Subscribe to Pro</h3>
              <p className="text-gray-600 text-sm mb-3">
                Get unlimited access to all courses for $29/month
              </p>
              <Button variant="outline" size="sm" onClick={() => router.push('/pricing')}>
                View Plans
              </Button>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">Free</span>
              </div>
              <h3 className="font-medium mb-1">Try Free Courses</h3>
              <p className="text-gray-600 text-sm mb-3">
                Start with our free courses while you resolve payment issues
              </p>
              <Button variant="outline" size="sm" onClick={() => router.push('/courses?filter=free')}>
                Browse Free
              </Button>
            </div>
          </div>
        </Card>

        {/* Payment Details for Reference */}
        {paymentIntentId && (
          <Card className="mt-8 p-6">
            <h3 className="font-medium mb-2">Payment Reference</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Payment ID: {paymentIntentId}</p>
              <p>Attempted: {new Date().toLocaleDateString()}</p>
              <p>Status: Failed</p>
              <p className="text-xs">
                Keep this reference if you need to contact support
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}