import { BadgeVariant } from '@/components/ui/Badge';

/**
 * Badge Helper Functions - Central management for all badge logic
 * Ensures consistent badge colors and variants across the application
 */

// 1. LEVEL BADGES - Fixed values (used in 6 files)
export const getLevelVariant = (level: string): BadgeVariant => {
  switch (level.toLowerCase()) {
    case 'beginner':
      return 'beginner';
    case 'intermediate':
      return 'intermediate';
    case 'advanced':
      return 'advanced';
    default:
      return 'secondary';
  }
};

// 2. LEVEL COLOR CLASS - For span elements (not Badge components)
export const getLevelColorClass = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'beginner':
      return 'text-blue-500';
    case 'intermediate':
      return 'text-blue-600';
    case 'advanced':
      return 'text-blue-700';
    default:
      return 'text-muted-foreground';
  }
};

// 3. ROLE BADGES - Fixed values (used in 1 file)
export const getRoleVariant = (role: string): BadgeVariant => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'admin';
    case 'creator':
      return 'creator';
    case 'student':
      return 'student';
    default:
      return 'secondary';
  }
};

// 4. PAYMENT STATUS VARIANT - For Badge component
export const getPaymentStatusVariant = (status: string): BadgeVariant => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'destructive';
    case 'refunded':
      return 'secondary';
    default:
      return 'secondary';
  }
};

// 5. SUBSCRIPTION STATUS VARIANT - For Badge component
export const getSubscriptionStatusVariant = (status: string): BadgeVariant => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'cancelled':
      return 'destructive';
    case 'past_due':
      return 'warning';
    case 'inactive':
      return 'secondary';
    default:
      return 'secondary';
  }
};

// 6. TICKET STATUS - From lib/types/support.ts constants
export const getTicketStatusVariant = (status: string): BadgeVariant => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'warning';
    case 'closed':
      return 'secondary';
    case 'unread':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// 7. TICKET PRIORITY - From lib/types/support.ts constants
export const getTicketPriorityVariant = (priority: string): BadgeVariant => {
  switch (priority.toLowerCase()) {
    case 'low':
      return 'secondary';
    case 'medium':
      return 'primary';
    case 'high':
      return 'warning';
    case 'urgent':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// 8. CATEGORY - DYNAMIC (KHÔNG hardcode names - categories có thể thay đổi!)
export const getCategoryVariant = (category: string): BadgeVariant => {
  // Use consistent hash để mỗi category luôn có cùng màu
  // IMPORTANT: Không hardcode category names vì chúng có thể thay đổi
  const hash = category.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use available variants for categories (neutral colors)
  const variants: BadgeVariant[] = ['info', 'secondary', 'outline'];
  const index = Math.abs(hash) % variants.length;
  return variants[index];
};

