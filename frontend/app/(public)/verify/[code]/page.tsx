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
import { useI18n } from '@/lib/i18n/context';

const CertificateVerificationPage = () => {
  const params = useParams();
  const { t } = useI18n();
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
          <h1 className="text-4xl font-bold mb-4">{t('certificateVerify.title')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('certificateVerify.subtitle')}
          </p>
        </div>

        {/* Manual Search */}
        {!verificationCode && (
          <Card className="max-w-md mx-auto mb-12">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('certificateVerify.enterCode')}</h3>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder={t('certificateVerify.codePlaceholder')}
                    className="w-full px-3 py-2 border rounded-md uppercase"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('certificateVerify.codeHint')}
                  </p>
                </div>
                <Button
                  onClick={handleManualVerification}
                  disabled={!manualCode.trim() || manualLoading}
                  loading={manualLoading}
                  className="w-full"
                >
                  {t('certificateVerify.verifyButton')}
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
                        {t('certificateVerify.verified')}
                      </h2>
                      <p className="text-success">
                        {t('certificateVerify.verifiedMessage')}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-destructive mb-2">
                        {t('certificateVerify.failed')}
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
                  <h3 className="text-lg font-semibold mb-4">{t('certificateVerify.verificationDetails')}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">{t('certificateVerify.certificateInfo')}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('certificateVerify.certificateNumber')}:</span>
                          <span className="ml-2 font-mono">
                            {verification.certificate.certificate_number}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('certificateVerify.issueDate')}:</span>
                          <span className="ml-2">
                            {new Date(verification.certificate.issue_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('certificateVerify.verificationCode')}:</span>
                          <span className="ml-2 font-mono">
                            {verification.certificate.verification_code}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">{t('certificateVerify.courseInfo')}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('certificateVerify.courseTitle')}:</span>
                          <span className="ml-2">{verification.certificate.course_title}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('certificateVerify.creator')}:</span>
                          <span className="ml-2">{verification.certificate.course_creator}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('certificateVerify.level')}:</span>
                          <span className="ml-2 capitalize">
                            {verification.certificate.course_level}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('certificateVerify.finalScore')}:</span>
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
                  <h3 className="text-lg font-semibold mb-4">{t('certificateVerify.verifyAnother')}</h3>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder={t('certificateVerify.enterCodePlaceholder')}
                      className="flex-1 px-3 py-2 border rounded-md uppercase"
                      maxLength={8}
                    />
                    <Button
                      onClick={handleManualVerification}
                      disabled={!manualCode.trim() || manualLoading}
                      loading={manualLoading}
                    >
                      {t('certificateVerify.verify')}
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
              <h3 className="text-lg font-semibold mb-4">{t('certificateVerify.aboutVerification')}</h3>

              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t('certificateVerify.howToVerify')}</p>
                    <p>
                      {t('certificateVerify.howToVerifyDesc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t('certificateVerify.security')}</p>
                    <p>
                      {t('certificateVerify.securityDesc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t('certificateVerify.support')}</p>
                    <p>
                      {t('certificateVerify.supportDesc')}{' '}
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