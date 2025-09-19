'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { getCacheConfig } from '@/lib/constants/cache-config';
import {
  getAdminUsers,
  updateUserRole,
  toggleUserPremium,
  deleteUser,
  bulkUserAction,
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
      ...getCacheConfig('ADMIN_OPERATIONS'), // Realtime - admin user management
      keepPreviousData: true, // Smooth filter transitions
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
      operationName: 'update-user-role',
      invalidateQueries: [
        ['admin-users'],      // Refresh user list
        ['admin-dashboard'],  // Update dashboard stats
        ['user-analytics'],   // Update analytics data
        ['users-by-role'],    // Update role-based lists
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
    ({ userId, premiumStatus }: UserPremiumToggle) => 
      toggleUserPremium(userId, premiumStatus),
    {
      operationName: 'toggle-user-premium',
      invalidateQueries: [
        ['admin-users'],      // Refresh user list
        ['admin-dashboard'],  // Update dashboard stats
        ['user-analytics'],   // Update analytics data
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
      operationName: 'delete-user',
      invalidateQueries: [
        ['admin-users'],          // Refresh user list
        ['admin-dashboard'],      // Update dashboard stats
        ['user-analytics'],       // Update analytics data
        ['users-by-role'],        // Update role-based lists
        ['premium-users'],        // Update premium user lists
        ['user-search'],          // Update search results
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
    getCacheConfig('ADMIN_OPERATIONS') // Realtime - admin dashboard data
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
    getCacheConfig('USER_DASHBOARD') // 2min moderate - analytics data
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
      ...getCacheConfig('ADMIN_OPERATIONS') // Realtime - admin search results
    }
  );
}

/**
 * USER BULK ACTIONS - Bulk operations on users (Following FAQ pattern)
 * Medium-impact: Admin efficiency
 */
export function useBulkUserActions() {
  return useApiMutation(
    async ({ action, userIds, data }: { action: 'delete' | 'update_role' | 'toggle_premium' | 'deactivate' | 'reactivate'; userIds: string[]; data?: any }) => {
      // Filter out any undefined/null IDs to prevent errors
      const validUserIds = userIds.filter(id => id && typeof id === 'string' && id.trim() !== '');

      if (validUserIds.length === 0) {
        throw new Error('No valid user IDs provided for bulk action');
      }

      return await bulkUserAction({
        user_ids: validUserIds,
        action,
        data
      });
    },
    {
      operationName: 'bulk-user-action',
      invalidateQueries: [
        ['admin-users'], // Refresh ALL admin-users queries regardless of filters
      ],
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
      ...getCacheConfig('ADMIN_OPERATIONS') // Realtime - admin role-based data
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
    getCacheConfig('ADMIN_OPERATIONS') // Realtime - admin premium user data
  );
}