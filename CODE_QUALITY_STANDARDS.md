# 📋 Code Quality Standards

## 🎯 Overview
This document outlines the code quality standards for the AI E-Learning Platform. All contributors must follow these guidelines to ensure consistent, maintainable, and high-quality code.

## 📦 Import Order Standards

### Python (Backend)
```python
"""
Module docstring
"""
# Standard library imports
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Third-party imports
import numpy as np
from fastapi import APIRouter, Depends
from pydantic import BaseModel

# Local application imports
from app.core.config import settings
from app.models.user import User
from app.services.course_service import CourseService
```

**Rules:**
1. Group imports into three sections: stdlib, third-party, local
2. Each section should be alphabetically sorted
3. Use absolute imports for local modules
4. One blank line between import sections

### TypeScript/JavaScript (Frontend)
```typescript
// React imports first
import React, { useState, useEffect } from 'react';

// Next.js imports
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Third-party imports
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Component imports
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Hook imports
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';

// Utility imports
import { formatDate } from '@/lib/utils';
import { validateEmail } from '@/lib/validators';

// Type imports
import type { User } from '@/types/user';
import type { Course } from '@/types/course';
```

**Rules:**
1. React imports always first
2. Next.js imports second
3. Third-party libraries third
4. Internal imports grouped by type (@/components, @/hooks, @/lib, @/types)
5. Type imports last
6. Blank line between each group

## 📝 Naming Conventions

### Python
- **Files**: `snake_case.py` (e.g., `course_service.py`)
- **Classes**: `PascalCase` (e.g., `CourseService`)
- **Functions**: `snake_case` (e.g., `get_user_courses`)
- **Variables**: `snake_case` (e.g., `user_id`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)
- **Private methods**: `_leading_underscore` (e.g., `_calculate_total`)

