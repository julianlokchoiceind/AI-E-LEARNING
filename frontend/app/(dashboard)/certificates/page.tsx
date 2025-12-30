'use client';

import React, { useState } from 'react';
import { Trophy, Award, Clock, TrendingUp, Download, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CertificateCard } from '@/components/feature/CertificateCard';
import { SkeletonBox, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import { useAuth } from '@/hooks/useAuth';
import { CertificateWithDetails } from '@/lib/types/certificate';
import { useCertificatesQuery, useCertificateStatsQuery } from '@/hooks/queries/useCertificates';
import { getLocalizedHref } from '@/lib/i18n/config';

const CertificatesPage = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // React Query hooks for certificates data - replaces manual API calls
  const { 
    data: certificatesResponse, 
    loading: certificatesLoading, 
    error: certificatesError 
  } = useCertificatesQuery({
    page: currentPage,
    per_page: 12,
    category: selectedCategory === 'all' ? undefined : selectedCategory
  });

  const { 
    data: statsResponse, 
    loading: statsLoading 
  } = useCertificateStatsQuery();

  // Extract data from React Query responses
  const certificates = certificatesResponse?.data?.items || [];
  const totalPages = certificatesResponse?.data?.total_pages || 1;
  const stats = statsResponse?.data || null;
  const loading = certificatesLoading || statsLoading;



  // React Query handles filtering through API parameters
  const filteredCertificates = certificates;

  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'ml-basics': 'ML Basics',
      'deep-learning': 'Deep Learning',
      'nlp': 'NLP',
      'computer-vision': 'Computer Vision',
      'generative-ai': 'Generative AI',
      'ai-ethics': 'AI Ethics',
      'ai-for-work': 'AI for Work'
    };
    return categoryMap[category] || category;
  };

  // Handle error state
  if (certificatesError) {
    return (
      <Container variant="public">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive">Something went wrong</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <Container variant="public">
        {/* Header */}
        <div className="mb-8">
          <SkeletonBox className="h-9 w-64 mb-2" />
          <SkeletonBox className="h-5 w-96" />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-8 w-12" />
                </div>
                <SkeletonBox className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-background rounded-lg border p-6">
              <SkeletonBox className="h-32 w-full mb-4" />
              <SkeletonBox className="h-6 w-full mb-2" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container variant="public">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Certificates</h1>
        <p className="text-muted-foreground">
          View and manage your course completion certificates
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Certificates</p>
                  <p className="text-2xl font-bold">{stats.total_certificates}</p>
                </div>
                <Trophy className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Courses Completed</p>
                  <p className="text-2xl font-bold">{stats.courses_completed}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hours Learned</p>
                  <p className="text-2xl font-bold">{stats.total_hours_learned.toFixed(0)}</p>
                </div>
                <Clock className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{stats.average_score.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Filter */}
      {stats && Object.keys(stats.certificates_by_category).length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories ({stats.total_certificates})
            </Button>
            {Object.entries(stats.certificates_by_category).map(([category, count]) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {getCategoryDisplay(category)} ({count as number})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Grid */}
      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete courses to earn certificates and showcase your achievements
            </p>
            <Button onClick={() => window.location.href = getLocalizedHref('/courses')}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate: any) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Achievement Timeline */}
      {stats && stats.certificates_by_year && Object.keys(stats.certificates_by_year).length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Achievement Timeline</h3>
            <div className="space-y-2">
              {Object.entries(stats.certificates_by_year)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, count]) => (
                  <div key={year} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{year}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 w-32">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${((count as number) / stats.total_certificates) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count as number}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default CertificatesPage;