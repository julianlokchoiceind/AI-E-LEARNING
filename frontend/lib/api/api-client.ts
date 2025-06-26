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

  constructor(baseUrl: string = API_ENDPOINTS.BASE_URL || '') {
    this.baseUrl = baseUrl;
  }

  // Get auth token
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  // Add auth header if token exists
  private addAuthHeader(headers: HeadersInit = {}): HeadersInit {
    const token = this.getAuthToken();
    
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

    // Check if auth is required
    if (requireAuth && !this.getAuthToken()) {
      throw new AppError(
        'Authentication required',
        ErrorType.AUTHENTICATION
      );
    }

    // Create abort controller
    const controller = this.createAbortController(timeout);

    // Prepare headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Add auth header if needed
    const finalHeaders = requireAuth 
      ? this.addAuthHeader(requestHeaders)
      : requestHeaders;

    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...fetchOptions,
        headers: finalHeaders,
        signal: controller.signal
      });

      // Handle non-2xx responses
      if (!response.ok) {
        const error = await parseErrorFromResponse(response);
        
        // Handle token expiration
        if (response.status === 401 && requireAuth) {
          // Clear invalid token
          localStorage.removeItem('access_token');
          
          // Try to refresh token
          await this.refreshToken();
          
          // Retry the request once
          if (retryCount === 0) {
            return this.request(url, { ...options, retryCount: 1 });
          }
        }
        
        throw error;
      }

      // Parse JSON response
      const data = await response.json();
      
      // Handle API response wrapper
      if (data.success === false) {
        throw new AppError(
          data.message || 'Request failed',
          ErrorType.SERVER
        );
      }

      return data.data || data;
    } catch (error) {
      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError(
          'Request timeout',
          ErrorType.NETWORK
        );
      }

      // Re-throw AppError instances
      if (error instanceof AppError) {
        throw error;
      }

      // Handle other errors
      throw handleError(error, false);
    }
  }

  // Refresh token
  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw new AppError(
        'Session expired. Please log in again.',
        ErrorType.AUTHENTICATION
      );
    }
  }

  // HTTP methods
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET'
    });
  }

  async post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
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