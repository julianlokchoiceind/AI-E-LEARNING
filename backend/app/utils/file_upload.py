"""
File upload service with validation, naming, and storage integration.
Handles file uploads with automatic 'ait-' prefix naming convention.
"""
import os
import re
import magic
import hashlib
from typing import Optional, List, Tuple, BinaryIO
from pathlib import Path
from datetime import datetime

# Third-party imports
try:
    from unidecode import unidecode
    HAS_UNIDECODE = True
except ImportError:
    HAS_UNIDECODE = False

from fastapi import UploadFile, HTTPException

from .storage import StorageBackend


class FileUploadService:
    """Service for handling file uploads with validation and storage."""
    
    def __init__(
        self,
        storage: StorageBackend,
        max_file_size: int = 10 * 1024 * 1024,  # 10MB default
        allowed_extensions: Optional[List[str]] = None,
        allowed_mime_types: Optional[List[str]] = None
    ):
        """
        Initialize file upload service.
        
        Args:
            storage: Storage backend instance
            max_file_size: Maximum file size in bytes
            allowed_extensions: List of allowed file extensions (e.g., ['.pdf', '.doc'])
            allowed_mime_types: List of allowed MIME types
        """
        self.storage = storage
        self.max_file_size = max_file_size
        
        # Default allowed extensions for lesson resources
        if allowed_extensions is None:
            self.allowed_extensions = [
                '.pdf', '.doc', '.docx', '.zip', '.rar',
                '.jpg', '.jpeg', '.png', '.gif', '.webp',
                '.txt', '.md', '.py', '.js', '.html', '.css'
            ]
        else:
            self.allowed_extensions = [ext.lower() for ext in allowed_extensions]
        
        # Default allowed MIME types
        if allowed_mime_types is None:
            self.allowed_mime_types = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/zip',
                'application/x-rar-compressed',
                'image/jpeg',
                'image/png', 
                'image/gif',
                'image/webp',
                'text/plain',
                'text/markdown',
                'text/x-python',
                'application/javascript',
                'text/html',
                'text/css'
            ]
        else:
            self.allowed_mime_types = allowed_mime_types
    
    def generate_filename(self, original_filename: str, context: str = "lesson") -> str:
        """
        Generate filename with 'ait-' prefix and sanitization.
        
        Format: ait-{sanitized-original-name}.{ext}
        
        Examples:
            "Python Basics.pdf" → "ait-python-basics.pdf"
            "Code_Examples.zip" → "ait-code-examples.zip"
            "學習資料.doc" → "ait-learning-materials.doc"
            
        Args:
            original_filename: Original filename from upload
            context: Context for the file (e.g., "lesson", "avatar", "thumbnail")
            
        Returns:
            Sanitized filename with ait- prefix
        """
        # Extract name and extension
        name, ext = os.path.splitext(original_filename)
        ext = ext.lower()
        
        # Convert unicode to ASCII if possible
        if HAS_UNIDECODE:
            name = unidecode(name)
        
        # Sanitize filename: lowercase, replace special chars with hyphens
        sanitized_name = re.sub(r'[^a-zA-Z0-9\-_]', '-', name.lower())
        
        # Remove multiple consecutive hyphens and trim
        sanitized_name = re.sub(r'-+', '-', sanitized_name).strip('-')
        
        # Ensure name is not empty
        if not sanitized_name:
            sanitized_name = "file"
        
        # Limit length to avoid filesystem issues
        if len(sanitized_name) > 50:
            sanitized_name = sanitized_name[:50].rstrip('-')
        
        # Generate final filename with prefix
        return f"ait-{sanitized_name}{ext}"
    
    def get_file_path(self, filename: str, context: str = "lesson-resources") -> str:
        """
        Generate full file path for storage.
        
        Args:
            filename: Generated filename
            context: Storage context/subdirectory
            
        Returns:
            Full path for storage (e.g., "lesson-resources/ait-python-basics.pdf")
        """
        return f"{context}/{filename}"
    
    async def validate_file(self, file: UploadFile) -> Tuple[bool, Optional[str]]:
        """
        Validate uploaded file.
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check file size
        if file.size and file.size > self.max_file_size:
            return False, f"File size ({file.size} bytes) exceeds maximum allowed size ({self.max_file_size} bytes)"
        
        # Check file extension
        if file.filename:
            _, ext = os.path.splitext(file.filename)
            if ext.lower() not in self.allowed_extensions:
                return False, f"File extension '{ext}' is not allowed. Allowed extensions: {', '.join(self.allowed_extensions)}"
        
        # Check MIME type if available
        if file.content_type and file.content_type not in self.allowed_mime_types:
            return False, f"File type '{file.content_type}' is not allowed"
        
        # Additional security check: validate file content matches extension
        try:
            # Read first chunk to check file magic
            file_content = await file.read(8192)  # Read first 8KB
            await file.seek(0)  # Reset file pointer
            
            # Use python-magic to detect actual file type
            try:
                detected_mime = magic.from_buffer(file_content, mime=True)
                
                # For common file types, ensure detected type matches expected
                if file.content_type and detected_mime:
                    # Allow some flexibility for text files and common formats
                    if not self._mime_types_compatible(file.content_type, detected_mime):
                        return False, f"File content ({detected_mime}) doesn't match declared type ({file.content_type})"
                        
            except Exception:
                # If magic detection fails, continue with other validations
                pass
                
        except Exception as e:
            return False, f"Error reading file: {str(e)}"
        
        return True, None
    
    def _mime_types_compatible(self, declared: str, detected: str) -> bool:
        """
        Check if declared and detected MIME types are compatible.
        
        Args:
            declared: MIME type from file upload
            detected: MIME type detected by python-magic
            
        Returns:
            True if types are compatible
        """
        # Exact match
        if declared == detected:
            return True
        
        # Common compatible types
        compatible_types = {
            'application/pdf': ['application/pdf'],
            'application/zip': ['application/zip', 'application/x-zip-compressed'],
            'image/jpeg': ['image/jpeg', 'image/jpg'],
            'image/png': ['image/png'],
            'text/plain': ['text/plain', 'text/x-python', 'application/javascript'],
            'application/msword': ['application/msword', 'application/x-ole-storage'],
        }
        
        # Check if detected type is in compatible list for declared type
        if declared in compatible_types:
            return detected in compatible_types[declared]
        
        # For unknown types, be more permissive
        return True
    
    async def upload_file(
        self,
        file: UploadFile,
        context: str = "lesson-resources",
        custom_filename: Optional[str] = None
    ) -> dict:
        """
        Upload file with validation and storage.
        
        Args:
            file: FastAPI UploadFile object
            context: Storage context (subdirectory)
            custom_filename: Custom filename (optional, will still get ait- prefix)
            
        Returns:
            Dict with upload result containing URL, filename, size, etc.
        """
        # Validate file
        is_valid, error_message = await self.validate_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        try:
            # Generate filename
            if custom_filename:
                filename = self.generate_filename(custom_filename, context)
            else:
                filename = self.generate_filename(file.filename or "file", context)
            
            # Get full storage path
            file_path = self.get_file_path(filename, context)
            
            # Read file content
            file_content = await file.read()
            
            # Calculate file hash for integrity
            file_hash = hashlib.md5(file_content).hexdigest()
            
            # Upload to storage
            public_url = await self.storage.upload_file(file_content, file_path)
            
            # Return upload result
            return {
                "success": True,
                "filename": filename,
                "original_filename": file.filename,
                "file_path": file_path,
                "url": public_url,
                "size": len(file_content),
                "content_type": file.content_type,
                "hash": file_hash,
                "context": context,
                "uploaded_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
        finally:
            # Always reset file pointer for potential reuse
            await file.seek(0)
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete file from storage.
        
        Args:
            file_path: Full path to file in storage
            
        Returns:
            True if deletion successful
        """
        try:
            return await self.storage.delete_file(file_path)
        except Exception:
            return False
    
    async def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get file information from storage.
        
        Args:
            file_path: Full path to file in storage
            
        Returns:
            File information dict or None if not found
        """
        try:
            return await self.storage.get_file_info(file_path)
        except Exception:
            return None
    
    def get_upload_constraints(self) -> dict:
        """
        Get upload constraints for frontend validation.
        
        Returns:
            Dict with max size, allowed extensions, etc.
        """
        return {
            "max_file_size": self.max_file_size,
            "max_file_size_mb": round(self.max_file_size / (1024 * 1024), 1),
            "allowed_extensions": self.allowed_extensions,
            "allowed_mime_types": self.allowed_mime_types
        }


# Utility functions for common use cases
def get_display_title_from_filename(filename: str) -> str:
    """
    Generate display title from filename.
    
    Examples:
        "ait-python-basics.pdf" → "Python Basics"
        "ait-machine-learning-guide.docx" → "Machine Learning Guide"
        
    Args:
        filename: Generated filename with ait- prefix
        
    Returns:
        Human-readable title
    """
    # Remove ait- prefix and extension
    name = filename
    if name.startswith('ait-'):
        name = name[4:]  # Remove 'ait-' prefix
    
    name, _ = os.path.splitext(name)  # Remove extension
    
    # Convert hyphens to spaces and title case
    title = name.replace('-', ' ').replace('_', ' ')
    title = ' '.join(word.capitalize() for word in title.split())
    
    return title


def validate_url_format(url: str) -> Tuple[bool, Optional[str]]:
    """
    Validate URL format (no accessibility check).
    
    Args:
        url: URL string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not url or not url.strip():
        return False, "URL cannot be empty"
    
    url = url.strip()
    
    # Basic URL format validation
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    if not url_pattern.match(url):
        return False, "Invalid URL format. Please enter a valid HTTP or HTTPS URL"
    
    # Check URL length
    if len(url) > 2000:
        return False, "URL is too long (maximum 2000 characters)"
    
    return True, None


def sanitize_resource_title(title: str) -> str:
    """
    Sanitize user-provided resource title.
    
    Args:
        title: Raw title from user input
        
    Returns:
        Sanitized title
    """
    if not title or not title.strip():
        return "Untitled Resource"
    
    # Remove excessive whitespace
    title = ' '.join(title.strip().split())
    
    # Limit length
    if len(title) > 200:
        title = title[:200].rstrip()
    
    return title