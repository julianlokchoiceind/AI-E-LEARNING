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
  HandHeart,
  FileText,
  FolderOpen,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useExpandable } from '@/hooks/useExpandable';
import { ExpandableItem } from '@/components/ui/ExpandableItem';

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
  // TODO: Implement Content Moderation when user base reaches 500+ active users
  // Currently not implemented - would show 404 if enabled
  // {
  //   name: 'Content Moderation',
  //   href: '/admin/moderation',
  //   icon: Shield,
  // },
  {
    name: 'Support Tickets',
    href: '/admin/support',
    icon: HandHeart,
  },
  {
    name: 'FAQ Management',
    href: '/admin/faq',
    icon: HelpCircle,
    subItems: [
      {
        name: 'All FAQs',
        href: '/admin/faq',
        icon: FileText,
      },
      {
        name: 'Categories',
        href: '/admin/faq/categories',
        icon: FolderOpen,
      },
    ],
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
  
  // Expandable hook for nested navigation (accordion behavior)
  const { expandedItems, toggleItem, isExpanded } = useExpandable({
    allowMultiple: false, // Only one menu can be open at a time
    defaultExpanded: []   // Start with all closed
  });

  // Helper to check if item or its subitems are active
  const isItemActive = (item: any) => {
    if (pathname === item.href) return true;
    if (item.href !== '/admin' && pathname.startsWith(item.href)) return true;
    if (item.subItems) {
      return item.subItems.some((subItem: any) => pathname === subItem.href);
    }
    return false;
  };

  const isSubItemActive = (subItem: any) => {
    return pathname === subItem.href;
  };

  return (
    <div className="bg-card w-64 h-full shadow-lg border-r border-border flex flex-col">
      {/* Header - Fixed */}
      <div className="h-16 flex-shrink-0 flex items-center justify-center border-b border-border">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">Admin Panel</span>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = isItemActive(item);
            
            if (!hasSubItems) {
              // Simple navigation item (no sub-items)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                    `}
                  />
                  {item.name}
                </Link>
              );
            }
            
            // Expandable navigation item (with sub-items)
            return (
              <ExpandableItem
                key={item.name}
                id={item.name}
                isExpanded={isExpanded(item.name)}
                onToggle={toggleItem}
                className="space-y-1"
                headerClassName={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full text-left
                  ${isActive
                    ? 'bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }
                `}
                contentClassName="ml-8 space-y-1 mt-1"
                animationDuration={200}
                header={
                  <>
                    <item.icon
                      className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                      `}
                    />
                    <span className="flex-1">{item.name}</span>
                  </>
                }
              >
                {item.subItems.map((subItem: any) => {
                  const isSubActive = isSubItemActive(subItem);
                  
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`
                        block px-3 py-2 text-sm rounded-md transition-colors
                        ${isSubActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <subItem.icon className="mr-2 h-4 w-4" />
                        {subItem.name}
                      </div>
                    </Link>
                  );
                })}
              </ExpandableItem>
            );
          })}
        </div>
      </nav>

      {/* Bottom Info - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-muted/50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-foreground">Administrator</p>
            <p className="text-xs text-muted-foreground">Full system access</p>
          </div>
        </div>
      </div>

    </div>
  );
}