'use client';

import React from 'react';
import { FileText, ExternalLink, Download, Link } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LessonResource } from '@/lib/types/course';

interface ResourceDisplayProps {
  resources: LessonResource[];
  className?: string;
}

/**
 * Display component for lesson resources in Student lesson player.
 * Shows resources with download/external link capabilities.
 * Read-only view for enrolled students.
 */
export const ResourceDisplay: React.FC<ResourceDisplayProps> = ({
  resources,
  className = ''
}) => {
  if (!resources || resources.length === 0) {
    return null;
  }

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'code':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'exercise':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'link':
      default:
        return <Link className="w-5 h-5 text-blue-600" />;
    }
  };

  const getResourceAction = (resource: LessonResource) => {
    // Check if it's a downloadable file (starts with uploaded file URL pattern)
    const isDownloadableFile = resource.url.includes('/uploads/') || 
                              resource.url.startsWith('/api/v1/files/') ||
                              resource.type !== 'link';

    if (isDownloadableFile) {
      return (
        <a
          href={resource.url}
          download
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          title="Download file"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      );
    } else {
      return (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
          Open
        </a>
      );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Learning Resources
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Download or access additional materials for this lesson
        </p>
      </div>

      <div className="p-6 space-y-4">
        {resources.map((resource, index) => (
          <div 
            key={index}
            className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-gray-50"
          >
            <div className="flex items-start gap-3 flex-1">
              {getResourceIcon(resource.type)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {resource.title}
                  </h3>
                  <Badge 
                    variant={resource.type === 'link' ? 'secondary' : 'default'}
                    size="sm"
                    className="text-xs shrink-0"
                  >
                    {resource.type.toUpperCase()}
                  </Badge>
                </div>
                
                {resource.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {resource.description}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 truncate">
                  {resource.url}
                </p>
              </div>
            </div>
            
            <div className="ml-4 shrink-0">
              {getResourceAction(resource)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceDisplay;