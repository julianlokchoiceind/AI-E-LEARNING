/**
 * Reusable hook for expand/collapse functionality
 * Following CLAUDE.md patterns - Smart Backend, Dumb Frontend
 */
import { useState, useCallback } from 'react';

export interface UseExpandableOptions {
  allowMultiple?: boolean;        // Allow multiple items to be expanded at once
  defaultExpanded?: string[];     // IDs of items that should be expanded by default
  onToggle?: (id: string, isExpanded: boolean) => void;  // Callback when item is toggled
}

export interface UseExpandableReturn {
  expandedItems: Set<string>;
  toggleItem: (id: string) => void;
  expandItem: (id: string) => void;
  collapseItem: (id: string) => void;
  isExpanded: (id: string) => boolean;
  expandAll: (itemIds: string[]) => void;
  collapseAll: () => void;
  toggleAll: (itemIds: string[]) => void;
}

/**
 * Custom hook for managing expandable items (accordions, navigation, etc.)
 * 
 * @param options Configuration options
 * @returns Methods and state for managing expanded items
 * 
 * @example
 * // Accordion behavior (only one item open)
 * const { expandedItems, toggleItem, isExpanded } = useExpandable({
 *   allowMultiple: false
 * });
 * 
 * @example
 * // Multiple items can be open
 * const { expandedItems, toggleItem, isExpanded } = useExpandable({
 *   allowMultiple: true,
 *   defaultExpanded: ['item1', 'item2']
 * });
 */
export const useExpandable = (options: UseExpandableOptions = {}): UseExpandableReturn => {
  const {
    allowMultiple = false,
    defaultExpanded = [],
    onToggle
  } = options;

  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(itemId);

      if (wasExpanded) {
        // Collapse item
        newSet.delete(itemId);
      } else {
        // Expand item
        if (!allowMultiple) {
          // Accordion behavior - close all others
          newSet.clear();
        }
        newSet.add(itemId);
      }

      // Call callback if provided
      onToggle?.(itemId, !wasExpanded);

      return newSet;
    });
  }, [allowMultiple, onToggle]);

  const expandItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      
      if (!allowMultiple) {
        // Accordion behavior - close all others
        newSet.clear();
      }
      
      newSet.add(itemId);
      
      if (!prev.has(itemId)) {
        onToggle?.(itemId, true);
      }
      
      return newSet;
    });
  }, [allowMultiple, onToggle]);

  const collapseItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(itemId);
      
      if (wasExpanded) {
        newSet.delete(itemId);
        onToggle?.(itemId, false);
      }
      
      return newSet;
    });
  }, [onToggle]);

  const isExpanded = useCallback((itemId: string): boolean => {
    return expandedItems.has(itemId);
  }, [expandedItems]);

  const expandAll = useCallback((itemIds: string[]) => {
    if (!allowMultiple && itemIds.length > 1) {
      console.warn('useExpandable: Cannot expand multiple items when allowMultiple is false');
      return;
    }

    setExpandedItems(prev => {
      const newSet = allowMultiple ? new Set(prev) : new Set<string>();
      
      itemIds.forEach(id => {
        if (!prev.has(id)) {
          newSet.add(id);
          onToggle?.(id, true);
        }
      });
      
      return newSet;
    });
  }, [allowMultiple, onToggle]);

  const collapseAll = useCallback(() => {
    setExpandedItems(prev => {
      // Call onToggle for all currently expanded items
      prev.forEach(id => {
        onToggle?.(id, false);
      });
      
      return new Set();
    });
  }, [onToggle]);

  const toggleAll = useCallback((itemIds: string[]) => {
    const allExpanded = itemIds.every(id => expandedItems.has(id));
    
    if (allExpanded) {
      // Collapse all
      collapseAll();
    } else {
      // Expand all
      expandAll(itemIds);
    }
  }, [expandedItems, expandAll, collapseAll]);

  return {
    expandedItems,
    toggleItem,
    expandItem,
    collapseItem,
    isExpanded,
    expandAll,
    collapseAll,
    toggleAll
  };
};