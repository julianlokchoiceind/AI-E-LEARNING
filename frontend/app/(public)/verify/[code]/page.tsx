'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingStates';
import { CertificateDisplay } from '@/components/feature/CertificateDisplay';
import { useVerifyCertificateQuery } from '@/hooks/queries/useCertificates';
import { CertificateVerification } from '@/lib/types/certificate';
import { Container } from '@/components/ui/Container';

const CertificateVerificationPage = () => {
  const params = useParams();
  const verificationCode = params.code as string;
  const [manualCode, setManualCode] = useState('');
  const [manualSearchCode, setManualSearchCode] = useState('');

  // React Query hook for automatic verification from URL
  const { 
    data: urlVerificationResponse, 
    loading: urlLoading 
  } = useVerifyCertificateQuery(verificationCode, !!verificationCode);

  // React Query hook for manual verification
  const { 
    data: manualVerificationResponse, 
    loading: manualLoading,
    execute: executeManualVerification 
  } = useVerifyCertificateQuery(manualSearchCode, false);

  // Determine which verification result to show
  const verification = manualVerificationResponse?.data || urlVerificationResponse?.data || null;
  const loading = urlLoading || manualLoading;

  const handleManualVerification = async () => {
    if (!manualCode.trim()) return;
    
    const searchCode = manualCode.trim().toUpperCase();
    setManualSearchCode(searchCode);
    await executeManualVerification();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-primary">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 py-12">
      <Container variant="public">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Certificate Verification</h1>
          <p className="text-muted-foreground text-lg">
            Verify the authenticity of certificates issued by AI E-Learning Platform
          </p>
        </div>

        {/* Manual Search */}
        {!verificationCode && (
          <Card className="max-w-md mx-auto mb-12">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Enter Verification Code</h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter 8-character code (e.g., ABC12345)"
                    className="w-full px-3 py-2 border rounded-md uppercase"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can find the verification code on the certificate
                  </p>
                </div>
                <Button
                  onClick={handleManualVerification}
                  disabled={!manualCode.trim() || manualLoading}
                  loading={manualLoading}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Verify Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Result */}
        {verification && (
          <div>
            {/* Status Card */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  {verification.is_valid ? (
                    <div className="text-center">
                      <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-success mb-2">
                        Certificate Verified
                      </h2>
                      <p className="text-success">
                        This certificate is authentic and valid
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-destructive mb-2">
                        Verification Failed
                      </h2>
                      <p className="text-destructive">{verification.message}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certificate Display */}
            {verification.is_valid && verification.certificate && (
              <div className="mb-8">
                <CertificateDisplay 
                  certificate={verification.certificate} 
                  showActions={false}
                />
              </div>
            )}

            {/* Verification Details */}
            {verification.is_valid && verification.certificate && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Verification Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Certificate Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Certificate Number:</span>
                          <span className="ml-2 font-mono">
                            {verification.certificate.certificate_number}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Issue Date:</span>
                          <span className="ml-2">
                            {new Date(verification.certificate.issue_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Verification Code:</span>
                          <span className="ml-2 font-mono">
                            {verification.certificate.verification_code}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Course Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Course Title:</span>
                          <span className="ml-2">{verification.certificate.course_title}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Creator:</span>
                          <span className="ml-2">{verification.certificate.course_creator}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Level:</span>
                          <span className="ml-2 capitalize">
                            {verification.certificate.course_level}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Final Score:</span>
                          <span className="ml-2">{verification.certificate.final_score}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Try Another Search */}
            {verificationCode && (
              <Card className="mt-8">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Verify Another Certificate</h3>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter verification code"
                      className="flex-1 px-3 py-2 border rounded-md uppercase"
                      maxLength={8}
                    />
                    <Button
                      onClick={handleManualVerification}
                      disabled={!manualCode.trim() || manualLoading}
                      loading={manualLoading}
                    >
                      Verify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">About Certificate Verification</h3>
              
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">How to verify</p>
                    <p>
                      Enter the 8-character verification code found on the certificate, 
                      or use the direct verification link provided with the certificate.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Security</p>
                    <p>
                      All certificates are cryptographically secured and stored in our 
                      database. Each certificate has a unique verification code that 
                      cannot be forged.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Support</p>
                    <p>
                      If you have questions about certificate verification, please contact 
                      our support team at{' '}
                      <a href="mailto:support@ai-elearning.com" className="text-primary">
                        support@ai-elearning.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default CertificateVerificationPage;