/**
 * Utility functions for handling attachment URLs
 */

/**
 * Convert relative attachment paths to full URLs
 * @param path - Attachment path (can be relative or absolute)
 * @returns Full URL for the attachment
 */
export function getAttachmentUrl(path: string): string {
  // If path is already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Get backend base URL from environment
  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://aitc.choiceind.com/api/v1').replace('/api/v1', '');
  
  if (!backendUrl) {
    console.warn('NEXT_PUBLIC_API_URL not configured, attachment may not load properly');
    return path; // Return path as-is if no backend URL configured
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${backendUrl}${normalizedPath}`;
}

/**
 * Check if a filename represents an image file
 * @param filename - The filename to check
 * @returns True if the file is an image
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(extension);
}

/**
 * Get file icon component name based on filename
 * @param filename - The filename to check
 * @returns Icon component identifier
 */
export function getFileIconType(filename: string): 'image' | 'pdf' | 'document' | 'archive' | 'text' {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(extension)) {
    return 'image';
  }
  
  if (extension === '.pdf') {
    return 'pdf';
  }
  
  if (['.doc', '.docx'].includes(extension)) {
    return 'document';
  }
  
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) {
    return 'archive';
  }
  
  if (['.txt', '.md', '.json', '.csv'].includes(extension)) {
    return 'text';
  }
  
  return 'document'; // Default fallback
}