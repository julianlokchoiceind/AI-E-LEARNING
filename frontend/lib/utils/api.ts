/**
 * API Utility Functions
 * Common utilities for API calls and error handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Base API configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Create API request headers
 */
export function createHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response
 */
export async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(data.message || data.detail || 'API request failed', response.status);
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Failed to parse response', response.status);
  }
}

/**
 * Generic API request function
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: createHeaders(),
  };

  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, requestOptions);
    return await handleApiResponse<T>(response);
  } catch (error) {
    console.error('API Request Error:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Network request failed');
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(
  endpoint: string,
  token?: string
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
    headers: createHeaders(token),
  });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  token?: string
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    headers: createHeaders(token),
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  token?: string
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    headers: createHeaders(token),
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  endpoint: string,
  token?: string
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
    headers: createHeaders(token),
  });
}

/**
 * Upload file
 */
export async function uploadFile<T = any>(
  endpoint: string,
  file: File,
  token?: string
): Promise<ApiResponse<T>> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<T>(endpoint, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
}

/**
 * API error class
 */
export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Check if error is an API error
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Format API error for user display
 */
export function formatApiError(error: any): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Retry API request with exponential backoff
 */
export async function retryApiRequest<T>(
  requestFn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (isApiError(error) && error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Create API endpoint URL
 */
export function createApiUrl(endpoint: string): string {
  return endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
}

/**
 * Check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    } as any);
    
    return response.ok;
  } catch (error) {
    return false;
  }
}