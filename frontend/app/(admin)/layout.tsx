'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { SkeletonBox, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        // Use replace to prevent back navigation to admin pages
        router.replace('/not-found');
        return;
      }
      // Only set authorized after confirming admin role
      setAuthorized(true);
    }
  }, [user, loading, router]);

  // Show admin skeleton while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-muted animate-pulse">
        <div className="flex h-screen">
          {/* Sidebar Skeleton */}
          <div className="w-64 bg-background h-screen shadow-sm">
            <Container variant="admin">
              <SkeletonBox className="h-8 w-32 mb-8" />
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonBox key={i} className="h-10 w-full" />
                ))}
              </div>
            </Container>
          </div>
          
          {/* Main Content Skeleton */}
          <div className="flex-1 flex flex-col">
            {/* Header Skeleton */}
            <div className="bg-background border-b border-border h-16">
              <Container variant="header">
                <div className="flex h-16 items-center justify-between">
                  <SkeletonBox className="h-8 w-48" />
                  <div className="flex items-center space-x-4">
                    <SkeletonBox className="h-8 w-8 rounded-full" />
                    <SkeletonBox className="h-8 w-24" />
                  </div>
                </div>
              </Container>
            </div>
            
            {/* Page Content Skeleton */}
            <div className="flex-1 bg-background">
              <Container variant="admin">
                <div className="space-y-6">
                  <SkeletonBox className="h-8 w-64" />
                  <div className="grid grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonBox key={i} className="h-32" />
                    ))}
                  </div>
                  <SkeletonBox className="h-64 w-full" />
                </div>
              </Container>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything until user is confirmed as admin
  // This prevents AdminSidebar, AdminHeader, and children from mounting and making API calls
  if (!authorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-muted">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}