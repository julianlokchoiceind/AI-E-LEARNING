'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { CertificateDisplay } from '@/components/feature/CertificateDisplay';
import { useAuth } from '@/hooks/useAuth';
import { useCertificateQuery } from '@/hooks/queries/useCertificates';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { Container } from '@/components/ui/Container';

const CertificateViewPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const certificateId = params.id as string;

  // Inline message for certificate errors
  const certificateErrorMessage = useInlineMessage('certificate-error');

  // React Query hook for fetching certificate
  const {
    data: certificateResponse,
    loading,
    error,
  } = useCertificateQuery(certificateId, !!certificateId);

  const certificate = certificateResponse?.data || null;

  // Handle errors
  React.useEffect(() => {
    if (error) {
      console.error('Failed to fetch certificate:', error);
      certificateErrorMessage.showError(error?.message || 'Something went wrong');
    }
  }, [error, certificateErrorMessage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">Certificate not found</p>
      </div>
    );
  }

  const isOwner = user && user.id === certificate.user_id;

  return (
    <Container variant="public">
      {/* Certificate Error Message */}
      {certificateErrorMessage.message && (
        <InlineMessage 
          message={certificateErrorMessage.message.message} 
          type={certificateErrorMessage.message.type}
          onDismiss={certificateErrorMessage.clear}
        />
      )}
      
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/certificates')}
          className="mb-4"
        >
          Back to Certificates
        </Button>

        <div>
          <h1 className="text-3xl font-bold mb-2">Certificate Details</h1>
          <p className="text-muted-foreground">{certificate.course_title}</p>
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
              <p className="text-sm text-muted-foreground">Certificate Number</p>
              <p className="font-mono">{certificate.certificate_number}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p>{new Date(certificate.issue_date).toLocaleDateString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Verification Code</p>
              <p className="font-mono">{certificate.verification_code}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Privacy Setting</p>
              <div className="flex items-center gap-2 mt-1">
                {certificate.is_public ? (
                  <>
                    <Globe className="h-4 w-4 text-success" />
                    <span className="text-success">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Private</span>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Course Category</p>
              <p className="capitalize">{certificate.course_category.replace('-', ' ')}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Course Level</p>
              <p className="capitalize">{certificate.course_level}</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </Container>
  );
};

export default CertificateViewPage;