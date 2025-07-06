'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { 
  getAdminUsers,
  updateUserRole,
  toggleUserPremium,
  deleteUser,
  getAdminDashboardStats,
  getUserAnalytics
} from '@/lib/api/admin';

// Types for admin user queries
interface AdminUsersFilters {
  search?: string;
  role?: string;
  premiumOnly?: boolean;
  page?: number;
  per_page?: number;
}

interface UserRoleUpdate {
  userId: string;
  role: 'student' | 'creator' | 'admin';
}

interface UserPremiumToggle {
  userId: string;
  premiumStatus: boolean;
}

/**
 * ADMIN USERS LIST - User management interface
 * Critical: Admin user management operations
 */
export function useAdminUsersQuery(filters: AdminUsersFilters = {}) {
  const { search = '', role = '', premiumOnly, page = 1, per_page = 20 } = filters;
  
  return useApiQuery(
    ['admin-users', { search, role, premiumOnly, page, per_page }],
    () => getAdminUsers({ search, role, premiumOnly, page, per_page }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - user data changes frequently
      gcTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );
}

/**
 * UPDATE USER ROLE - Change user permissions
 * Critical: Admin role management
 */
export function useUpdateUserRole() {
  return useApiMutation(
    ({ userId, role }: UserRoleUpdate) => updateUserRole(userId, role),
    {
      invalidateQueries: [
        ['admin-users'], // Refresh user list
        ['admin-dashboard'], // Update dashboard stats
        ['user-analytics'], // Update analytics
      ],
    }
  );
}

/**
 * TOGGLE USER PREMIUM - Manage premium access
 * Critical: Premium user management
 */
export function useToggleUserPremium() {
  return useApiMutation(
    ({ userId, premiumStatus }: UserPremiumToggle) => toggleUserPremium(userId, premiumStatus),
    {
      invalidateQueries: [
        ['admin-users'], // Refresh user list
        ['admin-dashboard'], // Update dashboard stats
        ['user-analytics'], // Update analytics
      ],
    }
  );
}

/**
 * DELETE USER - Remove user account
 * Critical: User account management
 */
export function useDeleteUser() {
  return useApiMutation(
    (userId: string) => deleteUser(userId),
    {
      invalidateQueries: [
        ['admin-users'], // Refresh user list
        ['admin-dashboard'], // Update dashboard stats
        ['user-analytics'], // Update analytics
      ],
    }
  );
}

/**
 * ADMIN DASHBOARD STATS - Overview metrics
 * High-impact: Admin decision making
 */
export function useAdminDashboardQuery() {
  return useApiQuery(
    ['admin-dashboard'],
    () => getAdminDashboardStats(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - dashboard data
      gcTime: 15 * 60 * 1000, // 15 minutes cache
    }
  );
}

/**
 * USER ANALYTICS - User growth and engagement
 * Medium-impact: Admin insights
 */
export function useUserAnalyticsQuery() {
  return useApiQuery(
    ['user-analytics'],
    () => getUserAnalytics(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - analytics data
      gcTime: 30 * 60 * 1000, // 30 minutes cache
    }
  );
}

/**
 * USER SEARCH - Real-time user search
 * High-impact: Quick user lookup
 */
export function useUserSearchQuery(query: string, filters: Omit<AdminUsersFilters, 'search'> = {}) {
  return useApiQuery(
    ['user-search', query, filters],
    () => getAdminUsers({ search: query, ...filters }),
    {
      enabled: query.length > 2, // Only search after 3 characters
      staleTime: 1 * 60 * 1000, // 1 minute - search results
      gcTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );
}

/**
 * USERS BY ROLE - Filter users by role
 * Medium-impact: Role-based user management
 */
export function useUsersByRoleQuery(role: string) {
  return useApiQuery(
    ['users-by-role', role],
    () => getAdminUsers({ role, per_page: 100 }), // Larger page for role filtering
    {
      enabled: !!role,
      staleTime: 5 * 60 * 1000, // 5 minutes - role-based data
      gcTime: 20 * 60 * 1000, // 20 minutes cache
    }
  );
}

/**
 * PREMIUM USERS - List all premium users
 * Medium-impact: Premium user management
 */
export function usePremiumUsersQuery() {
  return useApiQuery(
    ['premium-users'],
    () => getAdminUsers({ premiumOnly: true, per_page: 100 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - premium user data
      gcTime: 20 * 60 * 1000, // 20 minutes cache
    }
  );
}