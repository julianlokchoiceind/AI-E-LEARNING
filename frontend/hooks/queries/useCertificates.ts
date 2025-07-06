'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { certificateAPI } from '@/lib/api/certificates';
import { StandardResponse } from '@/lib/types/api';

/**
 * React Query hooks for Certificate functionality
 * Replaces manual API calls in certificate components
 */

interface CertificateFilters {
  page?: number;
  per_page?: number;
  category?: string;
  year?: number;
}

/**
 * Get user's certificates with pagination and filtering
 */
export function useCertificatesQuery(filters: CertificateFilters = {}) {
  const { page = 1, per_page = 12, category, year } = filters;
  
  return useApiQuery(
    ['my-certificates', { page, per_page, category, year }],
    async () => {
      return certificateAPI.getMyCertificates();
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - certificates don't change frequently
      gcTime: 15 * 60 * 1000, // 15 minutes cache
    }
  );
}

/**
 * Get certificate statistics for the user
 */
export function useCertificateStatsQuery() {
  return useApiQuery(
    ['certificate-stats'],
    async () => {
      return certificateAPI.getMyCertificateStats();
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - stats change infrequently
      gcTime: 30 * 60 * 1000, // 30 minutes cache
    }
  );
}

/**
 * Get single certificate details
 */
export function useCertificateQuery(certificateId: string, enabled: boolean = true) {
  return useApiQuery(
    ['certificate', certificateId],
    async () => {
      return certificateAPI.getCertificate(certificateId);
    },
    {
      enabled: enabled && !!certificateId,
      staleTime: 15 * 60 * 1000, // 15 minutes - certificate details are static
      gcTime: 60 * 60 * 1000, // 1 hour cache
    }
  );
}

/**
 * Generate certificate for completed course
 */
export function useGenerateCertificate() {
  return useApiMutation(
    async (data: { enrollment_id: string; template_id?: string }) => {
      return certificateAPI.generateCertificate(data);
    },
    {
      invalidateQueries: [
        ['my-certificates'], // Refresh certificates list
        ['certificate-stats'], // Refresh stats
        ['course-progress'], // Refresh course progress
      ],
    }
  );
}

/**
 * Download certificate as PDF
 */
export function useDownloadCertificate() {
  return useApiMutation(
    async (certificateId: string): Promise<StandardResponse<Blob>> => {
      const blob = await certificateAPI.downloadCertificatePDF(certificateId);
      // Wrap blob in StandardResponse format for compatibility
      return {
        success: true,
        data: blob,
        message: 'Certificate downloaded successfully'
      };
    },
    {
      // No cache invalidation needed for downloads
      showToast: false, // Handle download success differently
    }
  );
}

/**
 * Get LinkedIn sharing data for certificate
 */
export function useLinkedInShareData() {
  return useApiMutation(
    async (certificateId: string) => {
      return certificateAPI.getLinkedInShareData(certificateId);
    },
    {
      // No cache invalidation needed for sharing
      showToast: false, // Handle sharing success differently
    }
  );
}

/**
 * Verify certificate (public endpoint)
 */
export function useVerifyCertificateQuery(certificateNumber: string, enabled: boolean = true) {
  return useApiQuery(
    ['verify-certificate', certificateNumber],
    async () => {
      return certificateAPI.verifyCertificate(certificateNumber);
    },
    {
      enabled: enabled && !!certificateNumber,
      staleTime: 60 * 60 * 1000, // 1 hour - verification results are static
      gcTime: 2 * 60 * 60 * 1000, // 2 hours cache
    }
  );
}

/**
 * Get all certificates (admin only)
 */
export function useAllCertificatesQuery(filters: CertificateFilters & { status?: string } = {}) {
  const { page = 1, per_page = 20, category, year, status } = filters;
  
  return useApiQuery(
    ['all-certificates', { page, per_page, category, year, status }],
    async () => {
      return certificateAPI.getAllCertificates();
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - admin data changes more frequently
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );
}

/**
 * Revoke certificate (admin only)
 */
export function useRevokeCertificate() {
  return useApiMutation(
    async ({ certificateId, reason }: { certificateId: string; reason: string }) => {
      return certificateAPI.revokeCertificate(certificateId, reason);
    },
    {
      invalidateQueries: [
        ['all-certificates'], // Refresh admin certificates list
        ['certificate', 'certificateId'], // Refresh specific certificate
      ],
    }
  );
}