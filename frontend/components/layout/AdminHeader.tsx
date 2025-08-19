'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { useSupportNotifications } from '@/hooks/useSupportNotifications';
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

export function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Get support ticket notifications for admin
  const { unreadCount, tickets } = useSupportNotifications();
  
  // Get recent unread tickets for notification dropdown  
  const recentTickets = (tickets || []).slice(0, 5); // Show last 5 unread tickets
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToDashboard}
          className="text-gray-600"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users, courses, payments..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 w-80"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* System Status */}
        <div className="hidden md:flex items-center space-x-2 text-sm">
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>System Healthy</span>
          </div>
        </div>

        {/* Support Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                size="sm" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs min-w-[16px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Support Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" size="sm">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {recentTickets.length > 0 ? (
                  <div className="py-2">
                    {recentTickets.map((ticket: any) => (
                      <button
                        key={ticket.id}
                        onClick={() => {
                          router.push(`/admin/support`);
                          setShowNotifications(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {ticket.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              From: {ticket.user_name} • {ticket.category}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" size="sm">
                            {ticket.priority}
                          </Badge>
                        </div>
                      </button>
                    ))}
                    
                    <div className="px-4 py-3 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          router.push('/admin/support');
                          setShowNotifications(false);
                        }}
                        className="w-full"
                      >
                        View All Support Tickets
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No new support tickets</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="hidden md:block font-medium">{user?.name}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-red-600 font-medium">Administrator</p>
              </div>
              
              <div className="py-2">
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-3" />
                  Profile Settings
                </button>
                
                <button
                  onClick={() => router.push('/admin/settings')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Admin Settings
                </button>
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}