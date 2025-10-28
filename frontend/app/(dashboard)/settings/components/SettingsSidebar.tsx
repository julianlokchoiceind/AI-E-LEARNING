'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfileQuery } from '@/hooks/queries/useUserProfile';
import { User, CreditCard } from 'lucide-react';

const navigationItems = [
  {
    name: 'Profile',
    tab: 'profile',
    icon: User,
  },
  {
    name: 'Billing',
    tab: 'billing',
    icon: CreditCard,
  },
];

export function SettingsSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const currentTab = searchParams.get('tab') || 'profile';

  // Fetch user profile for realtime avatar and name updates
  const { data: profileData } = useUserProfileQuery(isAuthenticated);
  const profile = profileData?.data;

  const handleTabClick = (tab: string) => {
    router.push(`/settings?tab=${tab}`);
  };

  // Generate user initials for avatar placeholder
  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get user's display name and email
  const userName = profile?.name || user?.name || 'User';
  const userEmail = profile?.email || user?.email || '';
  const avatarUrl = profile?.profile?.avatar;

  return (
    <nav className="py-8 pr-8">
      {/* User Info Header - GitHub style - Full width */}
      <div className="mb-8 pb-6 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {getInitials(userName)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">
              {userName}
            </h2>
            {userEmail && (
              <p className="text-sm text-muted-foreground">
                ({userEmail.split('@')[0]})
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">Your account</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <ul className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.tab;

          return (
            <li key={item.tab}>
              <button
                onClick={() => handleTabClick(item.tab)}
                className={`
                  group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                  ${isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
