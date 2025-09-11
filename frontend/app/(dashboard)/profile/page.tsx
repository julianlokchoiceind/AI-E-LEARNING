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

interface ProfileData {
  name: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
}

export default function ProfilePage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  
  // React Query hooks for profile management
  const {
    profile,
    loading,
    updateProfile,
    updating
  } = useUserProfileManagement(!!user);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    linkedin: ''
  });

  // Field validation errors
  const [errors, setErrors] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    github: '',
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
        bio: profile.profile?.bio || '',
        location: profile.profile?.location || '',
        website: profile.profile?.website || '',
        github: profile.profile?.github || '',
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
      case 'website':
        if (value && !/^https?:\/\/.+\..+/.test(value)) {
          return 'Website must be a valid URL (e.g., https://example.com)';
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
      bio: '',
      location: '',
      website: '',
      github: '',
      linkedin: ''
    });
    profileMessage.clear();
    
    // Field validation
    const newErrors = {
      name: validateField('name', profileData.name),
      bio: validateField('bio', profileData.bio),
      location: '',
      website: validateField('website', profileData.website),
      github: '',
      linkedin: validateField('linkedin', profileData.linkedin)
    };
    
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    
    if (hasErrors) {
      setErrors(newErrors);
      profileMessage.showError('Please fix the validation errors before saving.');
      return;
    }

    updateProfile({
      name: profileData.name,
      profile: {
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        github: profileData.github,
        linkedin: profileData.linkedin
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
      <Container variant="public">
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
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container variant="public">
      <h1 className="text-3xl font-bold mb-8">{t('profile.title')}</h1>

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
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
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
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground mt-1">Email cannot be changed</p>
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
              />
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
          <Button type="submit" disabled={updating}>
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Container>
  );
}