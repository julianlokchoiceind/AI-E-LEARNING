'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Award, Calendar, Clock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CertificateWithDetails } from '@/lib/types/certificate';

interface CertificateCardProps {
  certificate: CertificateWithDetails;
  onView?: (certificateId: string) => void;
}

export function CertificateCard({ certificate, onView }: CertificateCardProps) {
  const router = useRouter();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'programming': 'bg-blue-100 text-blue-800',
      'ai-fundamentals': 'bg-purple-100 text-purple-800',
      'machine-learning': 'bg-green-100 text-green-800',
      'ai-tools': 'bg-yellow-100 text-yellow-800',
      'production-ai': 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = () => {
    if (onView) {
      onView(certificate._id);
    } else {
      router.push(`/certificates/${certificate._id}`);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      {/* Certificate Preview */}
      <div
        className="h-48 p-6 text-white relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${certificate.background_color} 0%, ${certificate.accent_color} 100%)`,
        }}
      >
        <div className="flex items-center justify-center h-full">
          <Award className="h-16 w-16 opacity-20 absolute top-4 right-4" />
          <div className="text-center z-10">
            <p className="text-sm opacity-90 mb-1">Certificate of Completion</p>
            <h3 className="text-lg font-semibold line-clamp-2">
              {certificate.course_title}
            </h3>
          </div>
        </div>
        
        {/* Certificate Number */}
        <div className="absolute bottom-4 left-4">
          <p className="text-xs opacity-80 font-mono">
            {certificate.certificate_number}
          </p>
        </div>
      </div>

      {/* Certificate Details */}
      <div className="p-6">
        {/* Course Info */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getCategoryColor(certificate.course_category)}>
              {certificate.course_category.replace('-', ' ')}
            </Badge>
            <Badge className={getLevelColor(certificate.course_level)}>
              {certificate.course_level}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Instructor: {certificate.course_instructor}
          </p>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Final Score</p>
            <p className="text-lg font-semibold">{certificate.final_score}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="text-lg font-semibold">{certificate.total_hours.toFixed(1)}h</p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Issued {formatDate(certificate.issue_date)}</span>
          </div>
        </div>

        {/* Status */}
        {certificate.is_active ? (
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700">Valid Certificate</span>
            {certificate.is_public && (
              <Badge variant="outline">
                Public
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-700">Revoked</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleView} className="flex-1" size="sm">
            View Certificate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(certificate.verification_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}