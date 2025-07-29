/**
 * Reusable ExpandableItem component for accordion-style UI
 * Following CLAUDE.md patterns - Generic UI component with customizable styling
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface ExpandableItemProps {
  id: string;
  header: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  
  // Styling customization
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  
  // Icon customization
  icon?: React.ReactNode;
  hideIcon?: boolean;
  
  // Animation
  animationDuration?: number; // in milliseconds
  
  // Accessibility
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Generic expandable item component for accordions, navigation, etc.
 * 
 * @example
 * // Basic usage
 * <ExpandableItem
 *   id="item1"
 *   header="Click to expand"
 *   isExpanded={isExpanded('item1')}
 *   onToggle={toggleItem}
 * >
 *   <p>Content goes here</p>
 * </ExpandableItem>
 * 
 * @example
 * // Custom styling (AdminSidebar)
 * <ExpandableItem
 *   id="faq"
 *   header={<div className="flex items-center"><HelpIcon />FAQ Management</div>}
 *   isExpanded={isExpanded('faq')}
 *   onToggle={toggleItem}
 *   headerClassName="group flex items-center px-3 py-2 text-sm font-medium rounded-lg"
 *   contentClassName="ml-8 space-y-1 mt-1"
 * >
 *   {subItems}
 * </ExpandableItem>
 */
export const ExpandableItem = React.memo<ExpandableItemProps>(({
  id,
  header,
  children,
  isExpanded,
  onToggle,
  className = '',
  headerClassName = '',
  contentClassName = '',
  icon,
  hideIcon = false,
  animationDuration = 200,
  ariaLabel,
  disabled = false
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onToggle(id);
    }
  };

  const defaultIcon = (
    <ChevronRight 
      className={`h-4 w-4 transition-transform duration-${animationDuration} ${
        isExpanded ? 'rotate-90' : ''
      }`}
    />
  );

  return (
    <div className={`expandable-item ${className}`}>
      {/* Header - Clickable area */}
      <button
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between transition-colors
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${headerClassName}
        `}
        aria-expanded={isExpanded}
        aria-controls={`expandable-content-${id}`}
        aria-label={ariaLabel || `Toggle ${id}`}
        disabled={disabled}
        type="button"
      >
        <div className="flex items-center flex-1">
          {header}
        </div>
        
        {!hideIcon && (
          <div className="flex-shrink-0 ml-2">
            {icon || defaultIcon}
          </div>
        )}
      </button>
      
      {/* Content - Expandable area */}
      <div
        id={`expandable-content-${id}`}
        className={`
          overflow-hidden transition-all ease-in-out
          ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
        `}
        style={{
          transitionDuration: `${animationDuration}ms`
        }}
        aria-hidden={!isExpanded}
      >
        <div className={`${contentClassName} ${isExpanded ? 'visible' : 'invisible'}`}>
          {children}
        </div>
      </div>
    </div>
  );
});

ExpandableItem.displayName = 'ExpandableItem';