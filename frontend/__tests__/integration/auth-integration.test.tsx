import { renderHook, act, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
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

// Test wrapper for SessionProvider
const createWrapper = (session: any = null) => {
  return ({ children }: { children: React.ReactNode }) => (
    <SessionProvider session={session}>{children}</SessionProvider>
  );
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter as any);
    jest.clearAllMocks();
  });

  describe('useAuth Hook Integration', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle successful authentication', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student'
      };

      const mockSession = {
        user: mockUser,
        expires: '2024-12-31'
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockSession)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.error).toBe(null);
      });
    });

    it('should handle authentication errors', async () => {
      const mockSession = {
        error: 'Authentication failed',
        user: null
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockSession)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toBe(null);
        expect(result.current.error).toBe('Authentication failed');
      });
    });
  });

  describe('Login Flow Integration', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: mockUser, token: 'jwt-token' }
        })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });
    });

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid credentials' }
        })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrongpassword');
        } catch (error) {
          expect(error).toEqual(new Error('Invalid credentials'));
        }
      });
    });

    it('should handle network errors during login', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password123');
        } catch (error) {
          expect(error).toEqual(new Error('Network error'));
        }
      });
    });
  });

  describe('Registration Flow Integration', () => {
    it('should handle successful registration', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Registration successful. Please check your email for verification.'
        })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.register(newUser.name, newUser.email, newUser.password);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
    });

    it('should handle registration with existing email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Email already exists' }
        })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        try {
          await result.current.register('Test User', 'existing@example.com', 'password123');
        } catch (error) {
          expect(error).toEqual(new Error('Email already exists'));
        }
      });
    });
  });

  describe('Logout Flow Integration', () => {
    it('should handle successful logout', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper({ user: mockUser })
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST'
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Password Reset Integration', () => {
    it('should handle password reset request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Password reset email sent'
        })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.requestPasswordReset('test@example.com');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
    });

    it('should handle password reset confirmation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Password reset successful'
        })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.resetPassword('reset-token-123', 'newpassword123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'reset-token-123',
          password: 'newpassword123'
        })
      });
    });
  });

  describe('Email Verification Integration', () => {
    it('should handle email verification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Email verified successfully'
        })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.verifyEmail('verification-token-123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'verification-token-123' })
      });
    });

    it('should handle expired verification token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Verification token expired' }
        })
      } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        try {
          await result.current.verifyEmail('expired-token');
        } catch (error) {
          expect(error).toEqual(new Error('Verification token expired'));
        }
      });
    });
  });

  describe('Token Refresh Integration', () => {
    it('should handle automatic token refresh', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      };

      // Mock expired token response
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Token expired' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { token: 'new-jwt-token' }
          })
        } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper({ user: mockUser })
      });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST'
      });
    });
  });

  describe('Role-based Access Integration', () => {
    it('should handle admin role verification', async () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper({ user: adminUser })
      });

      await waitFor(() => {
        expect(result.current.user?.role).toBe('admin');
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isCreator).toBe(false);
        expect(result.current.isStudent).toBe(false);
      });
    });

    it('should handle creator role verification', async () => {
      const creatorUser = {
        id: 'creator-123',
        email: 'creator@example.com',
        name: 'Creator User',
        role: 'creator'
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper({ user: creatorUser })
      });

      await waitFor(() => {
        expect(result.current.user?.role).toBe('creator');
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isCreator).toBe(true);
        expect(result.current.isStudent).toBe(false);
      });
    });

    it('should handle student role verification', async () => {
      const studentUser = {
        id: 'student-123',
        email: 'student@example.com',
        name: 'Student User',
        role: 'student'
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper({ user: studentUser })
      });

      await waitFor(() => {
        expect(result.current.user?.role).toBe('student');
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isCreator).toBe(false);
        expect(result.current.isStudent).toBe(true);
      });
    });
  });

  describe('Error Recovery Integration', () => {
    it('should retry failed requests with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        } as Response);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        await result.current.retryRequest('/api/auth/verify');
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle maximum retry attempts', async () => {
      mockFetch
        .mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      });

      await act(async () => {
        try {
          await result.current.retryRequest('/api/auth/verify', { maxRetries: 2 });
        } catch (error) {
          expect(error).toEqual(new Error('Maximum retry attempts exceeded'));
        }
      });

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});