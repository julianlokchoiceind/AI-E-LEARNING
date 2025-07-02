'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Download, Share2, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CertificateDisplay } from '@/components/feature/CertificateDisplay';
import { certificateAPI } from '@/lib/api/certificates';
import { progressAPI } from '@/lib/api/progress';
import { CertificateWithDetails } from '@/lib/types/certificate';
import { toast } from 'react-hot-toast';

interface CourseCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  enrollmentId?: string;
}

export function CourseCompletionCelebration({
  isOpen,
  onClose,
  courseId,
  courseName,
  enrollmentId
}: CourseCompletionCelebrationProps) {
  const [certificate, setCertificate] = useState<CertificateWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkForCertificate();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, courseId]);

  const checkForCertificate = async () => {
    try {
      setLoading(true);
      
      // Check if course is completed and get certificate
      const response = await fetch(`/api/v1/progress/courses/${courseId}/check-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCertificate(result.data);
          setCertificateGenerated(true);
          toast.success(result.message);
        }
      }
    } catch (error) {
      console.error('Failed to check course completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    if (!enrollmentId) {
      toast.error('Enrollment information not found');
      return;
    }

    try {
      setLoading(true);
      const response = await certificateAPI.generateCertificate({
        enrollment_id: enrollmentId,
        template_id: 'default'
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      const cert = response.data;
      setCertificate(cert);
      setCertificateGenerated(true);
      toast.success(response.message);
    } catch (error: any) {
      console.error('Failed to generate certificate:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = () => {
    setShowCertificate(true);
  };

  const handleDownloadCertificate = async () => {
    if (!certificate) return;

    try {
      const blob = await certificateAPI.downloadCertificatePDF(certificate._id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${certificate.certificate_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download certificate:', error);
      toast.error(error.message || 'Something went wrong');
    }
  };

  const handleShareLinkedIn = async () => {
    if (!certificate) return;

    try {
      const response = await certificateAPI.getLinkedInShareData(certificate._id);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Something went wrong');
      }
      
      const shareData = response.data;
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareData.certificate_url
      )}`;
      
      window.open(linkedinUrl, '_blank', 'width=600,height=400');
      toast.success(response.message || 'Something went wrong');
    } catch (error: any) {
      console.error('Failed to get LinkedIn share data:', error);
      toast.error(error.message || 'Something went wrong');
    }
  };

  return (
    <>
      {/* Completion Celebration Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        size="lg"
      >
        <div className="text-center py-8">
          {/* Celebration Animation */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <Trophy className="h-20 w-20 text-yellow-500 mx-auto relative z-10 animate-bounce" />
          </div>

          {/* Congratulations Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Congratulations! 🎉
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            You have successfully completed <strong>{courseName}</strong>
          </p>

          {/* Achievement Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Course</p>
              <p className="font-semibold">Completed</p>
            </div>
            <div className="text-center">
              <Award className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Certificate</p>
              <p className="font-semibold">
                {certificateGenerated ? 'Ready' : 'Available'}
              </p>
            </div>
            <div className="text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Achievement</p>
              <p className="font-semibold">Unlocked</p>
            </div>
          </div>

          {/* Certificate Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Your Certificate of Completion
              </h3>
              
              {certificateGenerated && certificate ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Certificate #{certificate.certificate_number}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Final Score: <span className="font-semibold">{certificate.final_score}%</span> • 
                      Duration: <span className="font-semibold">{certificate.total_hours.toFixed(1)} hours</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleViewCertificate} variant="primary">
                      <Award className="h-4 w-4 mr-2" />
                      View Certificate
                    </Button>
                    <Button onClick={handleDownloadCertificate} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button onClick={handleShareLinkedIn} variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Share on LinkedIn
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Get your official certificate of completion to showcase your achievement.
                  </p>
                  <Button
                    onClick={generateCertificate}
                    loading={loading}
                    disabled={loading}
                    variant="primary"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Generate Certificate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/courses'}
                className="w-full"
              >
                Explore More Courses
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/certificates'}
                className="w-full"
              >
                View All Certificates
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6">
            <Button onClick={onClose} variant="ghost">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Certificate Display Modal */}
      {certificate && (
        <Modal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          title="Your Certificate"
          size="xl"
        >
          <CertificateDisplay certificate={certificate} showActions={true} />
        </Modal>
      )}
    </>
  );
}