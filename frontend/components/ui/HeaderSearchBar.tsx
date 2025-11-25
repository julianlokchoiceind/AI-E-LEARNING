'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, BookOpen, HelpCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCourseSearchQuery } from '@/hooks/queries/useCourses';
import { useFAQSearchQuery } from '@/hooks/queries/useFAQ';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface SearchResult {
  id: string;
  type: 'course' | 'faq';
  title: string;
  thumbnail?: string;
}

export function HeaderSearchBar() {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 64, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounce query for API calls
  const debouncedQuery = useDebouncedValue(query, 300);
  const shouldSearch = debouncedQuery.length >= 2;

  // Fetch courses and FAQs
  const { data: coursesData, loading: isLoadingCourses } = useCourseSearchQuery(debouncedQuery, {});
  const { data: faqsData, loading: isLoadingFAQs } = useFAQSearchQuery(debouncedQuery, {});

  const isLoading = shouldSearch && (isLoadingCourses || isLoadingFAQs);

  // Combine results
  const results = useMemo<SearchResult[]>(() => {
    if (!shouldSearch) return [];

    const courseResults = (coursesData?.data?.courses || [])
      .slice(0, 5)
      .map(c => ({
        id: c.id,
        type: 'course' as const,
        title: c.title,
        thumbnail: c.thumbnail
      }));

    const faqResults = (faqsData?.data?.items || [])
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        type: 'faq' as const,
        title: f.question
      }));

    return [...courseResults, ...faqResults];
  }, [shouldSearch, coursesData, faqsData]);

  // Calculate dropdown position
  useEffect(() => {
    if (inputRef.current && showDropdown) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: 64,
        width: rect.width
      });
    }
  }, [showDropdown]);

  // Close dropdown on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleScroll = () => {
      setShowDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // Show dropdown when results change
  useEffect(() => {
    if (shouldSearch && (results.length > 0 || isLoading)) {
      setShowDropdown(true);
    }
  }, [shouldSearch, results.length, isLoading]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'course') {
      router.push(`/courses/${result.id}`);
    } else {
      router.push('/faq');
    }
    setShowDropdown(false);
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/courses?search=${encodeURIComponent(query)}`);
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            id="header-search"
            name="search"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => shouldSearch && setShowDropdown(true)}
            placeholder="Search courses and FAQ..."
            className="w-full px-4 py-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search courses and FAQ"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && shouldSearch && (
        <div
          className="fixed bg-card border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
          style={{
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            width: dropdownPosition.width
          }}
        >
          {isLoading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found
            </div>
          ) : (
            results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left"
              >
                {result.type === 'course' ? (
                  result.thumbnail ? (
                    <img src={result.thumbnail} alt="" className="w-12 h-12 rounded object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                  )
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {result.type === 'course' ? 'Course' : 'FAQ'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
