/**
 * FAQ type definitions
 */

export type FAQCategory = 'general' | 'pricing' | 'learning' | 'technical' | 'creator' | 'admin';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  priority: number;
  tags: string[];
  related_faqs: string[];
  is_published: boolean;
  slug?: string;
  view_count: number;
  helpful_votes: number;
  unhelpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface FAQFormData {
  question: string;
  answer: string;
  category: FAQCategory;
  priority: number;
  tags: string[];
  related_faqs: string[];
  is_published: boolean;
  slug?: string;
}

export interface FAQCategoryInfo {
  value: FAQCategory;
  label: string;
  description: string;
  icon: string;
}

export const FAQ_CATEGORIES: FAQCategoryInfo[] = [
  {
    value: 'general',
    label: 'General',
    description: 'General questions about the platform',
    icon: '📋',
  },
  {
    value: 'pricing',
    label: 'Pricing & Payment',
    description: 'Questions about pricing, subscriptions, and payments',
    icon: '💰',
  },
  {
    value: 'learning',
    label: 'Learning',
    description: 'Questions about courses, learning features, and progress',
    icon: '📚',
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Technical issues, browser support, and troubleshooting',
    icon: '🛠️',
  },
  {
    value: 'creator',
    label: 'Content Creator',
    description: 'Questions for course creators and instructors',
    icon: '🎨',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Administrative and platform management questions',
    icon: '👤',
  },
];