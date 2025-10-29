'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { SettingsSidebar } from './components/SettingsSidebar';
import ProfileContent from './components/ProfileContent';
import BillingContent from './components/BillingContent';
import { AccountContent } from './components/AccountContent';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (tab: string) => {
    router.push(`/settings?tab=${tab}`);
  };

  // Render appropriate content based on current tab
  const renderContent = () => {
    switch (currentTab) {
      case 'profile':
        return <ProfileContent />;
      case 'billing':
        return <BillingContent />;
      case 'account':
        return <AccountContent />;
      default:
        return <ProfileContent />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: Horizontal tabs at top - Scrollable when many tabs */}
      <div className="lg:hidden border-b border-border bg-card sticky top-0 z-10">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTab === 'profile'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => handleTabChange('billing')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTab === 'billing'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => handleTabChange('account')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTab === 'account'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            }`}
          >
            Account
          </button>
        </div>
      </div>

      {/* Desktop: GitHub-style layout with sidebar */}
      <div className="flex max-w-[1280px] mx-auto">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <SettingsSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <Container variant="public">
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      </Container>
    }>
      <SettingsContent />
    </Suspense>
  );
}
