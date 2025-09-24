'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, BookOpen, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'course' | 'faq';
  title: string;
  thumbnail?: string;
}

export function HeaderSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 64, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Calculate dropdown position
  useEffect(() => {
    if (inputRef.current && showDropdown) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: 64, // Header height - consistent with other dropdowns
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
    document.addEventListener('scroll', handleScroll, true); // Use capture phase for all scroll events
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // Simple search mock data
  const mockResults: SearchResult[] = [
    { id: '1', type: 'course', title: 'AI-Powered Marketing', thumbnail: '/placeholder-course.jpg' },
    { id: '2', type: 'course', title: 'AI-Powered Business Automation' },
    { id: '3', type: 'course', title: 'Large Language Model Integration' },
    { id: '4', type: 'faq', title: 'How to get started?' },
    { id: '5', type: 'faq', title: 'What is AI learning?' }
  ];

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      const filtered = mockResults
        .filter(item => item.title.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 10);
      setResults(filtered);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

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
      router.push(`/courses?search=${query}`);
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query && setShowDropdown(true)}
            placeholder="Search courses and FAQ..."
            className="w-full px-4 py-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </form>

      {/* Search Results Dropdown - Fixed positioning like other dropdowns */}
      {showDropdown && results.length > 0 && (
        <div
          className="fixed bg-card border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
          style={{
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            width: dropdownPosition.width
          }}
        >
          {results.map((result) => (
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
          ))}
        </div>
      )}
    </div>
  );
}