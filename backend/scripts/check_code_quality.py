#!/usr/bin/env python3
"""
Code quality checker script.
Checks import order, naming conventions, and code standards.
"""
# Standard library imports
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Constants
BACKEND_ROOT = Path(__file__).parent.parent
FRONTEND_ROOT = BACKEND_ROOT.parent / "frontend"

# Patterns
IMPORT_ORDER_PATTERN = r"^(# Standard library imports|# Third-party imports|# Local application imports)"
PYTHON_FILE_PATTERN = r"\.py$"
TYPESCRIPT_FILE_PATTERN = r"\.(ts|tsx)$"


class CodeQualityChecker:
    """Check code quality standards across the project."""
    
    def __init__(self):
        self.issues: List[Dict[str, str]] = []
        
    def check_python_imports(self, file_path: Path) -> List[str]:
        """Check Python file import order."""
        issues = []
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
        
        import_sections = {
            'stdlib': [],
            'third_party': [],
            'local': []
        }
        
        current_section = None
        in_imports = False
        
        for i, line in enumerate(lines):
            if line.strip().startswith(('import ', 'from ')):
                in_imports = True
                
                # Determine section
                if line.startswith('from app.') or line.startswith('import app.'):
                    current_section = 'local'
                elif line.startswith(('from .', 'import .')):
                    current_section = 'local'
                elif any(line.startswith(f'from {lib}') or line.startswith(f'import {lib}') 
                        for lib in ['fastapi', 'pydantic', 'beanie', 'motor', 'stripe']):
                    current_section = 'third_party'
                else:
                    # Check if it's a known stdlib module
                    module = line.split()[1].split('.')[0]
                    if module in ['os', 'sys', 'time', 'datetime', 'json', 'logging', 
                                 'typing', 'pathlib', 're', 'asyncio', 'functools']:
                        current_section = 'stdlib'
                    else:
                        current_section = 'third_party'
                
                import_sections[current_section].append((i + 1, line))
            
            elif in_imports and line.strip() == '':
                # Empty line might indicate end of imports
                pass
            elif in_imports and not line.strip().startswith(('#', '"', "'")):
                # Non-import, non-comment line - imports have ended
                in_imports = False
        
        # Check order
        if import_sections['local'] and import_sections['third_party']:
            if import_sections['local'][0][0] < import_sections['third_party'][-1][0]:
                issues.append(f"Local imports before third-party imports at line {import_sections['local'][0][0]}")
        
        if import_sections['third_party'] and import_sections['stdlib']:
            if import_sections['third_party'][0][0] < import_sections['stdlib'][-1][0]:
                issues.append(f"Third-party imports before stdlib imports at line {import_sections['third_party'][0][0]}")
        
        return issues
    
    def check_python_naming(self, file_path: Path) -> List[str]:
        """Check Python naming conventions."""
        issues = []
        
        # Check filename
        filename = file_path.name
        if not re.match(r'^[a-z_]+\.py$', filename) and filename != '__init__.py':
            issues.append(f"File name should be snake_case: {filename}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check class names (should be PascalCase)
        class_pattern = r'^class\s+([a-zA-Z_]\w*)'
        for match in re.finditer(class_pattern, content, re.MULTILINE):
            class_name = match.group(1)
            if not re.match(r'^[A-Z][a-zA-Z0-9]*$', class_name):
                line_no = content[:match.start()].count('\n') + 1
                issues.append(f"Line {line_no}: Class name should be PascalCase: {class_name}")
        
        # Check function names (should be snake_case)
        func_pattern = r'^(?:async\s+)?def\s+([a-zA-Z_]\w*)'
        for match in re.finditer(func_pattern, content, re.MULTILINE):
            func_name = match.group(1)
            if not re.match(r'^[a-z_][a-z0-9_]*$', func_name) and not func_name.startswith('__'):
                line_no = content[:match.start()].count('\n') + 1
                issues.append(f"Line {line_no}: Function name should be snake_case: {func_name}")
        
        return issues
    
    def check_typescript_imports(self, file_path: Path) -> List[str]:
        """Check TypeScript/TSX file import order."""
        issues = []
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
        
        import_groups = {
            'react': [],
            'next': [],
            'third_party': [],
            'components': [],
            'hooks': [],
            'lib': [],
            'types': [],
            'relative': []
        }
        
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                if 'react' in line:
                    import_groups['react'].append((i + 1, line))
                elif 'next/' in line:
                    import_groups['next'].append((i + 1, line))
                elif '@/components' in line:
                    import_groups['components'].append((i + 1, line))
                elif '@/hooks' in line:
                    import_groups['hooks'].append((i + 1, line))
                elif '@/lib' in line:
                    import_groups['lib'].append((i + 1, line))
                elif '@/types' in line:
                    import_groups['types'].append((i + 1, line))
                elif line.startswith("import './") or line.startswith('import "../'):
                    import_groups['relative'].append((i + 1, line))
                else:
                    import_groups['third_party'].append((i + 1, line))
        
        # Check order
        expected_order = ['react', 'next', 'third_party', 'components', 'hooks', 'lib', 'types', 'relative']
        last_line = 0
        
        for group in expected_order:
            if import_groups[group]:
                first_line = import_groups[group][0][0]
                if first_line < last_line:
                    issues.append(f"Import order violation: {group} imports at line {first_line} should come after previous group")
                last_line = max(line[0] for line in import_groups[group])
        
        return issues
    
    def check_typescript_naming(self, file_path: Path) -> List[str]:
        """Check TypeScript naming conventions."""
        issues = []
        
        # Check component files (should be PascalCase)
        filename = file_path.stem
        if file_path.parent.name in ['components', 'ui', 'feature', 'layout']:
            if not re.match(r'^[A-Z][a-zA-Z0-9]*$', filename) and filename != 'index':
                issues.append(f"Component file should be PascalCase: {filename}")
        
        # Check hook files (should start with 'use')
        if file_path.parent.name == 'hooks':
            if not filename.startswith('use'):
                issues.append(f"Hook file should start with 'use': {filename}")
        
        return issues
    
    def check_file(self, file_path: Path) -> None:
        """Check a single file for quality issues."""
        relative_path = file_path.relative_to(file_path.parent.parent.parent)
        
        try:
            if re.search(PYTHON_FILE_PATTERN, str(file_path)):
                # Python checks
                import_issues = self.check_python_imports(file_path)
                naming_issues = self.check_python_naming(file_path)
                
                for issue in import_issues + naming_issues:
                    self.issues.append({
                        'file': str(relative_path),
                        'issue': issue,
                        'type': 'python'
                    })
                    
            elif re.search(TYPESCRIPT_FILE_PATTERN, str(file_path)):
                # TypeScript checks
                import_issues = self.check_typescript_imports(file_path)
                naming_issues = self.check_typescript_naming(file_path)
                
                for issue in import_issues + naming_issues:
                    self.issues.append({
                        'file': str(relative_path),
                        'issue': issue,
                        'type': 'typescript'
                    })
                    
        except Exception as e:
            self.issues.append({
                'file': str(relative_path),
                'issue': f"Error checking file: {e}",
                'type': 'error'
            })
    
    def check_directory(self, directory: Path, exclude_dirs: List[str] = None) -> None:
        """Recursively check all files in directory."""
        exclude_dirs = exclude_dirs or ['venv', '.venv', 'node_modules', '__pycache__', '.git']
        
        for item in directory.rglob('*'):
            # Skip excluded directories
            if any(excluded in item.parts for excluded in exclude_dirs):
                continue
                
            if item.is_file():
                self.check_file(item)
    
    def print_report(self) -> None:
        """Print quality check report."""
        if not self.issues:
            print("✅ No code quality issues found!")
            return
        
        print(f"\n❌ Found {len(self.issues)} code quality issues:\n")
        
        # Group by file
        issues_by_file = {}
        for issue in self.issues:
            file_path = issue['file']
            if file_path not in issues_by_file:
                issues_by_file[file_path] = []
            issues_by_file[file_path].append(issue['issue'])
        
        # Print issues
        for file_path, file_issues in sorted(issues_by_file.items()):
            print(f"\n📄 {file_path}:")
            for issue in file_issues:
                print(f"   - {issue}")
        
        # Summary
        python_issues = [i for i in self.issues if i['type'] == 'python']
        ts_issues = [i for i in self.issues if i['type'] == 'typescript']
        
        print(f"\n📊 Summary:")
        print(f"   - Python issues: {len(python_issues)}")
        print(f"   - TypeScript issues: {len(ts_issues)}")
        print(f"   - Total issues: {len(self.issues)}")


def main():
    """Main function."""
    checker = CodeQualityChecker()
    
    print("🔍 Checking code quality...")
    print(f"   Backend: {BACKEND_ROOT}")
    print(f"   Frontend: {FRONTEND_ROOT}")
    
    # Check backend
    print("\n📦 Checking backend code...")
    checker.check_directory(BACKEND_ROOT / "app")
    
    # Check frontend
    print("\n📦 Checking frontend code...")
    if FRONTEND_ROOT.exists():
        for subdir in ['components', 'hooks', 'lib', 'app']:
            subdir_path = FRONTEND_ROOT / subdir
            if subdir_path.exists():
                checker.check_directory(subdir_path)
    
    # Print report
    checker.print_report()
    
    # Exit with error code if issues found
    sys.exit(1 if checker.issues else 0)


if __name__ == "__main__":
    main()