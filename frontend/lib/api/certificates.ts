/**
 * Certificate API client
 */
import { apiClient } from './api-client';
import { StandardResponse } from '@/lib/types/api';
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

export const certificateAPI = {
  /**
   * Generate a certificate for completed course
   */
  async generateCertificate(request: CertificateGenerateRequest): Promise<StandardResponse<CertificateWithDetails>> {
    return apiClient.post<StandardResponse<CertificateWithDetails>>('/certificates/generate', request);
  },

  /**
   * Get my certificates
   */
  async getMyCertificates(page: number = 1, perPage: number = 10): Promise<StandardResponse<CertificateListResponse>> {
    return apiClient.get<StandardResponse<CertificateListResponse>>(
      `/certificates/my-certificates?page=${page}&per_page=${perPage}`
    );
  },

  /**
   * Get my certificate statistics
   */
  async getMyCertificateStats(): Promise<StandardResponse<CertificateStats>> {
    return apiClient.get<StandardResponse<CertificateStats>>('/certificates/my-stats');
  },

  /**
   * Verify a certificate by code
   */
  async verifyCertificate(verificationCode: string): Promise<StandardResponse<CertificateVerification>> {
    // Public endpoint - no auth required
    return apiClient.get<StandardResponse<CertificateVerification>>(
      `/certificates/verify/${verificationCode}`,
      { requireAuth: false }
    );
  },

  /**
   * Get certificate details by ID
   */
  async getCertificate(certificateId: string): Promise<StandardResponse<CertificateWithDetails>> {
    // Public endpoint - no auth required
    return apiClient.get<StandardResponse<CertificateWithDetails>>(
      `/certificates/${certificateId}`,
      { requireAuth: false }
    );
  },

  /**
   * Update certificate settings
   */
  async updateCertificate(
    certificateId: string,
    update: CertificateUpdate
  ): Promise<StandardResponse<CertificateWithDetails>> {
    return apiClient.put<StandardResponse<CertificateWithDetails>>(`/certificates/${certificateId}`, update);
  },

  /**
   * Get LinkedIn share data
   */
  async getLinkedInShareData(certificateId: string): Promise<StandardResponse<LinkedInShareData>> {
    return apiClient.get<StandardResponse<LinkedInShareData>>(
      `/certificates/${certificateId}/linkedin`
    );
  },

  /**
   * Download certificate as PDF
   */
  async downloadCertificatePDF(certificateId: string): Promise<Blob> {
    // Download files require special handling
    return apiClient.download(
      `/certificates/${certificateId}/download`
    );
  },

  /**
   * Admin: Revoke a certificate
   */
  async revokeCertificate(certificateId: string, reason: string): Promise<StandardResponse<any>> {
    return apiClient.post<StandardResponse<any>>(
      `/certificates/admin/revoke/${certificateId}`,
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
  ): Promise<StandardResponse<CertificateListResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filters?.userId) params.append('user_id', filters.userId);
    if (filters?.courseId) params.append('course_id', filters.courseId);

    return apiClient.get<StandardResponse<CertificateListResponse>>(
      `/certificates/admin/all?${params.toString()}`
    );
  },
};