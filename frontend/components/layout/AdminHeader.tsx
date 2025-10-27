'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { useRouter } from 'next/navigation';
import { useSupportNotifications } from '@/hooks/useSupportNotifications';
import { useUserProfileQuery } from '@/hooks/queries/useUserProfile';
import {
  Search,
  Menu,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Home,
  AlertCircle,
  CheckCircle,
  Bell
} from 'lucide-react';

// Category display name mapping
const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    bug_report: 'Bug Report',
    feature_request: 'Feature Request',
    billing: 'Billing & Payment',
    technical_support: 'Technical Support',
    account: 'Account',
    other: 'Other'
  };
  return categoryMap[category] || category;
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

export function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userMenuPosition, setUserMenuPosition] = useState({ right: 0, top: 64 });
  const [notificationsPosition, setNotificationsPosition] = useState({ right: 0, top: 64 });
  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  // Get support ticket notifications for admin
  const { unreadCount, recentTickets } = useSupportNotifications();

  // Fetch user profile for realtime avatar updates
  const { data: profileData } = useUserProfileQuery(true);
  const profile = profileData?.data;
  
  // Calculate dropdown positions
  useEffect(() => {
    if (userButtonRef.current && showUserMenu) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserMenuPosition({
        right: window.innerWidth - rect.right,
        top: 64 // Header height
      });
    }
  }, [showUserMenu]);

  useEffect(() => {
    if (notificationsButtonRef.current && showNotifications) {
      const rect = notificationsButtonRef.current.getBoundingClientRect();
      setNotificationsPosition({
        right: window.innerWidth - rect.right,
        top: 64 // Header height
      });
    }
  }, [showNotifications]);

  // Close dropdowns when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    const handleScroll = () => {
      setShowNotifications(false);
      setShowUserMenu(false);
    };

    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true); // Use capture phase for all scroll events
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [showNotifications, showUserMenu]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <>
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToDashboard}
          className="text-muted-foreground"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Search */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search users, courses, payments..."
          size="sm"
          className="w-80"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">

        {/* Support Notifications Button */}
        <Button
          ref={notificationsButtonRef}
          variant="ghost"
          size="sm"
          className="relative"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <div className="relative inline-block">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-destructive rounded-full flex items-center justify-center border-[1.5px] border-card shadow-sm px-0.5 transform translate-x-1/4 -translate-y-1/4">
                <span className="text-[9px] font-bold text-white leading-none">
                  {unreadCount}
                </span>
              </div>
            )}
          </div>
        </Button>

        {/* User Menu Button */}
        <button
          ref={userButtonRef}
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-2 py-2 text-sm nav-hover rounded-md transition-colors"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
            {profile?.profile?.avatar ? (
              <img
                src={profile.profile.avatar}
                alt={profile?.name || user?.name || 'Admin'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {getInitials(profile?.name || user?.name || user?.email)}
                </span>
              </div>
            )}
          </div>
          <span className="hidden md:block font-medium">{profile?.name || user?.name}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </header>

    {/* Support Notifications Dropdown - Rendered outside header */}
    {showNotifications && (
      <div
        ref={notificationsRef}
        className="fixed bg-card border border-border rounded-lg shadow-lg z-50 w-80"
        style={{
          right: `${notificationsPosition.right}px`,
          top: `${notificationsPosition.top}px`
        }}
      >
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Support Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {recentTickets.length > 0 ? (
            <>
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    router.push(`/admin/support/${ticket.id}`);
                    setShowNotifications(false);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {ticket.status === 'open' ? (
                          <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        )}
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {getCategoryDisplayName(ticket.category)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-1 truncate">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {ticket.user_name} • {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {ticket.status === 'open' && (
                      <div className="h-2 w-2 bg-destructive rounded-full flex-shrink-0 ml-2"></div>
                    )}
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    router.push('/admin/support');
                    setShowNotifications(false);
                  }}
                >
                  View All Support Tickets
                </Button>
              </div>
            </>
          ) : (
            <div className="px-4 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent notifications</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* User Menu Dropdown - Rendered outside header */}
    {showUserMenu && (
      <div
        ref={userMenuRef}
        className="fixed bg-card border border-border rounded-lg shadow-lg z-50 w-56"
        style={{
          right: `${userMenuPosition.right}px`,
          top: `${userMenuPosition.top}px`
        }}
      >
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
              {profile?.profile?.avatar ? (
                <img
                  src={profile.profile.avatar}
                  alt={profile?.name || user?.name || 'Admin'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <span className="text-base font-bold text-white">
                    {getInitials(profile?.name || user?.name || user?.email)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.name || user?.name}</p>
              <p className="text-sm text-muted-foreground truncate">{profile?.email || user?.email}</p>
              <p className="text-xs text-destructive font-medium">Administrator</p>
            </div>
          </div>
        </div>

        <div className="py-2">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center w-full px-4 py-2 text-sm nav-hover"
          >
            <User className="h-4 w-4 mr-3" />
            Profile Settings
          </button>

          <button
            onClick={() => router.push('/admin/settings')}
            className="flex items-center w-full px-4 py-2 text-sm nav-hover"
          >
            <Settings className="h-4 w-4 mr-3" />
            Admin Settings
          </button>

          <div className="border-t border-border my-2"></div>

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    )}
    </>
  );
}