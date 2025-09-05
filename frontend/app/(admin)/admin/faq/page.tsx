'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
import { FAQ, FAQCreateData, FAQUpdateData } from '@/lib/api/faq';
import { useActiveFAQCategoriesQuery } from '@/hooks/queries/useFAQCategories';
import DeleteFAQModal, { FAQDeleteData } from '@/components/feature/DeleteFAQModal';

export default function AdminFAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFaqs, setSelectedFaqs] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQDeleteData | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
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
  
  // Get active FAQ categories for dropdowns
  const { data: categoriesData } = useActiveFAQCategoriesQuery();
  const categories = categoriesData?.data?.categories || [];
  
  const { mutate: createFAQMutation, loading: createLoading } = useCreateFAQ();
  const { mutate: updateFAQMutation, loading: updateLoading } = useUpdateFAQ();
  const { mutate: deleteFAQMutation, loading: deleteLoading } = useDeleteFAQ();
  const { mutate: bulkActionMutation, loading: bulkLoading } = useBulkFAQActions();
  
  // Combined loading state for actions
  const actionLoading = createLoading || updateLoading || deleteLoading || bulkLoading;
  
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
    deleteFAQMutation(faqId, {
      onSuccess: (response) => {
        // React Query will automatically invalidate and refetch FAQs
        setIsDeleteModalOpen(false);
        setFaqToDelete(null);
      }
    });
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
        <Button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Category Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
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
                    <Eye className="h-4 w-4 mr-1" />
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('unpublish')}
                    loading={bulkLoading}
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Unpublish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleBulkAction('delete')}
                    loading={bulkLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
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
                              disabled={actionLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(faq)}
                              loading={deleteLoading}
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
              loading={actionLoading}
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
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedFaqs.size} FAQ{selectedFaqs.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </Container>
  );
}