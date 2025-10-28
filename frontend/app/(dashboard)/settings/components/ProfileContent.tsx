'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { SkeletonBox, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import { useUserProfileManagement } from '@/hooks/queries/useUserProfile';
import { useI18n } from '@/lib/i18n/context';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { AvatarUpload } from '@/components/feature/AvatarUpload';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  facebook: string;
  linkedin: string;
}

export default function ProfileContent() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();

  // React Query hooks for profile management
  const {
    profile,
    loading,
    updateProfile,
    updating,
    uploadAvatar,
    uploadingAvatar,
    deleteAvatar,
    deletingAvatar
  } = useUserProfileManagement(!!user);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    facebook: '',
    linkedin: ''
  });

  // Field validation errors
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    facebook: '',
    linkedin: ''
  });

  // Inline messages
  const profileMessage = useInlineMessage('profile-form');

  // Initialize form data when profile data is loaded from React Query
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.profile?.phone || '',
        bio: profile.profile?.bio || '',
        location: profile.profile?.location || '',
        website: profile.profile?.website || '',
        github: profile.profile?.github || '',
        facebook: profile.profile?.facebook || '',
        linkedin: profile.profile?.linkedin || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'phone':
        if (value && !/^\+?[0-9\s\-()]+$/.test(value)) {
          return 'Phone must be a valid phone number';
        }
        break;
      case 'website':
        if (value && !/^https?:\/\/.+\..+/.test(value)) {
          return 'Website must be a valid URL (e.g., https://example.com)';
        }
        break;
      case 'facebook':
        if (value && !value.includes('facebook.com')) {
          return 'Facebook must be a valid Facebook URL';
        }
        break;
      case 'linkedin':
        if (value && !value.includes('linkedin.com')) {
          return 'LinkedIn must be a valid LinkedIn URL or username';
        }
        break;
      case 'bio':
        if (value && value.length > 500) {
          return 'Bio must be less than 500 characters';
        }
        break;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors and messages
    setErrors({
      name: '',
      phone: '',
      bio: '',
      location: '',
      website: '',
      github: '',
      facebook: '',
      linkedin: ''
    });
    profileMessage.clear();

    // Field validation
    const newErrors = {
      name: validateField('name', profileData.name),
      phone: validateField('phone', profileData.phone),
      bio: validateField('bio', profileData.bio),
      location: '',
      website: validateField('website', profileData.website),
      github: '',
      facebook: validateField('facebook', profileData.facebook),
      linkedin: validateField('linkedin', profileData.linkedin)
    };

    const hasErrors = Object.values(newErrors).some(error => error !== '');

    if (hasErrors) {
      setErrors(newErrors);
      profileMessage.showError('Please fix the validation errors before saving.');
      return;
    }

    // Destructure to separate name/email from profile fields for auto-sync
    const { name, email, ...profileFields } = profileData;

    updateProfile({
      name,
      profile: {
        ...profile?.profile,  // Preserve all existing fields (avatar, title, skills, learning_goals)
        ...profileFields      // Auto-sync ALL profile fields (bio, location, website, github, linkedin)
      }
    }, {
      onSuccess: (response) => {
        profileMessage.showSuccess('Profile updated successfully!');
        // React Query will automatically invalidate and refetch profile data
      },
      onError: (error: any) => {
        // Keep error handling logic only, toast is handled automatically
        console.error('Profile update failed:', error);
      }
    });
  };

  if (authLoading || loading) {
    return (
      <div>
        <SkeletonBox className="h-9 w-48 mb-8" />

        <div className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-background rounded-lg border p-6">
            <SkeletonBox className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <SkeletonBox className="h-4 w-20 mb-2" />
                  <SkeletonBox className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information Card */}
          <div className="bg-background rounded-lg border p-6">
            <SkeletonBox className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <SkeletonBox className="h-4 w-24 mb-2" />
                  <SkeletonBox className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <SkeletonBox className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('profile.title')}</h1>

      {/* Page-level messages */}
      {profileMessage.message && (
        <InlineMessage
          message={profileMessage.message.message}
          type={profileMessage.message.type}
          onDismiss={profileMessage.clear}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

          {/* Avatar Upload Section */}
          <div className="mb-6 pb-6 border-b">
            <AvatarUpload
              currentAvatar={profile?.profile?.avatar}
              userName={profile?.name || ''}
              onUpload={async (file) => {
                try {
                  await uploadAvatar(file);
                  profileMessage.showSuccess('Avatar updated successfully!');
                } catch (error: any) {
                  console.error('Upload avatar failed:', error);
                  profileMessage.showError(error.message || 'Something went wrong');
                }
              }}
              onDelete={async () => {
                try {
                  await deleteAvatar(undefined);
                  profileMessage.showSuccess('Avatar removed successfully!');
                } catch (error: any) {
                  profileMessage.showError(error.message || 'Something went wrong');
                }
              }}
              uploading={uploadingAvatar}
              deleting={deletingAvatar}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={profileData.name}
                onChange={handleInputChange}
                required
                autoComplete="name"
                className={errors.name ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                disabled
                autoComplete="email"
                className="bg-muted"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                Phone
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={profileData.phone}
                onChange={handleInputChange}
                placeholder="+84 123 456 789"
                autoComplete="tel"
                className={errors.phone ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={profileData.bio}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.bio ? 'border-red-500 bg-red-50' : 'border-border'
                }`}
                placeholder="Tell us about yourself"
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                {profileData.bio.length}/500 characters
              </p>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
                Location
              </label>
              <Input
                id="location"
                name="location"
                type="text"
                value={profileData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
                autoComplete="address-level2"
              />
            </div>
          </div>
        </Card>

        {/* Social Links */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Social Links</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-foreground mb-1">
                Website
              </label>
              <Input
                id="website"
                name="website"
                type="url"
                value={profileData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                autoComplete="url"
                className={errors.website ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website}</p>
              )}
            </div>

            <div>
              <label htmlFor="github" className="block text-sm font-medium text-foreground mb-1">
                GitHub
              </label>
              <Input
                id="github"
                name="github"
                type="text"
                value={profileData.github}
                onChange={handleInputChange}
                placeholder="username"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="facebook" className="block text-sm font-medium text-foreground mb-1">
                Facebook
              </label>
              <Input
                id="facebook"
                name="facebook"
                type="text"
                value={profileData.facebook}
                onChange={handleInputChange}
                placeholder="facebook.com/username"
                autoComplete="url"
                className={errors.facebook ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.facebook && (
                <p className="mt-1 text-sm text-red-600">{errors.facebook}</p>
              )}
            </div>

            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-foreground mb-1">
                LinkedIn
              </label>
              <Input
                id="linkedin"
                name="linkedin"
                type="text"
                value={profileData.linkedin}
                onChange={handleInputChange}
                placeholder="linkedin.com/in/username"
                autoComplete="url"
                className={errors.linkedin ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.linkedin && (
                <p className="mt-1 text-sm text-red-600">{errors.linkedin}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Role</h3>
                <p className="text-sm text-muted-foreground">{user.role}</p>
              </div>
            </div>

            {user.premiumStatus && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Premium Status</h3>
                  <p className="text-sm text-success">Active</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = '/billing'}
              >
                Manage Billing
              </Button>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" loading={updating}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
