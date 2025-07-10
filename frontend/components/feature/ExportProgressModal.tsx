'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ButtonSkeleton } from '@/components/ui/LoadingStates';
import { useExportProgress } from '@/hooks/queries/useStudent';
import { ToastService } from '@/lib/toast/ToastService';
import { Download, FileText, Table } from 'lucide-react';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'csv' | 'pdf';

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  
  // React Query mutation for export - automatic loading states and error handling
  const { mutate: exportProgress, loading: isExporting } = useExportProgress();

  const handleExport = () => {
    // Use React Query mutation for API call
    exportProgress({ format: selectedFormat }, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          // The API returns blob data for file download
          const blob = response.data;
          const filename = `learning_progress_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
          
          // Create blob and download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          ToastService.success(response.message || 'Something went wrong');
          onClose();
        } else {
          ToastService.error(response.message || 'Something went wrong');
        }
      },
      onError: (error: any) => {
        console.error('Export failed:', error);
        ToastService.error(error.message || 'Something went wrong');
      }
    });
  };

  const formatOptions = [
    {
      value: 'csv' as ExportFormat,
      label: 'CSV (Spreadsheet)',
      description: 'Export as comma-separated values for use in Excel, Google Sheets, etc.',
      icon: Table,
      fileSize: '~50KB',
    },
    {
      value: 'pdf' as ExportFormat,
      label: 'PDF (Document)',
      description: 'Export as a formatted PDF document for sharing or printing',
      icon: FileText,
      fileSize: '~200KB',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Learning Progress"
      size="md"
    >
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mb-4">
            Export your complete learning progress including course enrollments, lesson completion, 
            quiz scores, certificates, and learning statistics.
          </p>
        </div>

        {/* Format Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Choose Export Format</h3>
          <div className="space-y-3">
            {formatOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedFormat === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFormat(option.value)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={selectedFormat === option.value}
                        onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <IconComponent className="h-6 w-6 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {option.label}
                        </h4>
                        <span className="text-xs text-gray-500">{option.fileSize}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Content Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Export Includes:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Course enrollment details and completion status</li>
            <li>• Individual lesson progress and watch time</li>
            <li>• Quiz attempts and scores</li>
            <li>• Certificates earned</li>
            <li>• Learning statistics and streaks</li>
            <li>• Timestamps for all activities</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? (
              <ButtonSkeleton variant="primary" />
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
        </div>

        {/* Privacy Note */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p>
            📋 <strong>Privacy:</strong> Your export contains personal learning data. 
            Keep it secure and don't share with unauthorized parties.
          </p>
        </div>
      </div>
    </Modal>
  );
};