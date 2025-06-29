/**
 * Certificate API client
 */
import { apiClient } from './api-client';
import type {
  Certificate,
  CertificateWithDetails,
  CertificateGenerateRequest,
  CertificateUpdate,
  CertificateVerification,
  CertificateStats,
  LinkedInShareData,
  CertificateListResponse
} from '@/lib/types/certificate';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const certificateAPI = {
  /**
   * Generate a certificate for completed course
   */
  async generateCertificate(request: CertificateGenerateRequest): Promise<CertificateWithDetails> {
    return apiClient.post(`${API_BASE_URL}/certificates/generate`, request);
  },

  /**
   * Get my certificates
   */
  async getMyCertificates(page: number = 1, perPage: number = 10): Promise<CertificateListResponse> {
    return apiClient.get(
      `${API_BASE_URL}/certificates/my-certificates?page=${page}&per_page=${perPage}`
    );
  },

  /**
   * Get my certificate statistics
   */
  async getMyCertificateStats(): Promise<CertificateStats> {
    return apiClient.get(`${API_BASE_URL}/certificates/my-stats`);
  },

  /**
   * Verify a certificate by code
   */
  async verifyCertificate(verificationCode: string): Promise<CertificateVerification> {
    // Public endpoint - no auth required
    const response = await fetch(
      `${API_BASE_URL}/certificates/verify/${verificationCode}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to verify certificate');
    }

    return response.json();
  },

  /**
   * Get certificate details by ID
   */
  async getCertificate(certificateId: string): Promise<CertificateWithDetails> {
    // Public endpoint - no auth required
    const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch certificate');
    }

    return response.json();
  },

  /**
   * Update certificate settings
   */
  async updateCertificate(
    certificateId: string,
    update: CertificateUpdate
  ): Promise<CertificateWithDetails> {
    return apiClient.put(`${API_BASE_URL}/certificates/${certificateId}`, update);
  },

  /**
   * Get LinkedIn share data
   */
  async getLinkedInShareData(certificateId: string): Promise<LinkedInShareData> {
    return apiClient.get(
      `${API_BASE_URL}/certificates/${certificateId}/linkedin`
    );
  },

  /**
   * Download certificate as PDF
   */
  async downloadCertificatePDF(certificateId: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/certificates/${certificateId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to download certificate');
    }

    return response.blob();
  },

  /**
   * Admin: Revoke a certificate
   */
  async revokeCertificate(certificateId: string, reason: string): Promise<void> {
    await apiClient.post(
      `${API_BASE_URL}/certificates/admin/revoke/${certificateId}`,
      { reason }
    );
  },

  /**
   * Admin: Get all certificates
   */
  async getAllCertificates(
    page: number = 1,
    perPage: number = 20,
    filters?: {
      userId?: string;
      courseId?: string;
    }
  ): Promise<CertificateListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filters?.userId) params.append('user_id', filters.userId);
    if (filters?.courseId) params.append('course_id', filters.courseId);

    return apiClient.get(
      `${API_BASE_URL}/certificates/admin/all?${params.toString()}`
    );
  },
};