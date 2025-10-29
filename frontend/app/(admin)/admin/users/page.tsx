'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, EmptyState, SkeletonBox, SkeletonCircle, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import { SearchBar } from '@/components/ui/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminUsersQuery,
  useToggleUserPremium,
  useUpdateUserRole,
  useDeleteUser,
  useBulkUserActions
} from '@/hooks/queries/useAdminUsers';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserPlus, 
  Crown, 
  Shield, 
  User,
  Mail,
  Calendar,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  UserX,
  UserCheck
} from 'lucide-react';
import { getRoleVariant } from '@/lib/utils/badge-helpers';

// Dumb Frontend: Simple color mapping using predefined global CSS classes
const getStatusColor = (status_display: string): string => {
  switch (status_display) {
    case 'Deactivated':
      return 'text-[hsl(var(--destructive))]'; // Deactivated = red (from globals.css)
    case 'Administrator':
      return 'text-[hsl(var(--badge-admin))]'; // Admin = red (from globals.css)
    case 'Content Creator':
      return 'text-[hsl(var(--badge-creator))]'; // Creator = purple (from globals.css)
    case 'Premium Access':
      return 'text-[hsl(var(--warning))]'; // Premium = amber (from globals.css)
    case 'Pro Subscriber':
      return 'text-[hsl(var(--success))]'; // Pro = green (from globals.css)
    case 'Free User':
    default:
      return 'text-muted-foreground'; // Free = muted (Tailwind class)
  }
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string; // User status: active or deactivated
  premium_status: boolean;
  subscription?: {
    type: string;
    status: string;
  };
  created_at: string;
  last_login?: string;
  stats?: {
    courses_enrolled: number;
    courses_completed: number;
    certificates_earned: number;
  };
  // Smart Backend provided fields
  status_display: string;
  activity_status: string; // Active or Deactivated display
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [premiumFilter, setPremiumFilter] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [processingDeactivateUserId, setProcessingDeactivateUserId] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<{id: string, name: string} | null>(null);

  // Auth hook for current user info
  const { user: currentUser } = useAuth();

  // Super admin permission logic
  const canDeleteUser = (targetUser: any) => {
    const SUPER_ADMIN = "julian.lok88@icloud.com";

    // Nobody can delete super admin
    if (targetUser.email === SUPER_ADMIN) return false;

    // Only super admin can delete other admins
    if (targetUser.role === "admin" && currentUser?.email !== SUPER_ADMIN) return false;

    return true;
  };

  // Super admin protection for deactivate (same logic as delete)
  const canDeactivateUser = (targetUser: any) => {
    const SUPER_ADMIN = "julian.lok88@icloud.com";

    // Nobody can deactivate super admin
    if (targetUser.email === SUPER_ADMIN) return false;

    return true;
  };

  // React Query hooks for data fetching and mutations  
  const { 
    data: usersData, 
    loading: isInitialLoading, 
    query: { isFetching, isRefetching },
    execute: refetchUsers 
  } = useAdminUsersQuery({
    search: searchTerm,
    role: roleFilter,
    premiumOnly: premiumFilter === 'premium' ? true : undefined,
    page: currentPage,
    per_page: itemsPerPage
  });
  
  const { mutate: togglePremiumMutation, loading: premiumLoading } = useToggleUserPremium();
  const { mutate: updateRoleMutation, loading: roleLoading } = useUpdateUserRole();
  const { mutate: deleteUserMutation, loading: deleteLoading } = useDeleteUser();
  const { mutate: bulkUserMutation, loading: bulkLoading } = useBulkUserActions();
  
  // Individual loading state tracking (following Support page pattern)
  // Global actionLoading removed to prevent all rows showing spinners
  
  // Smart loading states: Only show spinner on initial load, not background refetch
  const showLoadingSpinner = isInitialLoading && !usersData;
  
  // Extract users and pagination data from React Query response
  const users = usersData?.data?.users || [];
  const totalItems = usersData?.data?.total_count || 0;
  const totalPages = usersData?.data?.total_pages || 1;

  // Compute current selected user from fresh data (always up-to-date)
  const selectedUser = selectedUserId ? users.find((u: any) => u.id === selectedUserId) : null;

  // Handle filter changes - reset to page 1
  const handleFilterChange = (newValue: string, filterType: 'search' | 'role' | 'premium') => {
    setCurrentPage(1); // Reset to first page when filters change
    
    switch (filterType) {
      case 'search':
        setSearchTerm(newValue);
        break;
      case 'role':
        setRoleFilter(newValue);
        break;
      case 'premium':
        setPremiumFilter(newValue);
        break;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      setProcessingUserId(userId);
      await togglePremiumMutation({ userId, premiumStatus: !currentStatus }, {
        onSuccess: (response) => {
          // React Query will automatically invalidate and refetch users
        }
      });
    } catch (error: any) {
      // Error toast is handled automatically by useApiMutation
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setProcessingUserId(userId);
      await updateRoleMutation({ userId, role: newRole as 'student' | 'creator' | 'admin' }, {
        onSuccess: (response) => {
          // React Query will automatically invalidate and refetch users
        }
      });
    } catch (error: any) {
      // Error toast is handled automatically by useApiMutation
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setProcessingUserId(selectedUser.id);
      await deleteUserMutation(selectedUser.id, {
        onSuccess: (response) => {
          setShowDeleteModal(false);
          setSelectedUserId(null);
          // React Query will automatically invalidate and refetch users
        }
      });
    } catch (error: any) {
      // Error toast is handled automatically by useApiMutation
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeactivateUser = (user: {id: string, name: string}) => {
    setUserToDeactivate(user);
    setShowDeactivateModal(true);
  };

  const confirmDeactivation = () => {
    if (userToDeactivate) {
      setProcessingDeactivateUserId(userToDeactivate.id);
      bulkUserMutation({ action: 'deactivate', userIds: [userToDeactivate.id] }, {
        onSuccess: () => {
          setProcessingDeactivateUserId(null);
          setShowDeactivateModal(false);
          setUserToDeactivate(null);
          // React Query will automatically invalidate and refetch users
        },
        onError: () => {
          setProcessingDeactivateUserId(null);
          setShowDeactivateModal(false);
          setUserToDeactivate(null);
          // Error toast is handled automatically by useApiMutation
        }
      });
    }
  };

  const handleReactivateUser = (userId: string) => {
    setProcessingDeactivateUserId(userId);
    bulkUserMutation({ action: 'reactivate', userIds: [userId] }, {
      onSuccess: () => {
        setProcessingDeactivateUserId(null);
        // React Query will automatically invalidate and refetch users
      },
      onError: () => {
        setProcessingDeactivateUserId(null);
        // Error toast is handled automatically by useApiMutation
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u: any) => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    // Use bulk endpoint instead of looping - Following FAQ pattern
    bulkUserMutation({ action: 'delete', userIds: Array.from(selectedUsers) }, {
      onSuccess: (response) => {
        setSelectedUsers(new Set());
        setShowBulkDeleteModal(false);
        // React Query will automatically invalidate and refetch users
      }
    });
  };


  // No client-side filtering needed - server handles it

  return (
    <Container variant="admin">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage platform users, roles, and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <SearchBar
            value={searchTerm}
            onChange={(value) => handleFilterChange(value, 'search')}
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            placeholder="Search users..."
            size="sm"
            className="w-full"
          />

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => handleFilterChange(e.target.value, 'role')}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="creator">Content Creators</option>
            <option value="admin">Administrators</option>
          </select>

          {/* Premium Filter */}
          <select
            value={premiumFilter}
            onChange={(e) => handleFilterChange(e.target.value, 'premium')}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Users</option>
            <option value="premium">Premium Users</option>
            <option value="regular">Regular Users</option>
          </select>

          {/* Clear Filters Button */}
          <Button 
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('');
              setPremiumFilter('');
              setCurrentPage(1);
              setSelectedUsers(new Set());
            }} 
            variant="outline"
            className="w-full">
            Clear Filters
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <span className="text-primary">
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUsers(new Set())}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-destructive hover:bg-destructive/10"
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Users ({totalItems})
            </h2>
          </div>
        </div>

        {showLoadingSpinner ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3"><SkeletonCircle className="h-4 w-4" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <SkeletonCircle className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SkeletonCircle className="h-10 w-10 mr-4" />
                        <div>
                          <SkeletonBox className="h-4 w-32 mb-1" />
                          <SkeletonBox className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <SkeletonBox className="h-6 w-16 rounded-full" />
                        <SkeletonCircle className="h-4 w-4" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <SkeletonBox className="h-4 w-20 mb-1" />
                        <SkeletonBox className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <SkeletonBox className="h-4 w-16 mb-1" />
                        <SkeletonBox className="h-3 w-20" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center space-x-2">
                        <SkeletonBox className="h-8 w-8" />
                        <SkeletonBox className="h-8 w-8" />
                        <SkeletonBox className="h-8 w-8" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <EmptyState
              title="No users found"
              description="No users match your current search and filter criteria"
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setPremiumFilter('');
                  setSelectedUsers(new Set());
                  // React Query will automatically refetch when filters change
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded"
                        disabled={user.role === 'admin'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            {user.is_deleted ? (
                              <>
                                <span className="text-sm font-medium line-through text-muted-foreground">
                                  {user.original_name || user.name}
                                </span>
                                <Badge variant="destructive" className="text-xs">
                                  Deleted
                                </Badge>
                              </>
                            ) : (
                              <span className="text-sm font-medium text-foreground">
                                {user.name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.is_deleted ? user.original_email : user.email}
                          </div>
                          {user.is_deleted && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <div>
                                Deleted by {user.deleted_by_name || 'Unknown'} on{' '}
                                {user.deleted_at ? new Date(user.deleted_at).toLocaleDateString() : 'N/A'}
                              </div>
                              {user.deletion_reason && (
                                <div className="text-xs">
                                  Reason: {user.deletion_reason === 'admin_action' ? 'Admin Action' : 'User Request'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getRoleVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        {user.premium_status && (
                          <Crown className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-medium ${
                          user.role === 'admin' ? 'text-destructive' :
                          user.premium_status ? 'text-warning' :
                          'text-muted-foreground'
                        }`}>
                          {user.status_display}
                        </div>
                        <div className={`text-xs ${user.activity_status === 'Deactivated' ? 'text-destructive' : 'text-success'}`}>
                          {user.activity_status}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <div>
                        <div>{user.stats?.courses_enrolled || 0} enrolled</div>
                        <div className="text-xs text-muted-foreground">
                          {user.stats?.courses_completed || 0} completed
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {user.last_login ? 
                        new Date(user.last_login).toLocaleDateString('en-GB') : 
                        'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setShowUserModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePremium(user.id, user.premium_status)}
                          loading={processingUserId === user.id}
                          disabled={user.role === 'admin'}
                        >
                          <Crown className={`h-4 w-4 ${user.premium_status ? 'text-warning' : 'text-muted-foreground'}`} />
                        </Button>

                        {/* Deactivate/Reactivate Button */}
                        {canDeactivateUser(user) && (
                          user.status === 'deactivated' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReactivateUser(user.id)}
                              loading={processingDeactivateUserId === user.id}
                              className="text-success hover:bg-success/10"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeactivateUser({id: user.id, name: user.name})}
                              loading={processingDeactivateUserId === user.id}
                              className="text-warning hover:bg-warning/10"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )
                        )}

                        {canDeleteUser(user) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border bg-muted px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              loading={isInitialLoading}
              showInfo={true}
              className="flex justify-center"
            />
          </div>
        )}
      </Card>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUserId(null);
          }}
          title="User Details"
        >
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">{selectedUser.name}</h3>
                <p className="text-muted-foreground">{selectedUser.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getRoleVariant(selectedUser.role)}>
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Badge>
                  {selectedUser.premium_status && (
                    <Badge variant="warning">Premium</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {selectedUser.stats?.courses_enrolled || 0}
                </div>
                <div className="text-sm text-muted-foreground">Courses Enrolled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {selectedUser.stats?.courses_completed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {selectedUser.stats?.certificates_earned || 0}
                </div>
                <div className="text-sm text-muted-foreground">Certificates</div>
              </div>
            </div>

            {/* Role Management */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Change Role
              </label>
              <select
                value={selectedUser.role}
                onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                disabled={selectedUser.role === 'admin'}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="student">Student</option>
                <option value="creator">Content Creator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                onClick={() => handleTogglePremium(selectedUser.id, selectedUser.premium_status)}
                loading={processingUserId === selectedUser.id}
                variant={selectedUser.premium_status ? "outline" : "primary"}
                disabled={selectedUser.role === 'admin'}
              >
                {/* Text button - remove Crown icon as it has both icon + text */}
                {selectedUser.premium_status ? 'Remove Premium' : 'Grant Premium'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUserId(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete User"
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{selectedUser.name}</strong>? 
              This action cannot be undone and will remove all user data including courses, progress, and payments.
            </p>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleDeleteUser}
                loading={processingUserId === selectedUser?.id}
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Delete User
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <Modal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          title="Delete Multiple Users"
          size="md"
        >
          <div className="space-y-6">
            {/* Warning Icon & Message */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm Bulk Deletion
                </h3>
                <p className="text-muted-foreground">
                  You are about to permanently delete {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}. 
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Warning Details */}
            <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h4 className="font-medium text-warning">Warning</h4>
              </div>
              <p className="text-sm text-warning">
                All user data including courses, progress, certificates, and payments will be permanently deleted.
                This action cannot be reversed.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmBulkDelete}
                loading={bulkLoading}
                className="flex-1"
              >
                Delete {selectedUsers.size} User{selectedUsers.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>

    {/* Deactivation Confirmation Modal */}
    {showDeactivateModal && userToDeactivate && (
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setUserToDeactivate(null);
        }}
        title="Confirm Deactivation"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to deactivate <strong>{userToDeactivate.name}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            The user will be logged out and unable to access the platform until reactivated.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeactivateModal(false);
                setUserToDeactivate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeactivation}
              loading={processingDeactivateUserId === userToDeactivate.id}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    )}

    </Container>
  );
}