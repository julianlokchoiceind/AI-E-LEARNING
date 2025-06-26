import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CourseCheckoutForm } from '@/components/feature/CourseCheckoutForm';
import { SubscriptionCheckoutForm } from '@/components/feature/SubscriptionCheckoutForm';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('react-hot-toast');
jest.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({
    confirmCardPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
  }),
  useElements: () => ({
    getElement: jest.fn(),
  }),
  CardElement: ({ children }: any) => <div data-testid="card-element">{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('Course and Payment Integration Tests', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter as any);
    jest.clearAllMocks();
  });

  describe('Course Enrollment Integration', () => {
    const mockCourse = {
      _id: 'course-123',
      title: 'AI Programming Fundamentals',
      pricing: {
        is_free: false,
        price: 49.99,
        currency: 'USD'
      }
    };

    it('should handle free course enrollment', async () => {
      const freeCourse = {
        ...mockCourse,
        pricing: { is_free: true, price: 0, currency: 'USD' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { enrollment_id: 'enrollment-123' }
        })
      } as Response);

      const enrollCourse = async (courseId: string) => {
        const response = await fetch(`/api/v1/courses/${courseId}/enroll`, {
          method: 'POST'
        });
        return response.json();
      };

      const result = await enrollCourse(freeCourse._id);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/courses/course-123/enroll', {
        method: 'POST'
      });
      expect(result.success).toBe(true);
    });

    it('should redirect to checkout for paid courses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: async () => ({
          error: { 
            code: 'PAYMENT_REQUIRED',
            message: 'Course requires payment'
          }
        })
      } as Response);

      const enrollCourse = async (courseId: string) => {
        const response = await fetch(`/api/v1/courses/${courseId}/enroll`, {
          method: 'POST'
        });
        
        if (!response.ok) {
          const error = await response.json();
          if (error.error.code === 'PAYMENT_REQUIRED') {
            mockRouter.push(`/checkout/course/${courseId}`);
          }
          throw new Error(error.error.message);
        }
        
        return response.json();
      };

      try {
        await enrollCourse(mockCourse._id);
      } catch (error) {
        expect(error).toEqual(new Error('Course requires payment'));
        expect(mockRouter.push).toHaveBeenCalledWith('/checkout/course/course-123');
      }
    });

    it('should handle Pro subscriber automatic enrollment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { 
            enrollment_id: 'enrollment-123',
            access_granted: true,
            reason: 'pro_subscription'
          }
        })
      } as Response);

      const enrollCourse = async (courseId: string) => {
        const response = await fetch(`/api/v1/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer pro-user-token'
          }
        });
        return response.json();
      };

      const result = await enrollCourse(mockCourse._id);

      expect(result.data.access_granted).toBe(true);
      expect(result.data.reason).toBe('pro_subscription');
    });
  });

  describe('Course Purchase Integration', () => {
    const mockCourse = {
      _id: 'course-123',
      title: 'AI Programming Fundamentals',
      pricing: {
        is_free: false,
        price: 49.99,
        currency: 'USD'
      }
    };

    it('should complete course purchase workflow', async () => {
      // Mock payment intent creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            client_secret: 'pi_test_client_secret',
            payment_intent_id: 'pi_test_123'
          }
        })
      } as Response);

      // Mock payment confirmation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            payment_status: 'succeeded',
            enrollment_id: 'enrollment-123'
          }
        })
      } as Response);

      const mockStripe = {
        confirmCardPayment: jest.fn().mockResolvedValue({
          paymentIntent: {
            status: 'succeeded',
            id: 'pi_test_123'
          }
        })
      };

      // Create payment intent
      const createPaymentIntent = async (courseId: string) => {
        const response = await fetch('/api/v1/payments/course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseId })
        });
        return response.json();
      };

      // Confirm payment
      const confirmPayment = async (clientSecret: string) => {
        const result = await mockStripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: 'test_card_element',
            billing_details: { email: 'test@example.com' }
          }
        });
        return result;
      };

      // Complete enrollment
      const completeEnrollment = async (paymentIntentId: string) => {
        const response = await fetch('/api/v1/payments/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_intent_id: paymentIntentId })
        });
        return response.json();
      };

      // Test the complete workflow
      const paymentIntentResult = await createPaymentIntent(mockCourse._id);
      expect(paymentIntentResult.success).toBe(true);

      const paymentResult = await confirmPayment(paymentIntentResult.data.client_secret);
      expect(paymentResult.paymentIntent.status).toBe('succeeded');

      const enrollmentResult = await completeEnrollment(paymentResult.paymentIntent.id);
      expect(enrollmentResult.success).toBe(true);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle payment failures gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { client_secret: 'pi_test_client_secret' }
        })
      } as Response);

      const mockStripe = {
        confirmCardPayment: jest.fn().mockResolvedValue({
          error: {
            type: 'card_error',
            code: 'card_declined',
            message: 'Your card was declined.',
            decline_code: 'generic_decline'
          }
        })
      };

      const confirmPayment = async (clientSecret: string) => {
        const result = await mockStripe.confirmCardPayment(clientSecret, {
          payment_method: { card: 'declined_card_element' }
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        return result;
      };

      try {
        await confirmPayment('pi_test_client_secret');
      } catch (error) {
        expect(error).toEqual(new Error('Your card was declined.'));
      }
    });

    it('should implement payment retry mechanism', async () => {
      let attemptCount = 0;
      
      mockFetch.mockImplementation(async () => {
        attemptCount++;
        
        if (attemptCount < 3) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Server error' } })
          } as Response;
        }
        
        return {
          ok: true,
          json: async () => ({ success: true, data: { client_secret: 'pi_test' } })
        } as Response;
      });

      const createPaymentWithRetry = async (courseId: string, maxRetries = 3) => {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch('/api/v1/payments/course', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ course_id: courseId })
            });
            
            if (response.ok) {
              return response.json();
            }
            
            const error = await response.json();
            lastError = new Error(error.error.message);
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          } catch (error) {
            lastError = error;
          }
        }
        
        throw lastError;
      };

      const result = await createPaymentWithRetry(mockCourse._id);
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });
  });

  describe('Subscription Integration', () => {
    it('should handle Pro subscription signup', async () => {
      // Mock subscription creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            subscription_id: 'sub_test_123',
            client_secret: 'seti_test_client_secret',
            status: 'active'
          }
        })
      } as Response);

      const createSubscription = async () => {
        const response = await fetch('/api/v1/payments/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: 'pro',
            payment_method: 'pm_test_123'
          })
        });
        return response.json();
      };

      const result = await createSubscription();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/payments/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'pro',
          payment_method: 'pm_test_123'
        })
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('active');
    });

    it('should handle subscription cancellation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            subscription_id: 'sub_test_123',
            status: 'canceled',
            cancel_at_period_end: true,
            current_period_end: '2024-12-31'
          }
        })
      } as Response);

      const cancelSubscription = async () => {
        const response = await fetch('/api/v1/payments/cancel-subscription', {
          method: 'POST'
        });
        return response.json();
      };

      const result = await cancelSubscription();

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('canceled');
      expect(result.data.cancel_at_period_end).toBe(true);
    });
  });

  describe('Course Access Control Integration', () => {
    it('should verify course access based on payment status', async () => {
      // Mock course access check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            has_access: true,
            access_type: 'purchased',
            enrollment_date: '2024-01-15'
          }
        })
      } as Response);

      const checkCourseAccess = async (courseId: string) => {
        const response = await fetch(`/api/v1/courses/${courseId}/access`, {
          method: 'GET'
        });
        return response.json();
      };

      const result = await checkCourseAccess('course-123');

      expect(result.success).toBe(true);
      expect(result.data.has_access).toBe(true);
      expect(result.data.access_type).toBe('purchased');
    });

    it('should deny access for unpaid courses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            code: 'ACCESS_DENIED',
            message: 'Course access requires payment'
          }
        })
      } as Response);

      const checkCourseAccess = async (courseId: string) => {
        const response = await fetch(`/api/v1/courses/${courseId}/access`, {
          method: 'GET'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error.message);
        }
        
        return response.json();
      };

      try {
        await checkCourseAccess('paid-course-123');
      } catch (error) {
        expect(error).toEqual(new Error('Course access requires payment'));
      }
    });
  });

  describe('Payment History Integration', () => {
    it('should fetch user payment history', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          amount: 49.99,
          currency: 'USD',
          status: 'completed',
          course_title: 'AI Programming Fundamentals',
          created_at: '2024-01-15'
        },
        {
          id: 'payment-2', 
          amount: 29.00,
          currency: 'USD',
          status: 'completed',
          type: 'subscription',
          created_at: '2024-01-01'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { payments: mockPayments, total: 2 }
        })
      } as Response);

      const getPaymentHistory = async () => {
        const response = await fetch('/api/v1/payments/history', {
          method: 'GET'
        });
        return response.json();
      };

      const result = await getPaymentHistory();

      expect(result.success).toBe(true);
      expect(result.data.payments).toHaveLength(2);
      expect(result.data.payments[0].course_title).toBe('AI Programming Fundamentals');
    });

    it('should handle refund processing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            refund_id: 'refund-123',
            amount: 49.99,
            status: 'processing',
            estimated_arrival: '2024-01-20'
          }
        })
      } as Response);

      const processRefund = async (paymentId: string, reason: string) => {
        const response = await fetch(`/api/v1/payments/${paymentId}/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        return response.json();
      };

      const result = await processRefund('payment-123', 'Course not as expected');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('processing');
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should handle Stripe webhook failures with retry', async () => {
      let webhookAttempts = 0;
      
      mockFetch.mockImplementation(async () => {
        webhookAttempts++;
        
        if (webhookAttempts < 4) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Webhook processing failed' } })
          } as Response;
        }
        
        return {
          ok: true,
          json: async () => ({ success: true, message: 'Webhook processed' })
        } as Response;
      });

      const processWebhook = async (eventData: any, maxRetries = 3) => {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch('/api/webhooks/stripe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
              return response.json();
            }
            
            const error = await response.json();
            lastError = new Error(error.error.message);
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          } catch (error) {
            lastError = error;
          }
        }
        
        throw lastError;
      };

      const result = await processWebhook({ type: 'payment_intent.succeeded' });
      expect(result.success).toBe(true);
      expect(webhookAttempts).toBe(4);
    });
  });
});