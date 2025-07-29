'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  EyeOff,
  FolderOpen,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Folder
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { 
  useAdminFAQCategoriesQuery,
  useCreateFAQCategory,
  useUpdateFAQCategory,
  useDeleteFAQCategory,
  useReorderFAQCategories
} from '@/hooks/queries/useFAQCategories';
import { 
  FAQCategoryData, 
  FAQCategoryCreateData, 
  FAQCategoryUpdateData 
} from '@/lib/api/faq-categories';

// Form validation utility
const validateForm = (data: FAQCategoryCreateData | FAQCategoryUpdateData): string[] => {
  const errors: string[] = [];
  
  if (!data.name?.trim()) {
    errors.push('Category name is required');
  }
  
  if (!data.slug?.trim()) {
    errors.push('Category slug is required');
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
  }
  
  if (data.order !== undefined && (data.order < 0 || data.order > 999)) {
    errors.push('Order must be between 0 and 999');
  }
  
  return errors;
};

export default function FAQCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FAQCategoryData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FAQCategoryData | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<FAQCategoryCreateData>({
    name: '',
    slug: '',
    description: '',
    order: 0,
    is_active: true,
  });
  
  // React Query hooks for FAQ category management
  const { data: categoriesData, loading } = useAdminFAQCategoriesQuery({
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    include_stats: true
  });
  
  const { mutate: createCategory, loading: createLoading } = useCreateFAQCategory();
  const { mutate: updateCategory, loading: updateLoading } = useUpdateFAQCategory();
  const { mutate: deleteCategory, loading: deleteLoading } = useDeleteFAQCategory();
  const { mutate: reorderCategories, loading: reorderLoading } = useReorderFAQCategories();
  
  // Combined loading state for actions
  const actionLoading = createLoading || updateLoading || deleteLoading || reorderLoading;
  
  // Extract categories from React Query response
  const categories = categoriesData?.data?.categories || [];
  const totalActive = categoriesData?.data?.active_count || 0;
  const totalInactive = categoriesData?.data?.inactive_count || 0;
  const totalCategories = categoriesData?.data?.total || 0;

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const handleCreateOrUpdate = async () => {
    // Reset previous errors
    setFormErrors([]);
    
    // Validate form
    const errors = validateForm(formData);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingCategory) {
      // Update existing category
      updateCategory({ id: editingCategory.id, data: formData as FAQCategoryUpdateData }, {
        onSuccess: () => {
          resetForm();
        },
        onError: (error) => {
          setFormErrors([error.message || 'Failed to update category']);
        }
      });
    } else {
      // Create new category
      createCategory(formData, {
        onSuccess: () => {
          resetForm();
        },
        onError: (error) => {
          setFormErrors([error.message || 'Failed to create category']);
        }
      });
    }
  };

  const handleDelete = (category: FAQCategoryData) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    
    deleteCategory(categoryToDelete.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
      },
      onError: (error) => {
        // Error is already handled by the mutation (toast shown)
        // Keep modal open for user to see the error
      }
    });
  };

  const startEdit = (category: FAQCategoryData) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      order: category.order,
      is_active: category.is_active,
    });
    setFormErrors([]);
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      order: 0,
      is_active: true,
    });
    setEditingCategory(null);
    setShowCreateModal(false);
    setFormErrors([]);
  };

  const handleReorder = (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex((cat: FAQCategoryData) => cat.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    // Create new order assignments
    const reorderedCategories = [...categories];
    [reorderedCategories[currentIndex], reorderedCategories[newIndex]] = 
    [reorderedCategories[newIndex], reorderedCategories[currentIndex]];

    const orderUpdates = reorderedCategories.map((cat: FAQCategoryData, index: number) => ({
      id: cat.id,
      order: index
    }));

    reorderCategories(orderUpdates);
  };

  const toggleSelectCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map((cat: FAQCategoryData) => cat.id)));
    }
  };

  // Filter categories based on search and status
  const filteredCategories = categories.filter((category: FAQCategoryData) => {
    const matchesSearch = !searchQuery || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? category.is_active : !category.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">FAQ Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage FAQ categories and their organization
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          disabled={actionLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Categories</p>
                <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <EyeOff className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Categories</p>
                <p className="text-2xl font-bold text-gray-900">{totalInactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 border rounded-md"
              >
                <option value="all">All Categories</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedCategories.size > 0 && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedCategories.size} categor{selectedCategories.size > 1 ? 'ies' : 'y'} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Bulk activate - implementation needed if required
                      console.log('Bulk activate:', Array.from(selectedCategories));
                    }}
                    disabled={actionLoading}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Bulk deactivate - implementation needed if required  
                      console.log('Bulk deactivate:', Array.from(selectedCategories));
                    }}
                    disabled={actionLoading}
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filteredCategories.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <EmptyState
                  title="No categories found"
                  description="No FAQ categories match your current search and filter criteria"
                  action={{
                    label: searchQuery || statusFilter !== 'all' ? 'Clear Filters' : 'Add First Category',
                    onClick: () => {
                      if (searchQuery || statusFilter !== 'all') {
                        setSearchQuery('');
                        setStatusFilter('all');
                      } else {
                        resetForm();
                        setShowCreateModal(true);
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCategories.size === filteredCategories.length && filteredCategories.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="p-4 text-left font-medium text-gray-700">Order</th>
                      <th className="p-4 text-left font-medium text-gray-700">Category</th>
                      <th className="p-4 text-left font-medium text-gray-700">Slug</th>
                      <th className="p-4 text-left font-medium text-gray-700">FAQs</th>
                      <th className="p-4 text-left font-medium text-gray-700">Views</th>
                      <th className="p-4 text-left font-medium text-gray-700">Status</th>
                      <th className="p-4 text-left font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCategories.map((category: FAQCategoryData, index: number) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedCategories.has(category.id)}
                            onChange={() => toggleSelectCategory(category.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{category.order}</Badge>
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReorder(category.id, 'up')}
                                disabled={index === 0 || reorderLoading}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReorder(category.id, 'down')}
                                disabled={index === filteredCategories.length - 1 || reorderLoading}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{category.name}</span>
                            </div>
                            {category.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {category.description.length > 60
                                  ? category.description.substring(0, 60) + '...'
                                  : category.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {category.slug}
                          </code>
                        </td>
                        <td className="p-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {category.faq_count || 0}
                            </div>
                            <div className="text-xs text-gray-500">FAQs</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {category.total_views || 0}
                            </div>
                            <div className="text-xs text-gray-500">views</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(category)}
                              disabled={actionLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(category)}
                              disabled={actionLoading || (category.faq_count && category.faq_count > 0)}
                              title={category.faq_count && category.faq_count > 0 ? 'Cannot delete category with FAQs' : 'Delete category'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={resetForm}
        title={editingCategory ? 'Edit FAQ Category' : 'Create FAQ Category'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Form Errors */}
          {formErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({ 
                  ...formData, 
                  name,
                  // Auto-generate slug if not manually edited
                  slug: formData.slug === generateSlug(formData.name) || !formData.slug 
                    ? generateSlug(name) 
                    : formData.slug
                });
              }}
              placeholder="e.g., General Questions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              placeholder="e.g., general-questions"
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL-friendly identifier (lowercase letters, numbers, and hyphens only)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this category covers..."
              className="w-full px-3 py-2 border rounded-md min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                min="0"
                max="999"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (visible to users)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateOrUpdate}
              disabled={!formData.name || !formData.slug || actionLoading}
              loading={actionLoading}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        title="Delete FAQ Category"
        size="md"
      >
        {categoryToDelete && (
          <div className="space-y-6">
            {/* Warning */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete "{categoryToDelete.name}"?
                </h3>
                <p className="text-gray-600">
                  This will permanently delete the FAQ category. This action cannot be undone.
                </p>
                
                {categoryToDelete.faq_count && categoryToDelete.faq_count > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Cannot Delete</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This category contains {categoryToDelete.faq_count} FAQ{categoryToDelete.faq_count > 1 ? 's' : ''}. 
                      Please move or delete all FAQs before deleting the category.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCategoryToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={deleteLoading}
                disabled={categoryToDelete.faq_count && categoryToDelete.faq_count > 0}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Category
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}