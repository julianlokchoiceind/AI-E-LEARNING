'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Home, AlertTriangle } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
  currentRole?: string;
  showGoBack?: boolean;
  showGoHome?: boolean;
}

export function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this page.",
  requiredRole,
  currentRole,
  showGoBack = true,
  showGoHome = true
}: AccessDeniedProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'creator':
        return 'Content Creator';
      case 'student':
        return 'Student';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {requiredRole && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">Access Requirements</span>
            </div>
            <div className="text-sm text-yellow-700">
              <p><strong>Required Role:</strong> {getRoleDisplayName(requiredRole)}</p>
              {currentRole && (
                <p><strong>Your Role:</strong> {getRoleDisplayName(currentRole)}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {showGoHome && (
            <Button
              onClick={handleGoHome}
              className="w-full"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          )}
          
          {showGoBack && (
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t text-xs text-gray-500">
          <p>
            If you believe this is an error, please contact your administrator
            or check your account permissions.
          </p>
        </div>
      </Card>
    </div>
  );
}

// Higher-order component for role-based protection
export function withRoleProtection<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole: string | string[]
) {
  return function ProtectedComponent(props: T) {
    // This would typically get the user from context/hook
    // For now, we'll assume the middleware handles most of the protection
    return <Component {...props} />;
  };
}

// Hook for checking user permissions
export function useRoleCheck() {
  // This would integrate with your auth system
  const checkRole = (requiredRole: string | string[], userRole?: string) => {
    if (!userRole) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    return userRole === requiredRole || userRole === 'admin'; // Admin has access to everything
  };

  return { checkRole };
}