'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, EmptyState, UserListSkeleton } from '@/components/ui/LoadingStates';
import { 
  useAdminUsersQuery,
  useToggleUserPremium,
  useUpdateUserRole,
  useDeleteUser
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
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [premiumFilter, setPremiumFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // React Query hooks for data fetching and mutations
  const { data: usersData, loading, execute: refetchUsers } = useAdminUsersQuery({
    search: searchTerm,
    role: roleFilter,
    premiumOnly: premiumFilter === 'premium' ? true : undefined,
    page: currentPage,
    per_page: itemsPerPage
  });
  
  const { mutate: togglePremiumMutation, loading: premiumLoading } = useToggleUserPremium();
  const { mutate: updateRoleMutation, loading: roleLoading } = useUpdateUserRole();
  const { mutate: deleteUserMutation, loading: deleteLoading } = useDeleteUser();
  
  // Combined loading state for actions
  const actionLoading = premiumLoading || roleLoading || deleteLoading;
  
  // Extract users and pagination data from React Query response
  const users = usersData?.data?.users || [];
  const totalItems = usersData?.data?.total_count || usersData?.data?.total || 0;
  const totalPages = usersData?.data?.total_pages || 1;

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
    togglePremiumMutation({ userId, premiumStatus: !currentStatus }, {
      onSuccess: (response) => {
        // React Query will automatically invalidate and refetch users
      }
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    updateRoleMutation({ userId, role: newRole as 'student' | 'creator' | 'admin' }, {
      onSuccess: (response) => {
        // React Query will automatically invalidate and refetch users
      }
    });
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    deleteUserMutation(selectedUser.id, {
      onSuccess: (response) => {
        setShowDeleteModal(false);
        setSelectedUser(null);
        // React Query will automatically invalidate and refetch users
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
    // Store the users to delete
    const usersToDelete = Array.from(selectedUsers);
    
    // Delete all selected users sequentially to avoid overwhelming the server
    for (const userId of usersToDelete) {
      await new Promise<void>((resolve) => {
        deleteUserMutation(userId, {
          onSuccess: () => {
            // Remove from selected set immediately after successful deletion
            setSelectedUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });
            resolve();
          },
          onError: () => {
            console.error(`Failed to delete user ${userId}`);
            resolve(); // Continue even if one fails
          }
        });
      });
    }
    
    // Close modal after all operations complete
    setShowBulkDeleteModal(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'creator':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // No client-side filtering needed - server handles it

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage platform users, roles, and permissions</p>
        </div>
        <Button onClick={refetchUsers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(e.target.value, 'search')}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => handleFilterChange(e.target.value, 'role')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <span className="text-blue-700">
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
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Users ({totalItems})
          </h2>
        </div>

        {loading ? (
          <UserListSkeleton rows={6} />
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
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
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        {user.premium_status && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-medium ${user.subscription ? 'text-green-600' : 'text-gray-600'}`}>
                          {user.subscription ? 'Subscribed' : 'Free User'}
                        </div>
                        {user.subscription && (
                          <div className="text-xs text-gray-500">
                            {user.subscription.type} - {user.subscription.status}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{user.stats?.courses_enrolled || 0} enrolled</div>
                        <div className="text-xs text-gray-500">
                          {user.stats?.courses_completed || 0} completed
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePremium(user.id, user.premium_status)}
                          loading={actionLoading}
                          disabled={user.role === 'admin'}
                        >
                          <Crown className={`h-4 w-4 ${user.premium_status ? 'text-yellow-500' : 'text-gray-400'}`} />
                        </Button>
                        
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:bg-red-50"
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
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              loading={loading}
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
          onClose={() => setShowUserModal(false)}
          title="User Details"
        >
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedUser.name}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getRoleBadgeColor(selectedUser.role)}>
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Badge>
                  {selectedUser.premium_status && (
                    <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedUser.stats?.courses_enrolled || 0}
                </div>
                <div className="text-sm text-gray-500">Courses Enrolled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedUser.stats?.courses_completed || 0}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedUser.stats?.certificates_earned || 0}
                </div>
                <div className="text-sm text-gray-500">Certificates</div>
              </div>
            </div>

            {/* Role Management */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Role
              </label>
              <select
                value={selectedUser.role}
                onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                disabled={selectedUser.role === 'admin'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                loading={actionLoading}
                variant={selectedUser.premium_status ? "outline" : "primary"}
                disabled={selectedUser.role === 'admin'}
              >
                <Crown className="h-4 w-4 mr-2" />
                {selectedUser.premium_status ? 'Remove Premium' : 'Grant Premium'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowUserModal(false)}
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
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{selectedUser.name}</strong>? 
              This action cannot be undone and will remove all user data including courses, progress, and payments.
            </p>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleDeleteUser}
                loading={actionLoading}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
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
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Bulk Deletion
                </h3>
                <p className="text-gray-600">
                  You are about to permanently delete {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}. 
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Warning Details */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Warning</h4>
              </div>
              <p className="text-sm text-yellow-700">
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
                loading={deleteLoading}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedUsers.size} User{selectedUsers.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}