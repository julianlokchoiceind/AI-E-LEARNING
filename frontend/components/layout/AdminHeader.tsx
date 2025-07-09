'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Search, 
  Menu, 
  LogOut, 
  Settings, 
  User,
  ChevronDown,
  Home,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      type: 'warning',
      message: 'New course pending approval',
      time: '5 minutes ago'
    },
    {
      id: 2,
      type: 'success',
      message: 'Payment webhook processed successfully',
      time: '10 minutes ago'
    },
    {
      id: 3,
      type: 'info',
      message: 'New user registration: john@example.com',
      time: '15 minutes ago'
    }
  ]);

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

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
        </div>

        {/* User Menu */}
        <div className="relative">
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