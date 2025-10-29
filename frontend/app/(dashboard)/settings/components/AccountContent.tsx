'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { useApiMutation } from '@/hooks/useApiMutation';
import { changePassword } from '@/lib/api/auth';
import { usersApi } from '@/lib/api/users';
import { Lock, AlertCircle, Trash2 } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordErrors {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface DeleteAccountFormData {
  password: string;
}

export function AccountContent() {
  const { user } = useAuth();
  const router = useRouter();

  // Change Password State
  const [passwordData, setPasswordData] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<ChangePasswordErrors>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const passwordMessage = useInlineMessage('password-form');

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [oauthConfirmed, setOauthConfirmed] = useState(false);

  // Detect if user is OAuth user (no password field)
  const isOAuthUser = user?.hasPassword === false;

  // Change Password Mutation
  const { mutate: changePasswordMutation, loading: changingPassword } = useApiMutation(
    (data: { current_password: string; new_password: string; confirm_password: string }) => changePassword(data),
    {
      operationName: 'change-password',
      showToast: false,
    }
  );

  // Delete Account Mutation
  const { mutate: deleteAccountMutation, loading: deletingAccount } = useApiMutation(
    (password: string) => usersApi.deleteAccount(password),
    {
      operationName: 'delete-account',
      showToast: false,
    }
  );

  // Password Validation
  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!password[0] || password[0] !== password[0].toUpperCase() || !isNaN(Number(password[0]))) {
      return 'Password must start with an uppercase letter';
    }
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!specialChars.split('').some(char => password.includes(char))) {
      return 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)';
    }
    return '';
  };

  // Handle Password Input Change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    setPasswordErrors(prev => ({ ...prev, [name]: '' }));

    // Clear inline message when user starts typing
    if (passwordMessage.message) {
      passwordMessage.clear();
    }
  };

  // Handle Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors and messages
    setPasswordErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    passwordMessage.clear();

    // Validate current password
    if (!passwordData.currentPassword) {
      setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is required' }));
      passwordMessage.showError('Please fill in all required fields');
      return;
    }

    // Validate new password
    const newPasswordError = validatePassword(passwordData.newPassword);
    if (newPasswordError) {
      setPasswordErrors(prev => ({ ...prev, newPassword: newPasswordError }));
      passwordMessage.showError('Please fix the validation errors');
      return;
    }

    // Validate confirm password
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      passwordMessage.showError('Please fix the validation errors');
      return;
    }

    // Submit
    changePasswordMutation(
      {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword,
      },
      {
        onSuccess: (response) => {
          if (!response.success) {
            throw new Error(response.message || 'Something went wrong');
          }
          passwordMessage.showSuccess(response.message || 'Password changed successfully!');

          // Clear form
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
        onError: (error: any) => {
          console.error('Password change failed:', error);

          // Handle specific error cases
          if (error.message?.includes('OAuth')) {
            passwordMessage.showError('You signed in with Google/GitHub. No password to change.');
          } else if (error.message?.includes('incorrect')) {
            setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }));
            passwordMessage.showError('Current password is incorrect');
          } else {
            passwordMessage.showError(error.message || 'Something went wrong');
          }
        }
      }
    );
  };

  // Handle Delete Account
  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeleteError('');
    setOauthConfirmed(false);
  };

  const handleConfirmDelete = async () => {
    setDeleteError('');

    // OAuth users: Check confirmation checkbox
    if (isOAuthUser) {
      if (!oauthConfirmed) {
        setDeleteError('Please confirm you understand this action cannot be undone');
        return;
      }
    } else {
      // Regular users: Check password
      if (!deletePassword) {
        setDeleteError('Password is required to delete your account');
        return;
      }
    }

    // Pass empty string for OAuth users, password for regular users
    deleteAccountMutation(isOAuthUser ? '' : deletePassword, {
      onSuccess: (response) => {
        if (!response.success) {
          throw new Error(response.message || 'Something went wrong');
        }

        // Account deleted successfully - sign out user
        setShowDeleteModal(false);

        // Sign out and redirect to home page
        signOut({ callbackUrl: '/' });
      },
      onError: (error: any) => {
        console.error('Delete account failed:', error);

        // Handle specific error cases
        if (error.message?.includes('incorrect') || error.message?.includes('Password is incorrect')) {
          setDeleteError('Password is incorrect');
        } else {
          setDeleteError(error.message || 'Something went wrong');
        }
      }
    });
  };

  // Get password strength indicator
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[!@#$%^&*()_+-=[\]{}|;:,.<>?]/.test(password)) strength += 20;

    if (strength < 30) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength < 60) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength < 80) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and account security settings
        </p>
      </div>

      {/* Change Password Section */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground mb-1">Password & Security</h2>
            <p className="text-sm text-muted-foreground">
              Change your password to keep your account secure
            </p>
          </div>
        </div>

        {passwordMessage.message && (
          <div className="mb-6">
            <InlineMessage
              message={passwordMessage.message.message}
              type={passwordMessage.message.type}
              onDismiss={passwordMessage.clear}
            />
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-1">
              Current Password
            </label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className={passwordErrors.currentPassword ? 'border-red-500 bg-red-50' : ''}
              placeholder="Enter your current password"
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1">
              New Password
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className={passwordErrors.newPassword ? 'border-red-500 bg-red-50' : ''}
              placeholder="Enter your new password"
            />
            {passwordData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground min-w-[50px]">
                    {passwordStrength.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Must be 8+ characters, start with uppercase, and contain a special character
                </p>
              </div>
            )}
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className={passwordErrors.confirmPassword ? 'border-red-500 bg-red-50' : ''}
              placeholder="Confirm your new password"
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" loading={changingPassword} disabled={changingPassword}>
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone - Delete Account */}
      <Card className="p-6 border-destructive/30 bg-destructive/5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-destructive mb-1">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="md"
      >
        <div className="space-y-6">
          {/* Warning Header */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Are you absolutely sure?
              </h3>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
            <h4 className="font-medium text-warning mb-2">⚠️ This will delete:</h4>
            <ul className="text-sm text-warning space-y-1 ml-4 list-disc">
              <li>All your learning progress and quiz results</li>
              <li>All courses you've enrolled in</li>
              <li>Your profile information and avatar</li>
              <li>All certificates earned</li>
            </ul>
          </div>

          {/* Password Confirmation (Regular Users) or Extra Confirmation (OAuth Users) */}
          {!isOAuthUser ? (
            <div>
              <label htmlFor="deletePassword" className="block text-sm font-medium text-foreground mb-2">
                Enter your password to confirm
              </label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className={deleteError ? 'border-red-500' : ''}
              />
              {deleteError && (
                <p className="mt-2 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
          ) : (
            <div>
              <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
                <p className="text-sm text-warning font-medium mb-3">
                  ⚠️ You signed in with Google/GitHub. Deleting your account will permanently remove all your data.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oauthConfirmed}
                    onChange={(e) => setOauthConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm text-foreground">
                    I understand this action cannot be undone and all my data will be permanently deleted
                  </span>
                </label>
              </div>
              {deleteError && (
                <p className="mt-2 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              className="flex-1"
              loading={deletingAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? 'Deleting Account...' : 'Delete My Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
