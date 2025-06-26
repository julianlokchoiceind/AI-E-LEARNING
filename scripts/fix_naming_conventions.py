#!/usr/bin/env python3
"""
Script to fix naming convention issues across the codebase.
"""
# Standard library imports
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Constants
PROJECT_ROOT = Path(__file__).parent.parent
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
BACKEND_ROOT = PROJECT_ROOT / "backend"


class NamingConventionFixer:
    """Fix naming convention issues in the codebase."""
    
    def __init__(self):
        self.renames: List[Tuple[Path, Path]] = []
        self.import_updates: Dict[str, str] = {}
        
    def to_pascal_case(self, name: str) -> str:
        """Convert kebab-case or snake_case to PascalCase."""
        # Remove file extension
        name_without_ext = name.rsplit('.', 1)[0]
        ext = name.rsplit('.', 1)[1] if '.' in name else ''
        
        # Convert to PascalCase
        parts = re.split(r'[-_]', name_without_ext)
        pascal_name = ''.join(part.capitalize() for part in parts)
        
        return f"{pascal_name}.{ext}" if ext else pascal_name
    
    def check_react_component_file(self, file_path: Path) -> Optional[Path]:
        """Check if a React component file needs renaming."""
        filename = file_path.name
        
        # Skip test files, config files, and other non-component files
        skip_patterns = [
            r'^index\.',
            r'\.test\.',
            r'\.spec\.',
            r'\.config\.',
            r'\.stories\.',
            r'^_',
            r'^\.',
        ]
        
        if any(re.match(pattern, filename) for pattern in skip_patterns):
            return None
        
        # Check if it's a component file that needs renaming
        if file_path.parent.name in ['components', 'ui', 'feature', 'layout', 'providers']:
            if not re.match(r'^[A-Z][a-zA-Z0-9]*\.(tsx?|jsx?)$', filename):
                new_name = self.to_pascal_case(filename)
                new_path = file_path.parent / new_name
                return new_path
        
        # Check hook files
        if file_path.parent.name == 'hooks':
            if not filename.startswith('use'):
                # Hooks should start with 'use' but still be camelCase
                name_without_ext = filename.rsplit('.', 1)[0]
                ext = filename.rsplit('.', 1)[1]
                new_name = f"use{name_without_ext.capitalize()}.{ext}"
                new_path = file_path.parent / new_name
                return new_path
        
        return None
    
    def check_python_file(self, file_path: Path) -> Optional[Path]:
        """Check if a Python file needs renaming."""
        filename = file_path.name
        
        # Skip special files
        if filename in ['__init__.py', '__main__.py']:
            return None
        
        # Check if it follows snake_case
        if not re.match(r'^[a-z][a-z0-9_]*\.py$', filename):
            # Convert to snake_case
            name_without_ext = filename.rsplit('.', 1)[0]
            
            # Convert PascalCase or camelCase to snake_case
            snake_name = re.sub(r'(?<!^)(?=[A-Z])', '_', name_without_ext).lower()
            new_path = file_path.parent / f"{snake_name}.py"
            return new_path
        
        return None
    
    def find_files_to_rename(self) -> None:
        """Find all files that need renaming."""
        # Check frontend files
        if FRONTEND_ROOT.exists():
            for pattern in ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js']:
                for file_path in FRONTEND_ROOT.glob(pattern):
                    if 'node_modules' in file_path.parts:
                        continue
                    
                    new_path = self.check_react_component_file(file_path)
                    if new_path and new_path != file_path:
                        self.renames.append((file_path, new_path))
                        
                        # Track import updates needed
                        old_import = str(file_path.relative_to(FRONTEND_ROOT))
                        new_import = str(new_path.relative_to(FRONTEND_ROOT))
                        self.import_updates[old_import] = new_import
        
        # Check backend files
        if BACKEND_ROOT.exists():
            for file_path in BACKEND_ROOT.glob('**/*.py'):
                if any(skip in file_path.parts for skip in ['venv', '.venv', '__pycache__']):
                    continue
                
                new_path = self.check_python_file(file_path)
                if new_path and new_path != file_path:
                    self.renames.append((file_path, new_path))
    
    def update_imports_in_file(self, file_path: Path) -> bool:
        """Update imports in a file to match renamed files."""
        if not file_path.is_file():
            return False
        
        try:
            content = file_path.read_text(encoding='utf-8')
            original_content = content
            
            # Update imports for renamed files
            for old_name, new_name in self.import_updates.items():
                # Handle different import patterns
                patterns = [
                    # TypeScript/JavaScript imports
                    (rf"from\s+['\"]([^'\"]*/{re.escape(old_name.rsplit('.', 1)[0])})['\"]",
                     lambda m: f"from '{m.group(1).replace(old_name.rsplit('.', 1)[0], new_name.rsplit('.', 1)[0])}'"),
                    
                    (rf"import\s+.*\s+from\s+['\"]([^'\"]*/{re.escape(old_name.rsplit('.', 1)[0])})['\"]",
                     lambda m: m.group(0).replace(old_name.rsplit('.', 1)[0], new_name.rsplit('.', 1)[0])),
                    
                    # Python imports
                    (rf"from\s+([^\s]+)\.{re.escape(old_name.rsplit('.', 1)[0])}\s+import",
                     lambda m: f"from {m.group(1)}.{new_name.rsplit('.', 1)[0]} import"),
                    
                    (rf"import\s+([^\s]+)\.{re.escape(old_name.rsplit('.', 1)[0])}",
                     lambda m: f"import {m.group(1)}.{new_name.rsplit('.', 1)[0]}"),
                ]
                
                for pattern, replacement in patterns:
                    content = re.sub(pattern, replacement, content)
            
            if content != original_content:
                file_path.write_text(content, encoding='utf-8')
                return True
            
            return False
            
        except Exception as e:
            print(f"   ⚠️  Error updating {file_path}: {e}")
            return False
    
    def execute_renames(self, dry_run: bool = False) -> None:
        """Execute the file renames."""
        if not self.renames:
            print("✅ No files need renaming!")
            return
        
        print(f"\n{'🔍' if dry_run else '🔧'} {'Would rename' if dry_run else 'Renaming'} {len(self.renames)} files:\n")
        
        for old_path, new_path in self.renames:
            rel_old = old_path.relative_to(PROJECT_ROOT)
            rel_new = new_path.relative_to(PROJECT_ROOT)
            print(f"   {rel_old} → {rel_new}")
            
            if not dry_run:
                try:
                    old_path.rename(new_path)
                except Exception as e:
                    print(f"   ⚠️  Error: {e}")
        
        if not dry_run and self.import_updates:
            print(f"\n🔄 Updating imports in files...")
            
            # Update imports in all relevant files
            updated_count = 0
            for pattern in ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js', '**/*.py']:
                for file_path in PROJECT_ROOT.glob(pattern):
                    if any(skip in file_path.parts for skip in ['node_modules', 'venv', '.venv', '__pycache__']):
                        continue
                    
                    if self.update_imports_in_file(file_path):
                        updated_count += 1
            
            print(f"   Updated imports in {updated_count} files")
    
    def generate_report(self) -> None:
        """Generate a report of naming convention issues."""
        print("\n📊 Naming Convention Report\n")
        
        if not self.renames:
            print("✅ All files follow naming conventions!")
        else:
            # Group by type
            frontend_renames = [(old, new) for old, new in self.renames if 'frontend' in str(old)]
            backend_renames = [(old, new) for old, new in self.renames if 'backend' in str(old)]
            
            if frontend_renames:
                print(f"📦 Frontend issues ({len(frontend_renames)} files):")
                for old, new in frontend_renames[:10]:  # Show first 10
                    print(f"   - {old.name} → {new.name}")
                if len(frontend_renames) > 10:
                    print(f"   ... and {len(frontend_renames) - 10} more")
            
            if backend_renames:
                print(f"\n📦 Backend issues ({len(backend_renames)} files):")
                for old, new in backend_renames[:10]:  # Show first 10
                    print(f"   - {old.name} → {new.name}")
                if len(backend_renames) > 10:
                    print(f"   ... and {len(backend_renames) - 10} more")
        
        print(f"\n📈 Summary:")
        print(f"   Total files to rename: {len(self.renames)}")
        print(f"   Import updates needed: {len(self.import_updates)}")


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fix naming convention issues')
    parser.add_argument('--dry-run', '-n', action='store_true', 
                       help='Show what would be renamed without actually renaming')
    parser.add_argument('--report', '-r', action='store_true',
                       help='Generate a report without making changes')
    
    args = parser.parse_args()
    
    fixer = NamingConventionFixer()
    
    print("🔍 Scanning for naming convention issues...")
    fixer.find_files_to_rename()
    
    if args.report:
        fixer.generate_report()
    else:
        fixer.execute_renames(dry_run=args.dry_run)
        
        if args.dry_run:
            print("\n💡 Run without --dry-run to apply changes")


if __name__ == "__main__":
    main()