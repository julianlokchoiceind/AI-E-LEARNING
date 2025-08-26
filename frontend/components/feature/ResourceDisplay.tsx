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
        return <FileText className="w-5 h-5 text-destructive" />;
      case 'doc':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-success" />;
      case 'zip':
        return <FileArchive className="w-5 h-5 text-primary" />;
      case 'exercise':
        return <FileText className="w-5 h-5 text-warning" />;
      case 'link':
        return <Link className="w-5 h-5 text-primary" />;
      case 'other':
      default:
        // For 'other' type (images, etc)
        return <Image className="w-5 h-5 text-muted-foreground" />;
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
          className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
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
          className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
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
            className="flex items-start justify-between p-4 border border-border rounded-lg hover:border-border/80 transition-colors bg-muted/50"
          >
            <div className="flex items-start gap-3 flex-1">
              {getResourceIcon(resource.type)}
              
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <h3 className="font-medium text-foreground truncate">
                    {resource.title}
                  </h3>
                </div>
                
                {resource.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {resource.description}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground truncate">
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