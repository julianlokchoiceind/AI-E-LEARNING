'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Shield, 
  HelpCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Course Management',
    href: '/admin/courses',
    icon: BookOpen,
  },
  {
    name: 'Payment Management',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Content Moderation',
    href: '/admin/moderation',
    icon: Shield,
  },
  {
    name: 'Support Tickets',
    href: '/admin/support',
    icon: HelpCircle,
  },
  {
    name: 'FAQ Management',
    href: '/admin/faq',
    icon: HelpCircle,
  },
  {
    name: 'System Logs',
    href: '/admin/logs',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="bg-white w-64 h-full shadow-lg border-r border-gray-200">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-red-600" />
          <span className="text-xl font-bold text-gray-900">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                    ? 'bg-red-100 text-red-900 border-r-2 border-red-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Admin Info */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Administrator</p>
            <p className="text-xs text-gray-500">Full system access</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-xs font-medium text-yellow-800">System Status</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-yellow-700">Active Users</span>
              <span className="font-medium text-yellow-900">1,247</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-yellow-700">Pending Reviews</span>
              <span className="font-medium text-yellow-900">23</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-yellow-700">Support Tickets</span>
              <span className="font-medium text-yellow-900">7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}