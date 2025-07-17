import { API_ENDPOINTS } from '@/lib/constants/api-endpoints';
import { StandardResponse } from '@/lib/types/api';
import { api } from '@/lib/api/api-client';
import { 
  withErrorHandling,
  LessonErrors
} from '@/lib/utils/error-handler';

// Upload file resource to lesson
export const uploadLessonResource = async (
  lessonId: string,
  file: File,
  title?: string,
  description?: string
): Promise<StandardResponse<{
  resource: {
    title: string;
    type: string;
    url: string;
    description?: string;
    size: number;
  };
  upload_info: {
    filename: string;
    original_filename: string;
    size: number;
    content_type: string;
  };
  total_resources: number;
}>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }
    if (!file) {
      throw new Error('File is required');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }
    if (description) {
      formData.append('description', description);
    }

    // Direct fetch since api-client doesn't have postFormData
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    const token = session?.accessToken;
    
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/lessons/${lessonId}/resources/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || 'Something went wrong');
    }

    const result = await response.json();
    
    // Validate response
    if (!result.success) {
      throw new Error(result.message || 'Something went wrong');
    }
    
    return result;
  }, LessonErrors.UPDATE_FAILED);
};

// Add URL resource to lesson
export const addLessonUrlResource = async (
  lessonId: string,
  url: string,
  title: string,
  description?: string
): Promise<StandardResponse<{
  resource: {
    title: string;
    type: string;
    url: string;
    description?: string;
    size?: number;
  };
  total_resources: number;
}>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }
    if (!url || !url.trim()) {
      throw new Error('URL is required');
    }
    if (!title || !title.trim()) {
      throw new Error('Title is required');
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url.trim())) {
      throw new Error('Please enter a valid HTTP or HTTPS URL');
    }

    const response = await api.post<StandardResponse<{
      resource: {
        title: string;
        type: string;
        url: string;
        description?: string;
        size?: number;
      };
      total_resources: number;
    }>>(
      `/lessons/${lessonId}/resources/url`,
      {
        url: url.trim(),
        title: title.trim(),
        description: description?.trim() || null
      },
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.UPDATE_FAILED);
};

// Delete resource from lesson
export const deleteLessonResource = async (
  lessonId: string,
  resourceIndex: number
): Promise<StandardResponse<{
  total_resources: number;
}>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }
    if (typeof resourceIndex !== 'number' || resourceIndex < 0) {
      throw new Error('Valid resource index is required');
    }

    const response = await api.delete<StandardResponse<{
      total_resources: number;
    }>>(
      `/lessons/${lessonId}/resources/${resourceIndex}`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.DELETE_FAILED);
};

// Get upload constraints for file validation
export const getUploadConstraints = async (
  lessonId: string
): Promise<StandardResponse<{
  max_file_size: number;
  max_file_size_mb: number;
  allowed_extensions: string[];
  allowed_mime_types: string[];
}>> => {
  return withErrorHandling(async () => {
    // Validate input data
    if (!lessonId) {
      throw new Error('Lesson ID is required');
    }

    const response = await api.get<StandardResponse<{
      max_file_size: number;
      max_file_size_mb: number;
      allowed_extensions: string[];
      allowed_mime_types: string[];
    }>>(
      `/lessons/${lessonId}/upload-constraints`,
      { requireAuth: true }
    );
    
    // Validate response
    if (!response.success) {
      throw new Error(response.message || 'Something went wrong');
    }
    
    return response;
  }, LessonErrors.FETCH_FAILED);
};