'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { CertificateDisplay } from '@/components/feature/CertificateDisplay';
import { useAuth } from '@/hooks/useAuth';
import { useCertificateQuery } from '@/hooks/queries/useCertificates';
import { useApiMutation } from '@/hooks/useApiMutation';
import { certificateAPI } from '@/lib/api/certificates';
import { CertificateWithDetails, CertificateUpdate } from '@/lib/types/certificate';
import { ToastService } from '@/lib/toast/ToastService';

const CertificateViewPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const certificateId = params.id as string;

  const [showEditModal, setShowEditModal] = useState(false);
  const [updateData, setUpdateData] = useState<CertificateUpdate>({
    is_public: true,
    template_id: 'default',
    background_color: '#1e40af',
    accent_color: '#dbeafe',
  });

  // React Query hook for fetching certificate
  const { 
    data: certificateResponse, 
    loading, 
    error,
    refetch
  } = useCertificateQuery(certificateId, !!certificateId);

  const certificate = certificateResponse?.data || null;

  // React Query mutation for updating certificate
  const { mutate: updateCertificate, loading: updateLoading } = useApiMutation(
    ({ certificateId, updateData }: { certificateId: string; updateData: CertificateUpdate }) => 
      certificateAPI.updateCertificate(certificateId, updateData),
    {
      onSuccess: (response) => {
        setShowEditModal(false);
        ToastService.success(response.message || 'Something went wrong');
        refetch(); // Refresh certificate data
      },
      onError: (error: any) => {
        console.error('Failed to update certificate:', error);
        ToastService.error(error.message || 'Something went wrong');
      }
    }
  );

  // Initialize update data when certificate loads
  React.useEffect(() => {
    if (certificate) {
      setUpdateData({
        is_public: certificate.is_public,
        template_id: certificate.template_id,
        background_color: certificate.background_color,
        accent_color: certificate.accent_color,
      });
    }
  }, [certificate]);

  // Handle errors
  React.useEffect(() => {
    if (error) {
      console.error('Failed to fetch certificate:', error);
      ToastService.error(error?.message || 'Something went wrong');
      router.push('/certificates');
    }
  }, [error, router]);

  const handleUpdate = () => {
    updateCertificate({ certificateId, updateData });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading certificate..." />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 text-lg">Certificate not found</p>
      </div>
    );
  }

  const isOwner = user && user.id === certificate.user_id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/certificates')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Certificates
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Certificate Details</h1>
            <p className="text-gray-600">
              {certificate.course_title}
            </p>
          </div>

          {isOwner && (
            <Button onClick={() => setShowEditModal(true)} variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Certificate Display */}
      <CertificateDisplay certificate={certificate} showActions={isOwner || false} />

      {/* Certificate Info */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Certificate Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Certificate Number</p>
              <p className="font-mono">{certificate.certificate_number}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Issue Date</p>
              <p>{new Date(certificate.issue_date).toLocaleDateString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Verification Code</p>
              <p className="font-mono">{certificate.verification_code}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Privacy Setting</p>
              <div className="flex items-center gap-2 mt-1">
                {certificate.is_public ? (
                  <>
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700">Private</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Course Category</p>
              <p className="capitalize">{certificate.course_category.replace('-', ' ')}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Course Level</p>
              <p className="capitalize">{certificate.course_level}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Certificate Settings"
      >
        <div className="space-y-4">
          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Setting
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={updateData.is_public === true}
                  onChange={() => setUpdateData({ ...updateData, is_public: true })}
                  className="h-4 w-4 text-blue-600"
                />
                <div>
                  <p className="font-medium">Public</p>
                  <p className="text-sm text-gray-600">
                    Anyone can view this certificate with the link
                  </p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={updateData.is_public === false}
                  onChange={() => setUpdateData({ ...updateData, is_public: false })}
                  className="h-4 w-4 text-blue-600"
                />
                <div>
                  <p className="font-medium">Private</p>
                  <p className="text-sm text-gray-600">
                    Only you can view this certificate
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate Template
            </label>
            <select
              value={updateData.template_id}
              onChange={(e) => setUpdateData({ ...updateData, template_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="default">Default Template</option>
              <option value="modern">Modern Template</option>
              <option value="classic">Classic Template</option>
              <option value="minimal">Minimal Template</option>
            </select>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate Colors
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={updateData.background_color}
                  onChange={(e) => setUpdateData({ ...updateData, background_color: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={updateData.accent_color}
                  onChange={(e) => setUpdateData({ ...updateData, accent_color: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={updateLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CertificateViewPage;