'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Clock, TrendingUp, Download, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { CertificateCard } from '@/components/feature/CertificateCard';
import { useAuth } from '@/hooks/useAuth';
import { certificateAPI } from '@/lib/api/certificates';
import { CertificateWithDetails, CertificateStats } from '@/lib/types/certificate';
import { toast } from 'react-hot-toast';

const CertificatesPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchCertificates();
    fetchStats();
  }, [currentPage]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await certificateAPI.getMyCertificates(currentPage, 12);
      setCertificates(response.items);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await certificateAPI.getMyCertificateStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    if (selectedCategory === 'all') return true;
    return cert.course_category === selectedCategory;
  });

  const getCategoryDisplay = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'programming': 'Programming',
      'ai-fundamentals': 'AI Fundamentals',
      'machine-learning': 'Machine Learning',
      'ai-tools': 'AI Tools',
      'production-ai': 'Production AI'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Certificates</h1>
        <p className="text-gray-600">
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
                  <p className="text-sm text-gray-600">Total Certificates</p>
                  <p className="text-2xl font-bold">{stats.total_certificates}</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Courses Completed</p>
                  <p className="text-2xl font-bold">{stats.courses_completed}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hours Learned</p>
                  <p className="text-2xl font-bold">{stats.total_hours_learned.toFixed(0)}</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold">{stats.average_score.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
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
                {getCategoryDisplay(category)} ({count})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Certificates Grid */}
      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-gray-600 mb-4">
              Complete courses to earn certificates and showcase your achievements
            </p>
            <Button onClick={() => window.location.href = '/courses'}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
              <CertificateCard key={certificate._id} certificate={certificate} />
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
                    <span className="text-gray-600">{year}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / stats.total_certificates) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CertificatesPage;