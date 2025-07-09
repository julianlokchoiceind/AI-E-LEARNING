'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown,
  Tag,
  HelpCircle,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { ToastService } from '@/lib/toast/ToastService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnimatedButton, GlassCard } from '@/components/ui/modern/ModernComponents';
import { useAuth } from '@/hooks/useAuth';
import { useFAQsQuery, useFAQCategoriesQuery, useVoteFAQ } from '@/hooks/queries/useFAQ';
import { FAQ, FAQCategory, FAQListResponse } from '@/lib/api/faq';
import { FAQ_CATEGORIES } from '@/lib/types/faq';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';

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
  const faqs = faqResponse?.data?.faqs || [];
  const totalPages = faqResponse?.data?.totalPages || 1;
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

  const getCategoryInfo = (category: string) => {
    return FAQ_CATEGORIES.find(c => c.value === category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our AI E-Learning platform. Get the help you need to succeed.
          </p>
        </motion.div>

        {/* Enhanced Search and Filter */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard variant="light" className="p-8">
            {/* Enhanced Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <Input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-200"
              />
            </div>

            {/* Enhanced Category Filter */}
            <div className="flex flex-wrap gap-3">
              <AnimatedButton
                variant={selectedCategory === '' ? 'gradient' : 'ghost'}
                size="md"
                onClick={() => setSelectedCategory('')}
              >
                All Categories
              </AnimatedButton>
              {categories.map((category: any) => {
                const info = getCategoryInfo(category.value);
                return (
                  <AnimatedButton
                    key={category.value}
                    variant={selectedCategory === category.value ? 'primary' : 'ghost'}
                    size="md"
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    {info?.icon} {category.label} ({category.count})
                  </AnimatedButton>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Enhanced FAQ List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" message="Loading frequently asked questions..." />
          </div>
        ) : faqs.length === 0 ? (
          <GlassCard variant="light" className="p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No FAQs found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria to find what you're looking for
            </p>
            <AnimatedButton 
              variant="secondary" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
            >
              Clear Filters
            </AnimatedButton>
          </GlassCard>
        ) : (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {faqs.map((faq: any, index: number) => {
              const isExpanded = expandedFaqs.has(faq._id);
              const hasVoted = votedFaqs.has(faq._id);
              const categoryInfo = getCategoryInfo(faq.category);
              
              return (
                <motion.div
                  key={faq._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <GlassCard variant="light" className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    <button
                      onClick={() => toggleExpanded(faq._id)}
                      className="w-full text-left p-8 hover:bg-white/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            {faq.question}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                              {categoryInfo?.icon} {categoryInfo?.label}
                            </span>
                            <span className="flex items-center gap-1">
                              <HelpCircle className="h-4 w-4" />
                              {faq.view_count} views
                            </span>
                            {faq.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                {faq.tags.slice(0, 2).join(', ')}
                                {faq.tags.length > 2 && '...'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <motion.div 
                        className="px-8 pb-8 border-t border-gray-200"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="pt-6">
                          <div
                            className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                          />
                          
                          {/* Enhanced Tags */}
                          {faq.tags.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                              {faq.tags.map((tag: any, index: number) => (
                                <Badge key={index} variant="secondary" className="px-3 py-1">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Enhanced Vote Section */}
                          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-700">
                                Was this answer helpful?
                              </div>
                              <div className="flex items-center gap-3">
                                <AnimatedButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVote(faq._id, true)}
                                  disabled={hasVoted || isVoting}
                                  className={`${
                                    hasVoted || isVoting
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-green-600 hover:bg-green-50'
                                  }`}
                                  icon={<ThumbsUp className="h-4 w-4" />}
                                >
                                  {faq.helpful_votes}
                                </AnimatedButton>
                                <AnimatedButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVote(faq._id, false)}
                                  disabled={hasVoted || isVoting}
                                  className={`${
                                    hasVoted || isVoting
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-red-600 hover:bg-red-50'
                                  }`}
                                  icon={<ThumbsDown className="h-4 w-4" />}
                                >
                                  {faq.unhelpful_votes}
                                </AnimatedButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <motion.div 
            className="mt-12 flex justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <AnimatedButton
              variant="secondary"
              size="md"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </AnimatedButton>
            <div className="flex items-center px-6 py-3 bg-white rounded-xl border border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <AnimatedButton
              variant="secondary"
              size="md"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </AnimatedButton>
          </motion.div>
        )}

        {/* Enhanced Contact Support */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <GlassCard variant="colored" className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Can't find what you're looking for? Our support team is here to help you succeed.
            </p>
            <AnimatedButton 
              variant="gradient" 
              size="lg"
              icon={<Sparkles className="w-5 h-5" />}
            >
              Contact Support
            </AnimatedButton>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}