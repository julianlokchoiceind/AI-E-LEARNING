'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ProfilePageSkeleton } from '@/components/ui/LoadingStates';
import { useUserProfileManagement } from '@/hooks/queries/useUserProfile';
import { useI18n } from '@/lib/i18n/context';
import { ToastService } from '@/lib/toast/ToastService';

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        // React Query will automatically invalidate and refetch profile data
        // Toast handled automatically by useUserProfileManagement
      },
      onError: (error: any) => {
        // Keep error handling logic only, toast is handled automatically
        console.error('Profile update failed:', error);
      }
    });
  };

  if (authLoading || loading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t('profile.title')}</h1>

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
              />
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
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tell us about yourself"
              />
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
              />
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
              />
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
    </div>
  );
}