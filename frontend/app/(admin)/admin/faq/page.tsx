'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  AlertTriangle,
  Wand2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, SkeletonBox, SkeletonCircle, SkeletonText } from '@/components/ui/LoadingStates';
import { Container } from '@/components/ui/Container';
import {
  useAdminFAQsQuery,
  useCreateFAQ,
  useUpdateFAQ,
  useDeleteFAQ,
  useBulkFAQActions
} from '@/hooks/queries/useFAQ';
import { useApiMutation } from '@/hooks/useApiMutation';
import { FAQ, FAQCreateData, FAQUpdateData, faqAPI } from '@/lib/api/faq';
import { useGenerateFAQForCategory } from '@/hooks/queries/useAI';
import { ToastService } from '@/lib/toast/ToastService';
import { useAdminFAQCategoriesQuery } from '@/hooks/queries/useFAQCategories';
import DeleteFAQModal, { FAQDeleteData } from '@/components/feature/DeleteFAQModal';

export default function AdminFAQPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFaqs, setSelectedFaqs] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // FAQ Generation state
  const [selectedCategoryForGeneration, setSelectedCategoryForGeneration] = useState('');
  const [generationMode, setGenerationMode] = useState<'adaptive' | 'fixed'>('adaptive');
  const [numFaqs, setNumFaqs] = useState(5);
  const [generatedFaqs, setGeneratedFaqs] = useState<Array<{question: string, answer: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQDeleteData | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [processingFaqId, setProcessingFaqId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FAQCreateData>({
    question: '',
    answer: '',
    category_id: '',
    priority: 0,
    related_faqs: [],
    is_published: true,
    slug: '',
  });
  
  // React Query hooks for FAQ management
  const { 
    data: faqsData, 
    loading: isInitialLoading, 
    query: { isFetching, isRefetching },
    execute: refetchFAQs 
  } = useAdminFAQsQuery({
    search: searchQuery,
    category: selectedCategory,
    page: currentPage,
    limit: itemsPerPage
  });
  
  // Get admin FAQ categories for dropdowns (includes platform_context for AI generation)
  const { data: categoriesData } = useAdminFAQCategoriesQuery({ include_stats: false });
  const categories = categoriesData?.data?.categories || [];
  
  const { mutate: createFAQMutation, loading: createLoading } = useCreateFAQ();
  const { mutate: updateFAQMutation, loading: updateLoading } = useUpdateFAQ();
  const { mutate: deleteFAQMutation, loading: deleteLoading } = useDeleteFAQ();
  const { mutate: bulkActionMutation, loading: bulkLoading } = useBulkFAQActions();
  const { mutate: generateFAQMutation } = useGenerateFAQForCategory();

  // Bulk create FAQ mutation - useApiMutation handles toast intelligently
  const { mutate: bulkCreateFAQMutation } = useApiMutation(
    (faqs: FAQCreateData[]) => faqAPI.bulkCreate(faqs),
    {
      operationName: 'bulk-create-faqs',
      invalidateQueries: [
        ['admin-faqs'],
        ['faqs'],
        ['admin-faq-categories']
      ],
      onSuccess: (response) => {
        // Reset and close modals only if some FAQs were created successfully
        if (response.data?.created_count && response.data.created_count > 0) {
          setShowPreview(false);
          setShowGenerateModal(false);
          setGeneratedFaqs([]);
          setSelectedCategoryForGeneration('');
        }
      }
    }
  );
  
  // Individual loading state tracking (following Support page pattern)
  // Global actionLoading removed to prevent all rows showing spinners
  
  // Smart loading states: Only show spinner on initial load, not background refetch
  const showLoadingSpinner = isInitialLoading && !faqsData;
  
  // Extract FAQs and pagination data from React Query response
  // Backend now handles _id to id conversion (smart backend pattern)
  const faqs = faqsData?.data?.items || [];
  const totalItems = faqsData?.data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // No manual fetchFAQs needed - React Query handles this automatically
  // refetchFAQs is available for manual refresh if needed

  const handleCreateOrUpdate = async () => {
    if (editingFaq) {
      // Ensure slug is handled correctly for update too
      const updateData = {
        ...formData,
        slug: formData.slug || undefined
      };
      updateFAQMutation({ faqId: editingFaq.id, data: updateData as FAQUpdateData }, {
        onSuccess: (response) => {
          resetForm();
          // React Query will automatically invalidate and refetch FAQs
        }
      });
    } else {
      // Ensure category_id and slug are handled correctly
      const finalFormData = {
        ...formData,
        category_id: formData.category_id || undefined,
        slug: formData.slug || undefined  // Convert empty string to undefined for auto-generation
      };
      
      createFAQMutation(finalFormData, {
        onSuccess: (response) => {
          resetForm();
          // React Query will automatically invalidate and refetch FAQs
        }
      });
    }
  };

  const handleDelete = (faq: any) => {
    // Prepare FAQ data for the modal
    setFaqToDelete({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category_id: faq.category_id
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteFAQ = async (faqId: string) => {
    try {
      setProcessingFaqId(faqId);
      await deleteFAQMutation(faqId, {
        onSuccess: (response) => {
          // React Query will automatically invalidate and refetch FAQs
          setIsDeleteModalOpen(false);
          setFaqToDelete(null);
        }
      });
    } catch (error: any) {
      // Error toast is handled automatically by useApiMutation
    } finally {
      setProcessingFaqId(null);
    }
  };

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedFaqs.size === 0) {
      // Don't proceed without selection
      return;
    }

    if (action === 'delete') {
      // Open bulk delete modal for delete action
      setIsBulkDeleteModalOpen(true);
    } else {
      // For publish/unpublish, execute directly
      bulkActionMutation({ action, faqIds: Array.from(selectedFaqs) }, {
        onSuccess: (response) => {
          setSelectedFaqs(new Set());
          // React Query will automatically invalidate and refetch FAQs
        }
      });
    }
  };

  const handleConfirmBulkDelete = async () => {
    bulkActionMutation({ action: 'delete', faqIds: Array.from(selectedFaqs) }, {
      onSuccess: (response) => {
        setSelectedFaqs(new Set());
        setIsBulkDeleteModalOpen(false);
        // React Query will automatically invalidate and refetch FAQs
      }
    });
  };

  const startEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category_id: faq.category_id,
      priority: faq.priority,
      related_faqs: faq.related_faqs,
      is_published: faq.is_published,
      slug: faq.slug || '',
    });
    setShowCreateModal(true);
  };

  // Handle filter changes - reset to page 1
  const handleSearchChange = (value: string) => {
    setCurrentPage(1); // Reset to first page when search changes
    setSearchQuery(value);
  };

  const handleCategoryChange = (value: string) => {
    setCurrentPage(1); // Reset to first page when category changes
    setSelectedCategory(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category_id: '',
      priority: 0,
      related_faqs: [],
      is_published: true,
      slug: '',
    });
    setEditingFaq(null);
    setShowCreateModal(false);
  };

  // FAQ Generation functions (following quiz generation pattern)
  const handleGenerateFAQs = () => {
    if (!selectedCategoryForGeneration) {
      ToastService.error('Please select a category first');
      return;
    }

    // Find selected category details
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryForGeneration);
    if (!selectedCategory) {
      ToastService.error('Selected category not found');
      return;
    }

    // Validate platform_context
    if (!selectedCategory.platform_context || selectedCategory.platform_context.trim() === '') {
      ToastService.error('Selected category missing platform context');
      return;
    }

    setIsGenerating(true);

    // Use hook pattern like quiz generation
    generateFAQMutation(
      {
        category_name: selectedCategory.name,
        platform_context: selectedCategory.platform_context.trim(),
        num_faqs: generationMode === 'adaptive' ? null : numFaqs
      },
      {
        onSuccess: (response) => {
          setIsGenerating(false);
          if (response.success && response.data.faqs) {
            setGeneratedFaqs(response.data.faqs);
            setShowPreview(true);
            ToastService.success('FAQs generated successfully');
          } else {
            ToastService.error('No FAQs generated');
          }
        },
        onError: (error: any) => {
          setIsGenerating(false);
          ToastService.error(error.message || 'Something went wrong');
        }
      }
    );
  };

  const handleSaveGeneratedFAQs = () => {
    // Prepare bulk FAQ data
    const bulkFAQData: FAQCreateData[] = generatedFaqs.map(faq => ({
      question: faq.question,
      answer: faq.answer,
      category_id: selectedCategoryForGeneration,
      priority: 0,
      related_faqs: [],
      is_published: true,
      slug: undefined, // Auto-generate in backend
    }));

    // Use useApiMutation - it handles toast automatically
    bulkCreateFAQMutation(bulkFAQData);
  };

  const resetGenerationForm = () => {
    setSelectedCategoryForGeneration('');
    setGenerationMode('adaptive');
    setNumFaqs(5);
    setGeneratedFaqs([]);
    setShowPreview(false);
    setShowGenerateModal(false);
  };

  const toggleSelectFaq = (faqId: string) => {
    const newSelected = new Set(selectedFaqs);
    if (newSelected.has(faqId)) {
      newSelected.delete(faqId);
    } else {
      newSelected.add(faqId);
    }
    setSelectedFaqs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedFaqs.size === faqs.length) {
      setSelectedFaqs(new Set());
    } else {
      setSelectedFaqs(new Set(faqs.map((f: any) => f.id)));
    }
  };

  return (
    <Container variant="admin">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQ Management</h1>
          <p className="text-muted-foreground">Manage frequently asked questions and their organization</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowGenerateModal(true)}
          >
            AI Generative
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            Add FAQ
          </Button>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Category Filter */}
            <div className="flex gap-4">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search FAQs..."
                  size="sm"
                  className="w-full"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedFaqs.size > 0 && (
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <span className="text-primary">
                  {selectedFaqs.size} FAQ{selectedFaqs.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('publish')}
                    loading={bulkLoading}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('unpublish')}
                    loading={bulkLoading}
                  >
                    Unpublish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleBulkAction('delete')}
                    loading={bulkLoading}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              FAQs ({totalItems})
            </h2>
          </div>
        </div>

        {showLoadingSpinner ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3"><SkeletonCircle className="h-4 w-4" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-12" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                  <th className="px-6 py-3 text-left"><SkeletonBox className="h-4 w-16" /></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <SkeletonCircle className="h-4 w-4" />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <SkeletonBox className="h-5 w-48 mb-1" />
                        <SkeletonBox className="h-4 w-64" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-6 w-12 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-4 w-8" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SkeletonBox className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center space-x-2">
                        <SkeletonBox className="h-8 w-8 rounded" />
                        <SkeletonBox className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : faqs.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <EmptyState
                title="No FAQs found"
                description="No FAQs match your current search and filter criteria"
                action={{
                  label: searchQuery || selectedCategory ? 'Clear Filters' : 'Add First FAQ',
                  onClick: () => {
                    if (searchQuery || selectedCategory) {
                      setSearchQuery('');
                      setSelectedCategory('');
                      setCurrentPage(1);
                      // React Query will automatically refetch when filters change
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
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedFaqs.size === faqs.length && faqs.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {faqs.map((faq: any) => {
                    const categoryInfo = categories.find((c: any) => c.id === faq.category_id);
                    return (
                      <tr key={faq.id} className="hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedFaqs.has(faq.id)}
                            onChange={() => toggleSelectFaq(faq.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-foreground">{faq.question}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {faq.answer.length > 100
                                ? faq.answer.substring(0, 100) + '...'
                                : faq.answer}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-foreground">
                            {categoryInfo?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={faq.priority > 50 ? 'default' : 'secondary'}>
                            {faq.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {faq.view_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={faq.is_published ? 'default' : 'secondary'}>
                            {faq.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(faq)}
                              loading={processingFaqId === faq.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-border bg-muted/50 px-6 py-4">
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={resetForm}
        title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Question *
            </label>
            <Input
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="What is your question?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Answer *
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Provide a detailed answer..."
              className="w-full px-3 py-2 border rounded-md min-h-[150px]"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority (0-100)
              </label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                min="0"
                max="100"
              />
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Slug (optional)
            </label>
            <Input
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="auto-generated-from-question"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="rounded mr-2"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-foreground">
              Published
            </label>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateOrUpdate}
              disabled={!formData.question || !formData.answer}
              loading={createLoading || updateLoading}
            >
              {editingFaq ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete FAQ Modal */}
      <DeleteFAQModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setFaqToDelete(null);
        }}
        faq={faqToDelete}
        onConfirmDelete={handleConfirmDeleteFAQ}
      />

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <Modal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          title="Delete Multiple FAQs"
          size="md"
        >
          <div className="space-y-6">
            {/* Warning Icon & Message */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Confirm Bulk Deletion
                </h3>
                <p className="text-muted-foreground">
                  You are about to permanently delete {selectedFaqs.size} FAQ{selectedFaqs.size > 1 ? 's' : ''}. 
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Selected FAQs Info */}
            <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h4 className="font-medium text-warning">Warning</h4>
              </div>
              <p className="text-sm text-warning">
                All selected FAQs and their associated data will be permanently deleted. 
                This includes view counts, helpful votes, and any related links.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteModalOpen(false)}
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
                Delete {selectedFaqs.size} FAQ{selectedFaqs.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* FAQ Generation Modal */}
      {showGenerateModal && (
        <Modal
          isOpen={showGenerateModal}
          onClose={resetGenerationForm}
          title="AI Generative"
          size="lg"
        >
          {!showPreview ? (
            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Category
                </label>
                <select
                  value={selectedCategoryForGeneration}
                  onChange={(e) => setSelectedCategoryForGeneration(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  required
                >
                  <option value="">Choose a category...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {selectedCategoryForGeneration && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {categories.find(c => c.id === selectedCategoryForGeneration)?.description}
                  </p>
                )}
              </div>

              {/* Generation Mode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Generation Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="generation-mode"
                      value="adaptive"
                      checked={generationMode === 'adaptive'}
                      onChange={(e) => setGenerationMode(e.target.value as 'adaptive')}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      <strong>Adaptive</strong> - AI decides number of FAQs (3-8) based on category complexity
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="generation-mode"
                      value="fixed"
                      checked={generationMode === 'fixed'}
                      onChange={(e) => setGenerationMode(e.target.value as 'fixed')}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      <strong>Fixed</strong> - Generate specific number of FAQs
                    </span>
                  </label>
                </div>
              </div>

              {/* Number of FAQs (Fixed mode) */}
              {generationMode === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Number of FAQs
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={numFaqs}
                    onChange={(e) => setNumFaqs(parseInt(e.target.value) || 5)}
                    className="w-32"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={resetGenerationForm}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateFAQs}
                  disabled={!selectedCategoryForGeneration || isGenerating}
                  loading={isGenerating}
                >
                  AI Generative
                </Button>
              </div>
            </div>
          ) : (
            /* FAQ Preview */
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100">
                      Generated {generatedFaqs.length} FAQ{generatedFaqs.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Review the generated FAQs below and save them to your collection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {generatedFaqs.map((faq, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">
                      Q{index + 1}: {faq.question}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Back to Generate
                </Button>
                <Button
                  onClick={handleSaveGeneratedFAQs}
                  loading={createLoading}
                >
                  Save All FAQs
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
    </Container>
  );
}