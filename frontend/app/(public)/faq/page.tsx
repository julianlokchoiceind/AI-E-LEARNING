'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown,
  Tag,
  HelpCircle
} from 'lucide-react';
import { ToastService } from '@/lib/toast/ToastService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useFAQsQuery, useVoteFAQ } from '@/hooks/queries/useFAQ';
import { useFAQCategoriesQuery } from '@/hooks/queries/useFAQCategories';
import { FAQ, FAQListResponse } from '@/lib/api/faq';
import { LoadingSpinner, EmptyState, FAQListSkeleton } from '@/components/ui/LoadingStates';

export default function FAQPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [votedFaqs, setVotedFaqs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // React Query hooks - automatic caching and state management
  const { data: faqResponse, loading } = useFAQsQuery({
    search: searchQuery,
    category: selectedCategory,
    published: true,
    page: currentPage,
    limit: 20
  });
  
  const { data: categoriesResponse, loading: categoriesLoading } = useFAQCategoriesQuery();
  
  // React Query mutation for FAQ voting
  const { mutate: voteFAQ, loading: isVoting } = useVoteFAQ();
  
  // Extract data from React Query responses
  const faqs = faqResponse?.data?.items || [];
  const totalPages = Math.ceil((faqResponse?.data?.total || 0) / (faqResponse?.data?.per_page || 10));
  const categories = categoriesResponse?.data?.categories || [];

  // Categories are now automatically fetched via React Query

  // FAQs are now automatically fetched via React Query with debouncing built-in

  // Load voted FAQs from localStorage
  useEffect(() => {
    const voted = localStorage.getItem('votedFaqs');
    if (voted) {
      setVotedFaqs(new Set(JSON.parse(voted)));
    }
  }, []);

  const toggleExpanded = (faqId: string) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFaqs(newExpanded);
  };

  const handleVote = (faqId: string, isHelpful: boolean) => {
    if (!user) {
      ToastService.error('Please login to vote');
      return;
    }

    if (votedFaqs.has(faqId)) {
      ToastService.error('You have already voted on this FAQ');
      return;
    }

    // React Query mutation handles API call with automatic error handling
    voteFAQ({ faqId, isHelpful }, {
      onSuccess: (response) => {
        ToastService.success(response.message || 'Something went wrong');
        
        // Mark as voted in local state only
        const newVoted = new Set(votedFaqs);
        newVoted.add(faqId);
        setVotedFaqs(newVoted);
        localStorage.setItem('votedFaqs', JSON.stringify(Array.from(newVoted)));
        
        // React Query will automatically refetch FAQ data to show updated vote counts
      },
      onError: (error: any) => {
        console.error('Failed to vote:', error);
        ToastService.error(error.message || 'Something went wrong');
      }
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c: any) => c.id === categoryId);
  };

  if (loading) {
    return <FAQListSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our AI E-Learning platform
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              All Categories
            </Button>
            {categories.map((category: any) => {
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* FAQ List */}
        {faqs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No FAQs found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq: any) => {
              const isExpanded = expandedFaqs.has(faq.id);
              const hasVoted = votedFaqs.has(faq.id);
              const categoryInfo = getCategoryInfo(faq.category_id);
              
              return (
                <Card key={faq.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {faq.question}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              {categoryInfo?.name || 'General'}
                            </span>
                            <span>{faq.view_count} views</span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <div className="pt-4">
                          <div
                            className="prose prose-gray max-w-none"
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />
                          
                          
                          {/* Vote Section */}
                          <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Was this answer helpful?
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleVote(faq.id, true)}
                                disabled={hasVoted || isVoting}
                                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                                  hasVoted || isVoting
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span>{faq.helpful_votes}</span>
                              </button>
                              <button
                                onClick={() => handleVote(faq.id, false)}
                                disabled={hasVoted || isVoting}
                                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                                  hasVoted || isVoting
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                                }`}
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span>{faq.unhelpful_votes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <Card>
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Still have questions?
              </h3>
              <p className="text-gray-600 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Button>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}