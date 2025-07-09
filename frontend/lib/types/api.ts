/**
 * Generic API response wrapper
 * Matches backend StandardResponse pattern
 */
export interface StandardResponse<T = any> {
  success: boolean
  data: T | null
  message: string
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  detail: string
  status_code?: number
  error?: {
    code?: string
    message?: string
  }
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

/**
 * List response with pagination
 */
export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}