'use client';

import React from 'react';
import { FileText, ExternalLink, Download, Link, Image, FileCode, FileArchive } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LessonResource } from '@/lib/types/course';
import { getAttachmentUrl } from '@/lib/utils/attachmentUrl';

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
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-700" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-green-600" />;
      case 'zip':
        return <FileArchive className="w-5 h-5 text-purple-600" />;
      case 'exercise':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'link':
        return <Link className="w-5 h-5 text-blue-600" />;
      case 'other':
      default:
        // For 'other' type (images, etc)
        return <Image className="w-5 h-5 text-gray-600" />;
    }
  };

  const getResourceAction = (resource: LessonResource) => {
    // Check if it's a downloadable file (starts with uploaded file URL pattern)
    const isDownloadableFile = resource.url.includes('/uploads/') || 
                              resource.url.startsWith('/api/v1/files/') ||
                              resource.type !== 'link';

    if (isDownloadableFile) {
      // Extract filename from URL or use title
      const urlParts = resource.url.split('/');
      const filename = urlParts[urlParts.length - 1] || resource.title;
      
      // Use getAttachmentUrl for proper URL handling
      const fullUrl = getAttachmentUrl(resource.url);
      const downloadUrl = fullUrl.includes('?') 
        ? `${fullUrl}&download=true`
        : `${fullUrl}?download=true`;
      
      return (
        <a
          href={downloadUrl}
          download={filename}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
          title="Download file"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      );
    } else {
      return (
        <a
          href={getAttachmentUrl(resource.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
          Open
        </a>
      );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {resources.map((resource, index) => (
          <div 
            key={index}
            className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-gray-50"
          >
            <div className="flex items-start gap-3 flex-1">
              {getResourceIcon(resource.type)}
              
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {resource.title}
                  </h3>
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
  );
};

export default ResourceDisplay;