import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { parseErrorFromResponse, AppError, ErrorType, handleError } from '@/lib/utils/error-handler';
import { debug, log, error } from '@/lib/utils/debug';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retryCount?: number;
  requireAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 10000; // 10 seconds timeout for course operations

  constructor(baseUrl?: string) {
    // Use the provided baseUrl or fall back to API_ENDPOINTS.BASE_URL
    this.baseUrl = baseUrl || API_ENDPOINTS.BASE_URL || 'http://localhost:8000/api/v1';
    log('API-CLIENT', 'Constructor - baseUrl:', this.baseUrl);
  }

  // Get auth token from NextAuth session ONLY
  private async getAuthToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      try {
        const { getSession } = await import('next-auth/react');
        const session = await getSession();
        
        console.log('🔐 [AUTH DEBUG] Session check:', {
          hasSession: !!session,
          hasAccessToken: !!session?.accessToken,
          sessionKeys: session ? Object.keys(session) : [],
          tokenLength: session?.accessToken ? (session.accessToken as string).length : 0
        });
        
        if (session?.accessToken) {
          return session.accessToken as string;
        }
      } catch (error) {
        console.error('🔐 [AUTH DEBUG] Failed to get session:', error);
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
    const actualTimeout = timeout || this.defaultTimeout;
    
    // 🔧 SIMPLE: Just abort after timeout - no complex logic
    const timeoutId = setTimeout(() => {
      console.log('🚨 REQUEST TIMEOUT - ABORTING AFTER', actualTimeout, 'ms');
      controller.abort();
    }, actualTimeout);

    // Clear timeout when request completes naturally
    const originalAbort = controller.abort;
    let timeoutCleared = false;
    
    controller.abort = () => {
      if (!timeoutCleared) {
        clearTimeout(timeoutId);
        timeoutCleared = true;
      }
      originalAbort.call(controller);
    };

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
    debug('API-CLIENT', 'Starting request:', {
      fullUrl,
      method: fetchOptions.method || 'GET',
      requireAuth,
      hasBody: !!fetchOptions.body,
      retryCount
    });

    // Special logging for course updates
    if (fullUrl.includes('/courses/') && fetchOptions.method === 'PUT') {
      try {
      } catch (e) {
      }
    }

    // Check if auth is required
    if (requireAuth && !(await this.getAuthToken())) {
      debug('API-CLIENT', 'Auth required but no token found');
      throw new AppError(
        'Authentication required',
        ErrorType.AUTHENTICATION
      );
    }

    // Create abort controller
    const controller = this.createAbortController(timeout);

    // Prepare headers - set default content type only if not specified
    const baseHeaders = {
      ...(!Object.keys(headers).some(key => key.toLowerCase() === 'content-type') ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    };
    
    // Only add cache prevention headers for auth and user-specific endpoints
    const noCacheEndpoints = ['/auth/', '/users/me', '/profile', '/dashboard', '/admin/', '/payment'];
    const shouldNoCache = noCacheEndpoints.some(endpoint => url.includes(endpoint));
    
    const requestHeaders: HeadersInit = shouldNoCache ? {
      ...baseHeaders,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    } : baseHeaders;

    // Add auth header if needed
    const finalHeaders = requireAuth 
      ? await this.addAuthHeader(requestHeaders)
      : requestHeaders;

    console.log('🔐 [AUTH DEBUG] Final headers:', {
      requireAuth,
      hasAuthHeader: !!(finalHeaders as any)['Authorization'],
      authHeaderLength: (finalHeaders as any)['Authorization'] ? (finalHeaders as any)['Authorization'].length : 0,
      allHeaders: Object.keys(finalHeaders as any)
    });

    debug('API-CLIENT', 'Request headers:', finalHeaders);

    try {
      console.log('🚀 [API-CLIENT] Making fetch request:', {
        url: fullUrl,
        method: fetchOptions.method,
        headers: Object.fromEntries(Object.entries(finalHeaders)),
        bodySize: fetchOptions.body ? 
          (typeof fetchOptions.body === 'string' ? fetchOptions.body.length : 
           fetchOptions.body instanceof FormData ? '[FormData]' : 
           fetchOptions.body instanceof Blob ? fetchOptions.body.size : 
           '[Unknown]') : 0,
        timeout: timeout || this.defaultTimeout
      });
      
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers: finalHeaders,
        signal: controller.signal,
        // Only disable Next.js caching for auth/user endpoints
        ...(shouldNoCache ? { cache: 'no-store' } : {})
      } as RequestInit);

      debug('API-CLIENT', 'Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Special logging for course update responses
      if (fullUrl.includes('/courses/') && fetchOptions.method === 'PUT') {
        const responseClone = response.clone();
        try {
        } catch (e) {
        }
      }

      // Handle non-2xx responses
      if (!response.ok) {
        debug('API-CLIENT', 'Response not OK, parsing error...');
        const error = await parseErrorFromResponse(response);
        debug('API-CLIENT', 'Parsed error:', {
          message: error.message,
          type: error.type,
          details: error.details
        });
        
        // Handle token expiration - attempt refresh before logout
        if (response.status === 401 && requireAuth && retryCount === 0) {
          debug('API-CLIENT', '401 error with auth required, attempting token refresh...');
          
          try {
            // Get current session
            const { getSession } = await import('next-auth/react');
            const session = await getSession();
            
            if (session?.refreshToken) {
              debug('API-CLIENT', 'Found refresh token, calling backend refresh...');
              
              // Call backend refresh endpoint
              const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: session.refreshToken })
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                debug('API-CLIENT', 'Token refresh successful');
                
                if (refreshData.success && refreshData.data) {
                  // Update NextAuth session with new tokens
                  const { getSession } = await import('next-auth/react');
                  const currentSession = await getSession();
                  
                  if (currentSession) {
                    // Try to update session - this is a simplified approach
                    // In production, you'd want a more robust session update mechanism
                    (currentSession as any).accessToken = refreshData.data.access_token;
                    (currentSession as any).refreshToken = refreshData.data.refresh_token;
                    
                    debug('API-CLIENT', 'Session updated, retrying original request...');
                    
                    // Retry original request with new token
                    return this.request(url, {
                      ...options,
                      retryCount: 1, // Prevent infinite retry
                      requireAuth
                    });
                  }
                }
              } else {
                debug('API-CLIENT', 'Token refresh failed, response not OK');
              }
            } else {
              debug('API-CLIENT', 'No refresh token available');
            }
          } catch (refreshError) {
            debug('API-CLIENT', 'Token refresh error:', refreshError);
          }
          
          // If refresh fails, then logout
          debug('API-CLIENT', 'Token refresh failed, logging out user');
        }
        
        // Handle immediate logout for non-recoverable 401 or after failed refresh
        if (response.status === 401 && requireAuth) {
          debug('API-CLIENT', 'Logging out user due to authentication failure');
          
          // Clear NextAuth session and redirect to login
          try {
            const { signOut } = await import('next-auth/react');
            await signOut({ redirect: true, callbackUrl: '/login' });
          } catch (e) {
            // Fallback redirect
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
          
          throw error;
        }
        
        debug('API-CLIENT', 'Throwing parsed error');
        throw error;
      }

      // Parse JSON response
      const responseText = await response.text();
      debug('API-CLIENT', 'Response text:', responseText.substring(0, 500));
      
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
      
      debug('API-CLIENT', 'Parsed data:', {
        hasData: !!data,
        dataType: typeof data,
        dataKeys: data && typeof data === 'object' ? Object.keys(data) : []
      });
      
      // Handle API response wrapper
      if (data.success === false) {
        debug('API-CLIENT', 'API returned success=false');
        throw new AppError(
          data.message || 'Request failed',
          ErrorType.SERVER
        );
      }

      debug('API-CLIENT', 'Request successful, returning:', data);
      
      // 🔧 FIX: Clear timeout on successful response
      controller.abort(); // This will clear timeout via our custom logic
      
      // Return the full response to maintain access to success, data, and message
      // This allows frontend to display backend messages and handle responses consistently
      debug('API-CLIENT', 'Returning full response with StandardResponse format');
      return data;
    } catch (error) {
      // 🔧 FIX: Clear timeout on error response (except abort errors)
      if (!(error instanceof Error && error.name === 'AbortError')) {
        controller.abort(); // This will clear timeout via our custom logic
      }
      
      debug('API-CLIENT', 'Caught error:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        isAppError: error instanceof AppError
      });

      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        debug('API-CLIENT', 'Request aborted (timeout)');
        throw new AppError(
          'Request timeout',
          ErrorType.NETWORK
        );
      }

      // Re-throw AppError instances
      if (error instanceof AppError) {
        debug('API-CLIENT', 'Re-throwing AppError');
        throw error;
      }

      // Handle other errors
      debug('API-CLIENT', 'Handling other error with handleError');
      const handledError = handleError(error, false);
      debug('API-CLIENT', 'Handled error:', {
        message: handledError.message,
        type: handledError.type
      });
      throw handledError;
    }
  }

  // Token refresh is handled by NextAuth JWT callback and API client retry logic

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

  async download(url: string, options?: RequestOptions): Promise<Blob> {
    // Use similar pattern to request method but return blob
    const { requireAuth = true, timeout, headers = {}, ...fetchOptions } = options || {};
    
    // Create abort controller
    const controller = this.createAbortController(timeout);

    // Prepare headers
    const baseHeaders = {
      ...headers
    };
    
    const requestHeaders: HeadersInit = baseHeaders;

    // Add auth header if needed
    const finalHeaders = requireAuth 
      ? await this.addAuthHeader(requestHeaders)
      : requestHeaders;

    // Make request
    const fullUrl = `${this.baseUrl}${url}`;
    
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      method: 'GET',
      headers: finalHeaders,
      signal: controller.signal
    });

    if (!response.ok) {
      const error = await parseErrorFromResponse(response);
      throw error;
    }

    return response.blob();
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

  // 🔧 FIX: Add health check to verify backend is running
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
      
      // Health endpoint is at /health, not under API version prefix
      const healthUrl = this.baseUrl.replace('/api/v1', '') + '/health';
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      debug('API-CLIENT', 'Health check response:', response.status);
      return response.ok;
    } catch (error) {
      debug('API-CLIENT', 'Health check failed:', error);
      return false;
    }
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
  download: apiClient.download.bind(apiClient),
  isAuthenticated: apiClient.isAuthenticated.bind(apiClient),
  clearAuth: apiClient.clearAuth.bind(apiClient),
  healthCheck: apiClient.healthCheck.bind(apiClient),
  
  // AI Assistant functions
  chatWithAI: (data: { message: string; context?: any }) => 
    apiClient.post('/ai/chat', data, { requireAuth: true }),
  
  getBatchLessonProgress: (lessonIds: string[]) =>
    apiClient.post('/progress/lessons/batch', { lesson_ids: lessonIds }, { requireAuth: true })
};