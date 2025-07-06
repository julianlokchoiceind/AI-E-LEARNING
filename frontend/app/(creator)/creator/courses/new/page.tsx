'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCourse } from '@/hooks/queries/useCourses';
import { useAuth } from '@/hooks/useAuth';
import { ToastService } from '@/lib/toast/ToastService';

const CreateCoursePage = () => {
  const router = useRouter();
  const { user } = useAuth();

  // React Query mutation hook - automatic loading states and error handling
  const { mutate: createCourseMutation, loading } = useCreateCourse();

  useEffect(() => {
    const handleCreateCourse = () => {
      // Check permissions
      if (user?.role !== 'creator' && user?.role !== 'admin') {
        ToastService.error('You do not have permission to create courses');
        router.push('/dashboard');
        return;
      }

      // Create course using React Query mutation
      createCourseMutation(undefined, {
        onSuccess: (response) => {
          if (response.success && response.data?._id) {
            // Show success message from backend
            ToastService.success(response.message || 'Something went wrong');
            // Redirect to course editor
            router.push(`/creator/courses/${response.data._id}/edit`);
          } else {
            throw new Error(response.message || 'Something went wrong');
          }
        },
        onError: (error: any) => {
          console.error('Failed to create course:', error);
          ToastService.error(error.message || 'Something went wrong');
          router.push('/creator/courses');
        }
      });
    };

    if (user) {
      handleCreateCourse();
    }
  }, [user, router, createCourseMutation]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {loading ? 'Creating your course...' : 'Setting up course creation...'}
        </p>
      </div>
    </div>
  );
};

export default CreateCoursePage;