'use client';

import React, { useRef } from 'react';
import { Download, Share2, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ToastService } from '@/lib/toast/ToastService';
import { CertificateWithDetails } from '@/lib/types/certificate';
import { useDownloadCertificate, useLinkedInShareData } from '@/hooks/queries/useCertificates';

interface CertificateDisplayProps {
  certificate: CertificateWithDetails;
  showActions?: boolean;
}

export function CertificateDisplay({ certificate, showActions = true }: CertificateDisplayProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  
  // React Query mutations for certificate actions
  const { mutate: downloadCertificate, loading: downloading } = useDownloadCertificate();
  const { mutate: getLinkedInData, loading: sharing } = useLinkedInShareData();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownload = () => {
    downloadCertificate(certificate._id, {
      onSuccess: (response) => {
        if (!response.data) return;
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${certificate.certificate_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        ToastService.success('Certificate downloaded successfully');
      },
      onError: (error: any) => {
        console.error('Failed to download certificate:', error);
        ToastService.error(error.message || 'Something went wrong');
      }
    });
  };

  const handleShareLinkedIn = () => {
    getLinkedInData(certificate._id, {
      onSuccess: (response) => {
        if (!response.success || !response.data) {
          ToastService.error(response.message || 'Something went wrong');
          return;
        }
        
        const shareData = response.data;
        
        // LinkedIn share URL
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareData.certificate_url
        )}`;
        
        window.open(linkedinUrl, '_blank', 'width=600,height=400');
        ToastService.success(response.message || 'Something went wrong');
      },
      onError: (error: any) => {
        console.error('Failed to get LinkedIn share data:', error);
        ToastService.error(error.message || 'Something went wrong');
      }
    });
  };

  const handleShare = async () => {
    const shareUrl = certificate.verification_url;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate of Completion - ${certificate.course_title}`,
          text: `I completed ${certificate.course_title} on AI E-Learning Platform!`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      ToastService.success('Certificate link copied to clipboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Certificate */}
      <div
        ref={certificateRef}
        className="bg-white shadow-2xl rounded-lg overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${certificate.background_color} 0%, ${certificate.accent_color} 100%)`,
        }}
      >
        <div className="p-12 text-white">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Certificate of Completion</h1>
            <p className="text-xl opacity-90">{certificate.issuer_name}</p>
          </div>

          {/* Certificate Number */}
          <div className="text-center mb-8">
            <p className="text-sm opacity-80">Certificate Number</p>
            <p className="text-lg font-mono">{certificate.certificate_number}</p>
          </div>

          {/* Main Content */}
          <div className="bg-white/95 text-gray-900 rounded-lg p-8 mb-8">
            <div className="text-center">
              <p className="text-lg mb-4">This is to certify that</p>
              <h2 className="text-3xl font-bold mb-4">{certificate.user_name}</h2>
              <p className="text-lg mb-4">has successfully completed the course</p>
              <h3 className="text-2xl font-semibold mb-6">{certificate.course_title}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 mb-8">
                <div>
                  <p className="text-sm text-gray-600">Course Level</p>
                  <p className="font-semibold capitalize">{certificate.course_level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Final Score</p>
                  <p className="font-semibold">{certificate.final_score}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="font-semibold">{certificate.total_hours.toFixed(1)} hours</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Issued on {formatDate(certificate.issue_date)}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t-2 border-white/50 pt-2">
                <p className="font-semibold">{certificate.course_instructor}</p>
                <p className="text-sm opacity-80">Course Instructor</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-white/50 pt-2">
                <p className="font-semibold">{certificate.issuer_name}</p>
                <p className="text-sm opacity-80">{certificate.issuer_title}</p>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">
                Verify at: {certificate.verification_url}
              </span>
            </div>
            <p className="text-xs mt-2 opacity-80">
              Verification Code: {certificate.verification_code}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <Button 
            onClick={handleDownload}
            loading={downloading}
            disabled={downloading}
            variant="primary"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          <Button 
            onClick={handleShareLinkedIn}
            loading={sharing}
            disabled={sharing}
            variant="secondary"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Share on LinkedIn
          </Button>
          
          <Button onClick={handleShare} variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share Certificate
          </Button>
        </div>
      )}

      {/* Status */}
      {!certificate.is_active && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold">
            This certificate has been revoked
          </p>
          {certificate.revoke_reason && (
            <p className="text-red-600 text-sm mt-1">
              Reason: {certificate.revoke_reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}