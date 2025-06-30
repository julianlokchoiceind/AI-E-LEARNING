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
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { faqAPI, FAQ, FAQCategory, FAQListResponse } from '@/lib/api/faq';
import { FAQ_CATEGORIES } from '@/lib/types/faq';

export default function FAQPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [votedFaqs, setVotedFaqs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await faqAPI.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch FAQs
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const response = await faqAPI.getFAQs({
          q: searchQuery,
          category: selectedCategory || undefined,
          page: currentPage,
          per_page: 10,
          sort_by: 'priority',
          sort_order: 'desc',
        });
        
        setFaqs(response.items);
        setTotalPages(Math.ceil(response.total / response.per_page));
      } catch (error: any) {
        console.error('Failed to fetch FAQs:', error);
        toast.error(error.message || 'Operation Failed');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchFAQs, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, currentPage]);

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

  const handleVote = async (faqId: string, isHelpful: boolean) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    if (votedFaqs.has(faqId)) {
      toast.error('You have already voted on this FAQ');
      return;
    }

    try {
      const result = await faqAPI.voteFAQ(faqId, { is_helpful: isHelpful });
      
      // Update local state
      setFaqs(faqs.map(faq => {
        if (faq._id === faqId) {
          return {
            ...faq,
            helpful_votes: result.helpful_votes,
            unhelpful_votes: result.unhelpful_votes,
          };
        }
        return faq;
      }));

      // Mark as voted
      const newVoted = new Set(votedFaqs);
      newVoted.add(faqId);
      setVotedFaqs(newVoted);
      localStorage.setItem('votedFaqs', JSON.stringify(Array.from(newVoted)));

      toast.success(result.message || 'Operation Failed');
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast.error(error.message || 'Operation Failed');
    }
  };

  const getCategoryInfo = (category: string) => {
    return FAQ_CATEGORIES.find(c => c.value === category);
  };

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
            {categories.map((category) => {
              const info = getCategoryInfo(category.value);
              return (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {info?.icon} {category.label} ({category.count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* FAQ List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : faqs.length === 0 ? (
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
            {faqs.map((faq) => {
              const isExpanded = expandedFaqs.has(faq._id);
              const hasVoted = votedFaqs.has(faq._id);
              const categoryInfo = getCategoryInfo(faq.category);
              
              return (
                <Card key={faq._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleExpanded(faq._id)}
                      className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {faq.question}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              {categoryInfo?.icon} {categoryInfo?.label}
                            </span>
                            <span>{faq.view_count} views</span>
                            {faq.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {faq.tags.slice(0, 2).join(', ')}
                                {faq.tags.length > 2 && '...'}
                              </div>
                            )}
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
                          
                          {/* Tags */}
                          {faq.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {faq.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Vote Section */}
                          <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Was this answer helpful?
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleVote(faq._id, true)}
                                disabled={hasVoted}
                                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                                  hasVoted
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span>{faq.helpful_votes}</span>
                              </button>
                              <button
                                onClick={() => handleVote(faq._id, false)}
                                disabled={hasVoted}
                                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                                  hasVoted
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