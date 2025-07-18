'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastService } from '@/lib/toast/ToastService';
import { getCacheConfig } from '@/lib/constants/cache-config';
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
    getCacheConfig('ADMIN_OPERATIONS') // Realtime - admin user management
  );
}

/**
 * UPDATE USER ROLE - Change user permissions with optimistic updates
 * Critical: Admin role management with instant feedback
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
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
      optimistic: {
        // Optimistic update: Update UI immediately before API call
        onMutate: async ({ userId, role }: UserRoleUpdate) => {
          // Cancel any outgoing refetches
          await queryClient.cancelQueries({ 
            predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-users'
          });
          
          // Snapshot previous value
          const previousUsers = queryClient.getQueryData(['admin-users']);
          
          // Optimistically update user role
          queryClient.setQueryData(['admin-users'], (old: any) => {
            if (!old) return old;
            
            // Handle different data structures
            const users = old?.data?.users || old?.users || [];
            const updatedUsers = users.map((user: any) => {
              const id = user.id;
              if (id === userId) {
                return {
                  ...user,
                  role: role
                };
              }
              return user;
            });
            
            // Maintain same structure
            if (old?.data?.users) {
              return {
                ...old,
                data: {
                  ...old.data,
                  users: updatedUsers
                }
              };
            }
            
            return {
              ...old,
              users: updatedUsers
            };
          });
          
          return { previousUsers, userId, role };
        },
        
        // Rollback on error
        onError: (error, variables, context) => {
          if (context?.previousUsers) {
            queryClient.setQueryData(['admin-users'], context.previousUsers);
          }
        },
        
        // Always refetch to ensure consistency
        onSettled: () => {
          queryClient.invalidateQueries({ 
            queryKey: ['admin-users'],
            refetchType: 'active'
          });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['user-analytics'] });
        }
      }
    }
  );
}

/**
 * TOGGLE USER PREMIUM - Manage premium access with optimistic update
 * Critical: Premium user management
 */
export function useToggleUserPremium() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: ({ userId, premiumStatus }: UserPremiumToggle) => 
      toggleUserPremium(userId, premiumStatus),
    
    // Optimistic update - Update UI immediately
    onMutate: async ({ userId, premiumStatus }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-users'
      });
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(['admin-users']);
      
      // Optimistically update user premium status
      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        
        // Handle different data structures
        const users = old?.data?.users || old?.users || [];
        const updatedUsers = users.map((user: any) => {
          const id = user.id;
          if (id === userId) {
            return {
              ...user,
              premium_status: premiumStatus
            };
          }
          return user;
        });
        
        // Maintain same structure
        if (old?.data?.users) {
          return {
            ...old,
            data: {
              ...old.data,
              users: updatedUsers
            }
          };
        }
        
        return {
          ...old,
          users: updatedUsers
        };
      });
      
      return { previousUsers, userId, premiumStatus };
    },
    
    // Rollback on error
    onError: (error: any, variables, context: any) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['admin-users'], context.previousUsers);
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-users'],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-analytics'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (data: UserPremiumToggle, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      mutation.mutate(data, {
        onSuccess: (response) => {
          // Toast handled by useApiMutation pattern - using explicit ID for optimistic updates
          const status = data.premiumStatus ? 'premium' : 'regular';
          ToastService.success(response?.message || 'Something went wrong', 'toggle-user-premium');
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (error: any) => {
          // Toast handled by useApiMutation pattern - using explicit ID for optimistic updates
          ToastService.error(error?.message || 'Something went wrong', 'toggle-user-premium-error');
          if (options?.onError) {
            options.onError(error);
          }
        }
      });
    },
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * DELETE USER - Remove user account with optimistic update
 * Critical: User account management
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  // Using native React Query for optimistic updates
  const mutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    
    // Optimistic update - Update UI immediately
    onMutate: async (userId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'admin-users'
      });
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(['admin-users']);
      
      // Optimistically remove user from list
      queryClient.setQueryData(['admin-users'], (old: any) => {
        if (!old) return old;
        
        // Handle different data structures
        const users = old?.data?.users || old?.users || [];
        const filteredUsers = users.filter((user: any) => {
          const id = user.id;
          return id !== userId;
        });
        
        // Maintain same structure
        if (old?.data?.users) {
          return {
            ...old,
            data: {
              ...old.data,
              users: filteredUsers,
              total: filteredUsers.length
            }
          };
        }
        
        return {
          ...old,
          users: filteredUsers,
          total: filteredUsers.length
        };
      });
      
      return { previousUsers, userId };
    },
    
    // Rollback on error
    onError: (error: any, userId: string, context: any) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['admin-users'], context.previousUsers);
      }
    },
    
    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-users'],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-analytics'] });
    }
  });
  
  // Return wrapper to maintain useApiMutation interface
  return {
    mutate: (userId: string, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      mutation.mutate(userId, {
        onSuccess: (response) => {
          // Toast handled by useApiMutation pattern - using explicit ID for optimistic updates
          ToastService.success(response?.message || 'Something went wrong', 'delete-user');
          if (options?.onSuccess) {
            options.onSuccess();
          }
        },
        onError: (error: any) => {
          // Toast handled by useApiMutation pattern - using explicit ID for optimistic updates
          ToastService.error(error?.message || 'Something went wrong', 'delete-user-error');
          if (options?.onError) {
            options.onError(error);
          }
        }
      });
    },
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
  };
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