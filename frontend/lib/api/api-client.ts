import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { parseErrorFromResponse, AppError, ErrorType, handleError } from '@/lib/utils/error-handler';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retryCount?: number;
  requireAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds

  constructor(baseUrl?: string) {
    // Use the provided baseUrl or fall back to API_ENDPOINTS.BASE_URL
    this.baseUrl = baseUrl || API_ENDPOINTS.BASE_URL || 'http://localhost:8000/api/v1';
    console.log('[API-CLIENT] Constructor - baseUrl:', this.baseUrl);
  }

  // Get auth token from NextAuth session ONLY
  private async getAuthToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      try {
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        
        if (session?.accessToken) {
          return session.accessToken as string;
        }
      } catch (error) {
        console.warn('[API-CLIENT] Failed to get NextAuth session:', error);
      }
    }
    return null;
  }

  // Add auth header if token exists
  private async addAuthHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    
    if (token) {
      return {
        ...headers,
        'Authorization': `Bearer ${token}`
      };
    }
    
    return headers;
  }

  // Create abort controller with timeout
  private createAbortController(timeout?: number): AbortController {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout || this.defaultTimeout
    );

    // Clear timeout when request completes
    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));

    return controller;
  }

  // Main request method
  private async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeout,
      retryCount = 0,
      requireAuth = false,
      headers = {},
      ...fetchOptions
    } = options;

    const fullUrl = `${this.baseUrl}${url}`;
    console.debug('[API-CLIENT] Starting request:', {
      fullUrl,
      method: fetchOptions.method || 'GET',
      requireAuth,
      hasBody: !!fetchOptions.body,
      retryCount
    });

    // Check if auth is required
    if (requireAuth && !(await this.getAuthToken())) {
      console.debug('[API-CLIENT] Auth required but no token found');
      throw new AppError(
        'Authentication required',
        ErrorType.AUTHENTICATION
      );
    }

    // Create abort controller
    const controller = this.createAbortController(timeout);

    // Prepare headers - set default content type only if not specified
    const requestHeaders: HeadersInit = {
      ...(!Object.keys(headers).some(key => key.toLowerCase() === 'content-type') ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    };
    
    // Only add cache prevention headers for auth and user-specific endpoints
    const noCacheEndpoints = ['/auth/', '/users/me', '/profile', '/dashboard', '/admin/', '/payment'];
    const shouldNoCache = noCacheEndpoints.some(endpoint => url.includes(endpoint));
    
    if (shouldNoCache) {
      requestHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      requestHeaders['Pragma'] = 'no-cache';
      requestHeaders['Expires'] = '0';
    }

    // Add auth header if needed
    const finalHeaders = requireAuth 
      ? await this.addAuthHeader(requestHeaders)
      : requestHeaders;

    console.debug('[API-CLIENT] Request headers:', finalHeaders);

    try {
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers: finalHeaders,
        signal: controller.signal,
        // Only disable Next.js caching for auth/user endpoints
        ...(shouldNoCache ? { cache: 'no-store' } : {})
      } as RequestInit);

      console.debug('[API-CLIENT] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Handle non-2xx responses
      if (!response.ok) {
        console.debug('[API-CLIENT] Response not OK, parsing error...');
        const error = await parseErrorFromResponse(response);
        console.debug('[API-CLIENT] Parsed error:', {
          message: error.message,
          type: error.type,
          details: error.details
        });
        
        // Handle token expiration
        if (response.status === 401 && requireAuth) {
          console.debug('[API-CLIENT] 401 error with auth required, redirecting to login');
          
          // Clear NextAuth session and redirect to login
          try {
            const { signOut } = await import('next-auth/react');
            await signOut({ redirect: true, callbackUrl: '/login' });
          } catch (e) {
            console.warn('[API-CLIENT] Failed to clear NextAuth session:', e);
            // Fallback redirect
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
          
          // No retry for 401 - redirect to login instead
          throw error;
        }
        
        console.debug('[API-CLIENT] Throwing parsed error');
        throw error;
      }

      // Parse JSON response
      const responseText = await response.text();
      console.debug('[API-CLIENT] Response text:', responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('[API-CLIENT] Failed to parse JSON:', e);
        throw new AppError(
          'Invalid JSON response from server',
          ErrorType.SERVER
        );
      }
      
      console.debug('[API-CLIENT] Parsed data:', {
        hasData: !!data,
        dataType: typeof data,
        dataKeys: data && typeof data === 'object' ? Object.keys(data) : []
      });
      
      // Handle API response wrapper
      if (data.success === false) {
        console.debug('[API-CLIENT] API returned success=false');
        throw new AppError(
          data.message || 'Request failed',
          ErrorType.SERVER
        );
      }

      console.debug('[API-CLIENT] Request successful, returning:', data);
      
      // Return the full response to maintain access to success, data, and message
      // This allows frontend to display backend messages and handle responses consistently
      console.debug('[API-CLIENT] Returning full response with StandardResponse format');
      return data;
    } catch (error) {
      console.debug('[API-CLIENT] Caught error:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        isAppError: error instanceof AppError
      });

      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.debug('[API-CLIENT] Request aborted (timeout)');
        throw new AppError(
          'Request timeout',
          ErrorType.NETWORK
        );
      }

      // Re-throw AppError instances
      if (error instanceof AppError) {
        console.debug('[API-CLIENT] Re-throwing AppError');
        throw error;
      }

      // Handle other errors
      console.debug('[API-CLIENT] Handling other error with handleError');
      const handledError = handleError(error, false);
      console.debug('[API-CLIENT] Handled error:', {
        message: handledError.message,
        type: handledError.type
      });
      throw handledError;
    }
  }

  // NextAuth handles token refresh automatically
  // No manual refresh needed

  // HTTP methods
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET'
    });
  }

  async post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    const requestOptions: RequestOptions = {
      ...options,
      method: 'POST'
    };

    // Handle different body types
    if (body !== undefined) {
      if (typeof body === 'string') {
        // Body is already a string (e.g., URLSearchParams)
        requestOptions.body = body;
      } else {
        // JSON body - stringify
        requestOptions.body = JSON.stringify(body);
      }
    }

    return this.request<T>(url, requestOptions);
  }

  async put<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE'
    });
  }

  // File upload
  async upload<T>(
    url: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<T> {
    const { headers = {}, ...restOptions } = options || {};
    
    // Remove Content-Type for FormData
    const { 'Content-Type': _, ...cleanHeaders } = headers as any;
    
    return this.request<T>(url, {
      ...restOptions,
      method: 'POST',
      headers: cleanHeaders,
      body: formData
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Clear authentication
  clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience methods
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  upload: apiClient.upload.bind(apiClient),
  isAuthenticated: apiClient.isAuthenticated.bind(apiClient),
  clearAuth: apiClient.clearAuth.bind(apiClient)
};