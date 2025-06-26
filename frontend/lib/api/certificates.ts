/**
 * Certificate API client
 */
import { authFetch } from '@/lib/utils/auth-helpers';
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
    const response = await authFetch(`${API_BASE_URL}/certificates/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate certificate');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get my certificates
   */
  async getMyCertificates(page: number = 1, perPage: number = 10): Promise<CertificateListResponse> {
    const response = await authFetch(
      `${API_BASE_URL}/certificates/my-certificates?page=${page}&per_page=${perPage}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch certificates');
    }

    const result = await response.json();
    return result;
  },

  /**
   * Get my certificate statistics
   */
  async getMyCertificateStats(): Promise<CertificateStats> {
    const response = await authFetch(`${API_BASE_URL}/certificates/my-stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch certificate stats');
    }

    return response.json();
  },

  /**
   * Verify a certificate by code
   */
  async verifyCertificate(verificationCode: string): Promise<CertificateVerification> {
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
    const response = await authFetch(`${API_BASE_URL}/certificates/${certificateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update certificate');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get LinkedIn share data
   */
  async getLinkedInShareData(certificateId: string): Promise<LinkedInShareData> {
    const response = await authFetch(
      `${API_BASE_URL}/certificates/${certificateId}/linkedin`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get share data');
    }

    return response.json();
  },

  /**
   * Download certificate as PDF
   */
  async downloadCertificate(certificateId: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/certificates/${certificateId}/download`
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
    const response = await authFetch(
      `${API_BASE_URL}/certificates/admin/revoke/${certificateId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to revoke certificate');
    }
  },

  /**
   * Admin: Get all certificates
   */
  async getAllCertificates(
    page: number = 1,
    perPage: number = 20,
    userId?: string,
    courseId?: string
  ): Promise<CertificateListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (userId) params.append('user_id', userId);
    if (courseId) params.append('course_id', courseId);

    const response = await authFetch(
      `${API_BASE_URL}/certificates/admin/all?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch certificates');
    }

    return response.json();
  },
};