'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { faqAPI, FAQ, FAQCreateData, FAQUpdateData } from '@/lib/api/faq';
import { FAQ_CATEGORIES } from '@/lib/types/faq';

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFaqs, setSelectedFaqs] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<FAQCreateData>({
    question: '',
    answer: '',
    category: 'general',
    priority: 0,
    tags: [],
    related_faqs: [],
    is_published: true,
    slug: '',
  });

  // Fetch FAQs
  useEffect(() => {
    fetchFAQs();
  }, [searchQuery, selectedCategory]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await faqAPI.getFAQs({
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        per_page: 100,
      });
      setFaqs(response.items);
    } catch (error: any) {
      console.error('Failed to fetch FAQs:', error);
      toast.error(error.message || 'Operation Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (editingFaq) {
        // Update existing FAQ
        const updated = await faqAPI.updateFAQ(editingFaq._id, formData as FAQUpdateData);
        setFaqs(faqs.map(f => f._id === updated._id ? updated : f));
        toast.success(updated.message || 'Operation Failed');
      } else {
        // Create new FAQ
        const created = await faqAPI.createFAQ(formData);
        setFaqs([created, ...faqs]);
        toast.success(created.message || 'Operation Failed');
      }
      
      resetForm();
    } catch (error: any) {
      console.error('Failed to save FAQ:', error);
      toast.error(error.response?.data?.detail || error.message || 'Operation Failed');
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await faqAPI.deleteFAQ(faqId);
      setFaqs(faqs.filter(f => f._id !== faqId));
      toast.success(response?.message || 'Operation Failed');
    } catch (error: any) {
      console.error('Failed to delete FAQ:', error);
      toast.error(error.message || 'Operation Failed');
    }
  };

  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'delete') => {
    if (selectedFaqs.size === 0) {
      toast.error('Please select FAQs first');
      return;
    }

    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedFaqs.size} FAQs?`
      : `Are you sure you want to ${action} ${selectedFaqs.size} FAQs?`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await faqAPI.bulkAction({
        faq_ids: Array.from(selectedFaqs),
        action,
      });
      
      if (action === 'delete') {
        setFaqs(faqs.filter(f => !selectedFaqs.has(f._id)));
      } else {
        setFaqs(faqs.map(f => {
          if (selectedFaqs.has(f._id)) {
            return { ...f, is_published: action === 'publish' };
          }
          return f;
        }));
      }
      
      setSelectedFaqs(new Set());
      toast.success(response?.message || 'Operation Failed');
    } catch (error: any) {
      console.error('Failed to perform bulk action:', error);
      toast.error(error.message || 'Operation Failed');
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      priority: faq.priority,
      tags: faq.tags,
      related_faqs: faq.related_faqs,
      is_published: faq.is_published,
      slug: faq.slug || '',
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      priority: 0,
      tags: [],
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
      setSelectedFaqs(new Set(faqs.map(f => f._id)));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">FAQ Management</h1>
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
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Category Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                {FAQ_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedFaqs.size > 0 && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedFaqs.size} FAQ{selectedFaqs.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('publish')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('unpublish')}
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Unpublish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleBulkAction('delete')}
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
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedFaqs.size === faqs.length && faqs.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-4 text-left font-medium text-gray-700">Question</th>
                    <th className="p-4 text-left font-medium text-gray-700">Category</th>
                    <th className="p-4 text-left font-medium text-gray-700">Priority</th>
                    <th className="p-4 text-left font-medium text-gray-700">Views</th>
                    <th className="p-4 text-left font-medium text-gray-700">Status</th>
                    <th className="p-4 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {faqs.map((faq) => {
                    const categoryInfo = FAQ_CATEGORIES.find(c => c.value === faq.category);
                    return (
                      <tr key={faq._id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedFaqs.has(faq._id)}
                            onChange={() => toggleSelectFaq(faq._id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{faq.question}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {faq.answer.length > 100
                                ? faq.answer.substring(0, 100) + '...'
                                : faq.answer}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">
                            {categoryInfo?.icon} {categoryInfo?.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant={faq.priority > 50 ? 'default' : 'secondary'}>
                            {faq.priority}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {faq.view_count}
                        </td>
                        <td className="p-4">
                          <Badge variant={faq.is_published ? 'default' : 'secondary'}>
                            {faq.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
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
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(faq._id)}
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
        </CardContent>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question *
            </label>
            <Input
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="What is your question?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                {FAQ_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <Input
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
              placeholder="ai, learning, tutorial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
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
            >
              {editingFaq ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}