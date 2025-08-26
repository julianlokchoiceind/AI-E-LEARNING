'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdMainPageSkeleton } from '@/components/ui/LoadingStates';

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
    return <AdMainPageSkeleton />;
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}