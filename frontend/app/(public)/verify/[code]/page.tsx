'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CertificateDisplay } from '@/components/feature/CertificateDisplay';
import { certificateAPI } from '@/lib/api/certificates';
import { CertificateVerification } from '@/lib/types/certificate';

const CertificateVerificationPage = () => {
  const params = useParams();
  const verificationCode = params.code as string;

  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [manualSearchLoading, setManualSearchLoading] = useState(false);

  useEffect(() => {
    if (verificationCode) {
      verifyCertificate(verificationCode);
    } else {
      setLoading(false);
    }
  }, [verificationCode]);

  const verifyCertificate = async (code: string) => {
    try {
      setLoading(true);
      const result = await certificateAPI.verifyCertificate(code);
      if (result.success && result.data) {
        setVerification(result.data);
      } else {
        setVerification({
          is_valid: false,
          message: result.message || 'Failed to verify certificate',
          certificate: undefined
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerification({
        is_valid: false,
        message: 'Failed to verify certificate. Please check the code and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = async () => {
    if (!manualCode.trim()) return;
    
    setManualSearchLoading(true);
    await verifyCertificate(manualCode.trim().toUpperCase());
    setManualSearchLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Certificate Verification</h1>
          <p className="text-gray-600 text-lg">
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
                  <p className="text-xs text-gray-500 mt-1">
                    You can find the verification code on the certificate
                  </p>
                </div>
                <Button
                  onClick={handleManualVerification}
                  disabled={!manualCode.trim() || manualSearchLoading}
                  loading={manualSearchLoading}
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
          <div className="max-w-4xl mx-auto">
            {/* Status Card */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  {verification.is_valid ? (
                    <div className="text-center">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-green-700 mb-2">
                        Certificate Verified
                      </h2>
                      <p className="text-green-600">
                        This certificate is authentic and valid
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-red-700 mb-2">
                        Verification Failed
                      </h2>
                      <p className="text-red-600">{verification.message}</p>
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
                          <span className="text-gray-600">Certificate Number:</span>
                          <span className="ml-2 font-mono">
                            {verification.certificate.certificate_number}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Issue Date:</span>
                          <span className="ml-2">
                            {new Date(verification.certificate.issue_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Verification Code:</span>
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
                          <span className="text-gray-600">Course Title:</span>
                          <span className="ml-2">{verification.certificate.course_title}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Instructor:</span>
                          <span className="ml-2">{verification.certificate.course_instructor}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Level:</span>
                          <span className="ml-2 capitalize">
                            {verification.certificate.course_level}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Final Score:</span>
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
                      disabled={!manualCode.trim() || manualSearchLoading}
                      loading={manualSearchLoading}
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
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">About Certificate Verification</h3>
              
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">How to verify</p>
                    <p>
                      Enter the 8-character verification code found on the certificate, 
                      or use the direct verification link provided with the certificate.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Security</p>
                    <p>
                      All certificates are cryptographically secured and stored in our 
                      database. Each certificate has a unique verification code that 
                      cannot be forged.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Support</p>
                    <p>
                      If you have questions about certificate verification, please contact 
                      our support team at{' '}
                      <a href="mailto:support@ai-elearning.com" className="text-blue-600">
                        support@ai-elearning.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;