### TypeScript/JavaScript
- **Component files**: `PascalCase.tsx` (e.g., `CourseCard.tsx`)
- **Hook files**: `useCamelCase.ts` (e.g., `useAuth.ts`)
- **Utility files**: `camelCase.ts` (e.g., `formatters.ts`)
- **Components**: `PascalCase` (e.g., `VideoPlayer`)
- **Functions**: `camelCase` (e.g., `getUserCourses`)
- **Variables**: `camelCase` (e.g., `userId`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Types/Interfaces**: `PascalCase` (e.g., `UserProfile`)

## 🏗️ Code Structure

### Python Module Structure
```python
"""
Module docstring explaining purpose
"""
# Imports (following import order standards)

# Module-level constants
DEFAULT_TIMEOUT = 30

# Module-level variables (if needed)
logger = logging.getLogger(__name__)


class MainClass:
    """Class docstring"""
    
    def __init__(self):
        """Initialize the class"""
        pass
    
    def public_method(self):
        """Public method docstring"""
        pass
    
    def _private_method(self):
        """Private method docstring"""
        pass


# Module-level functions
def helper_function():
    """Function docstring"""
    pass


# Entry point (if applicable)
if __name__ == "__main__":
    main()
```

### React Component Structure
```typescript
// Imports (following import order standards)

// Types/Interfaces
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// Component
export const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // State declarations
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom hooks
  const { user } = useAuth();
  const router = useRouter();
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependency]);
  
  // Handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependency]);
  
  // Early returns
  if (isLoading) return <LoadingSpinner />;
  
  // Main render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

## 🔍 Type Safety

### Python Type Hints
```python
from typing import Dict, List, Optional, Union

def process_courses(
    courses: List[Course],
    user_id: str,
    filters: Optional[Dict[str, Any]] = None
) -> List[CourseResponse]:
    """Process courses with optional filters"""
    pass
```

### TypeScript Strict Types
```typescript
// Always use explicit types
const processData = (data: UserData): ProcessedData => {
  // Implementation
};

// Avoid 'any' type
// ❌ Bad
const handleResponse = (response: any) => {};

// ✅ Good
const handleResponse = (response: ApiResponse<User>) => {};
```

## 📊 Code Metrics

### Complexity Limits
- **Function length**: Max 50 lines (prefer 20-30)
- **File length**: Max 500 lines (prefer 200-300)
- **Cyclomatic complexity**: Max 10
- **Nesting depth**: Max 4 levels

### Line Length
- **Python**: 88 characters (Black formatter)
- **TypeScript**: 100 characters (Prettier)

## 🧪 Documentation Standards

### Python Docstrings
```python
def calculate_progress(
    user_id: str,
    course_id: str,
    include_quizzes: bool = True
) -> ProgressData:
    """
    Calculate user's progress in a course.
    
    Args:
        user_id: The ID of the user
        course_id: The ID of the course
        include_quizzes: Whether to include quiz scores in progress
        
    Returns:
        ProgressData object containing completion percentage and details
        
    Raises:
        NotFoundException: If user or course not found
        PermissionError: If user doesn't have access to course
    """
    pass
```

### TypeScript JSDoc
```typescript
/**
 * Calculate user's progress in a course
 * @param userId - The ID of the user
 * @param courseId - The ID of the course
 * @param includeQuizzes - Whether to include quiz scores
 * @returns Progress data with completion percentage
 */
export const calculateProgress = (
  userId: string,
  courseId: string,
  includeQuizzes = true
): ProgressData => {
  // Implementation
};
```

## 🚀 Performance Guidelines

### General Rules
1. **Avoid N+1 queries**: Use batch fetching
2. **Cache expensive operations**: Use memoization
3. **Lazy load when possible**: Don't load unnecessary data
4. **Optimize loops**: Use appropriate data structures

### Python Performance
```python
# ❌ Bad: N+1 query
for enrollment in enrollments:
    course = await Course.get(enrollment.course_id)
    
# ✅ Good: Batch fetch
course_ids = [e.course_id for e in enrollments]
courses = await Course.find({"_id": {"$in": course_ids}}).to_list()
```

### React Performance
```typescript
// ❌ Bad: Recreating functions on each render
<Button onClick={() => handleClick(item.id)}>Click</Button>

// ✅ Good: Memoized callback
const handleItemClick = useCallback((id: string) => {
  // Handle click
}, [dependency]);

<Button onClick={() => handleItemClick(item.id)}>Click</Button>
```

## 🛠️ Tools & Automation

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Linting Commands
```bash
# Backend
cd backend
black app/                    # Format Python code
isort app/                    # Sort imports
flake8 app/                   # Lint Python code
mypy app/                     # Type checking

# Frontend
cd frontend
npm run lint                  # ESLint
npm run format                # Prettier
npm run type-check            # TypeScript
```

### Code Quality Check
```bash
# Run comprehensive quality check
python backend/scripts/check_code_quality.py
```

## 📈 Continuous Improvement

### Code Review Checklist
- [ ] Imports follow the standard order
- [ ] Naming conventions are followed
- [ ] Functions have proper type hints/annotations
- [ ] Complex logic is documented
- [ ] No code duplication
- [ ] Error handling is comprehensive
- [ ] Performance considerations addressed
- [ ] Tests are included for new features

### Quality Metrics to Track
1. **Code coverage**: Maintain >80%
2. **Linting errors**: Zero tolerance
3. **Type coverage**: 100% for new code
4. **Documentation coverage**: All public APIs
5. **Performance benchmarks**: Meet SLA requirements

## 🔄 Migration Guide

### Fixing Import Orders
```bash
# Backend - Auto-fix with isort
isort app/ --profile black

# Frontend - Auto-fix with ESLint
npm run lint:fix
```

### Updating Naming Conventions
1. Use IDE refactoring tools
2. Update imports across codebase
3. Run tests to ensure nothing breaks
4. Update documentation

---

**Remember**: Consistency is key! When in doubt, follow existing patterns in the codebase.