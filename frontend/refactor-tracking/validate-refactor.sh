#!/bin/bash

# Validate AS ANY Refactor Progress
# Run this script to check refactor status

echo "🔍 AS ANY Refactor Validation"
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Count total 'as any' occurrences (excluding node_modules)
TOTAL=$(grep -r "as any" ../.. --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" 2>/dev/null | wc -l)

echo -e "\n📊 Current Status:"
echo "Total 'as any' found: $TOTAL"

# Check by directory
echo -e "\n📁 By Directory:"
grep -r "as any" ../.. --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" 2>/dev/null | cut -d: -f1 | xargs dirname | sort | uniq -c | sort -nr

# Show files with most occurrences
echo -e "\n📄 Files with most 'as any':"
grep -r "as any" ../.. --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" 2>/dev/null | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

# Type check
echo -e "\n🔧 Running TypeScript check..."
cd ../..
if npx tsc --noEmit --skipLibCheck false 2>/dev/null; then
    echo -e "${GREEN}✅ No TypeScript errors${NC}"
else
    echo -e "${RED}❌ TypeScript errors found${NC}"
fi

# Check if new type files exist
echo -e "\n📝 Checking new type files:"
TYPE_FILES=(
    "types/browser.d.ts"
    "lib/types/forms.ts"
    "lib/types/auth.ts"
)

for file in "${TYPE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $file missing${NC}"
    fi
done

# Show specific patterns
echo -e "\n🎯 Specific patterns found:"
echo -n "Navigator casts: "
grep -r "navigator as any" ../.. --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" 2>/dev/null | wc -l

echo -n "Response.data casts: "
grep -r "\.data as any" ../.. --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" 2>/dev/null | wc -l

echo -n "Error casts: "
grep -r "catch.*any" ../.. --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" --exclude-dir=".next" 2>/dev/null | wc -l

# Progress calculation
ORIGINAL=82
if [ $TOTAL -eq 0 ]; then
    echo -e "\n${GREEN}🎉 COMPLETE! All 'as any' removed!${NC}"
else
    COMPLETED=$((ORIGINAL - TOTAL))
    PERCENT=$((COMPLETED * 100 / ORIGINAL))
    echo -e "\n📈 Progress: $COMPLETED/$ORIGINAL ($PERCENT%)"
    echo -e "Remaining: ${RED}$TOTAL${NC}"
fi

echo -e "\n============================"
