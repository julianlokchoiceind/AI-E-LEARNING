'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { 
  getAdminUsers, 
  toggleUserPremium, 
  updateUserRole, 
  deleteUser 
} from '@/lib/api/admin';
import { useApiCall } from '@/hooks/useErrorHandler';
import { toast } from 'react-hot-toast';
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
  RefreshCw
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
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [premiumFilter, setPremiumFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Use useApiCall hook for consistent loading state management
  const { data: usersData, loading, execute: fetchUsersExecute } = useApiCall();
  const { loading: actionLoading, execute: executeAction } = useApiCall();

  const fetchUsers = useCallback(async () => {
    const response = await fetchUsersExecute(
      () => getAdminUsers({
        search: searchTerm,
        role: roleFilter,
        premiumOnly: premiumFilter === 'premium' ? true : undefined
      }),
      {
        onSuccess: (response: any) => {
          // StandardResponse format has data field containing the actual data
          setUsers(response.data?.users || []);
        }
      }
    );
  }, [searchTerm, roleFilter, premiumFilter, fetchUsersExecute]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers();
  };

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    await executeAction(
      () => toggleUserPremium(userId, !currentStatus),
      {
        onSuccess: (response: any) => {
          toast.success(response.message || 'Something went wrong');
          fetchUsers(); // Refresh list
        }
      }
    );
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await executeAction(
      () => updateUserRole(userId, newRole),
      {
        onSuccess: (response: any) => {
          toast.success(response.message || 'Something went wrong');
          fetchUsers(); // Refresh list
        }
      }
    );
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    await executeAction(
      () => deleteUser(selectedUser.id),
      {
        onSuccess: (response: any) => {
          toast.success(response.message || 'Something went wrong');
          setShowDeleteModal(false);
          setSelectedUser(null);
          fetchUsers(); // Refresh list
        }
      }
    );
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesPremium = premiumFilter === '' || 
      (premiumFilter === 'premium' && user.premium_status) ||
      (premiumFilter === 'regular' && !user.premium_status);
    
    return matchesSearch && matchesRole && matchesPremium;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage platform users, roles, and permissions</p>
        </div>
        <Button onClick={fetchUsers}>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
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
            onChange={(e) => setPremiumFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Users</option>
            <option value="premium">Premium Users</option>
            <option value="regular">Regular Users</option>
          </select>

          {/* Search Button */}
          <Button onClick={handleSearch} className="w-full">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Users ({filteredUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" message="Loading users..." />
          </div>
        ) : filteredUsers.length === 0 ? (
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
                  fetchUsers();
                }
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
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
                        new Date(user.last_login).toLocaleDateString() : 
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
    </div>
  );
}