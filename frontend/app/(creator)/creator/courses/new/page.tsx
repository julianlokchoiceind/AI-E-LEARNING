'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCourse } from '@/lib/api/courses';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

const CreateCoursePage = () => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const handleCreateCourse = async () => {
      try {
        // Check permissions
        if (user?.role !== 'creator' && user?.role !== 'admin') {
          toast.error('You do not have permission to create courses');
          router.push('/dashboard');
          return;
        }

        // Create course with API call
        const response = await createCourse();
        
        if (response.success && response.data?._id) {
          // Show success message from backend
          toast.success(response.message || 'Something went wrong');
          // Redirect to course editor
          router.push(`/creator/courses/${response.data._id}/edit`);
        } else {
          throw new Error(response.message || 'Something went wrong');
        }
      } catch (error: any) {
        console.error('Failed to create course:', error);
        toast.error(error.message || 'Something went wrong');
        router.push('/creator/courses');
      }
    };

    if (user) {
      handleCreateCourse();
    }
  }, [user, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Creating your course...</p>
      </div>
    </div>
  );
};

export default CreateCoursePage;