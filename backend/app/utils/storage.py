"""
Storage abstraction layer for file uploads.
Supports local storage (development) and cloud storage (production).
"""
import os
import asyncio
from abc import ABC, abstractmethod
from typing import Optional, Tuple
from pathlib import Path

# Third-party imports for cloud storage (optional)
try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

try:
    from google.cloud import storage as gcs
    HAS_GCS = True
except ImportError:
    HAS_GCS = False


class StorageBackend(ABC):
    """Abstract base class for storage backends."""
    
    @abstractmethod
    async def upload_file(self, file_data: bytes, file_path: str) -> str:
        """
        Upload file and return public URL.
        
        Args:
            file_data: File content as bytes
            file_path: Relative path for the file (e.g., "lesson-resources/ait-python-basics.pdf")
            
        Returns:
            Public URL to access the file
        """
        pass
    
    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete file from storage.
        
        Args:
            file_path: Relative path to the file
            
        Returns:
            True if deletion successful, False otherwise
        """
        pass
    
    @abstractmethod
    async def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists in storage.
        
        Args:
            file_path: Relative path to the file
            
        Returns:
            True if file exists, False otherwise
        """
        pass
    
    @abstractmethod
    async def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get file information (size, modified date, etc.).
        
        Args:
            file_path: Relative path to the file
            
        Returns:
            Dict with file info or None if file doesn't exist
        """
        pass


class LocalStorage(StorageBackend):
    """Local filesystem storage implementation."""
    
    def __init__(self, upload_dir: str = "/app/uploads", url_prefix: str = "/uploads", base_url: str = ""):
        """
        Initialize local storage.
        
        Args:
            upload_dir: Local directory to store uploaded files
            url_prefix: URL prefix for serving files
            base_url: Base URL for constructing full URLs (e.g., http://localhost:8000)
        """
        self.upload_dir = Path(upload_dir)
        self.url_prefix = url_prefix.rstrip('/')
        self.base_url = base_url.rstrip('/') if base_url else ""
        
        # Create upload directory if it doesn't exist
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories for organization
        subdirs = [
            "lesson-resources",
            "user-avatars", 
            "course-thumbnails",
            "certificates"
        ]
        
        for subdir in subdirs:
            (self.upload_dir / subdir).mkdir(parents=True, exist_ok=True)
    
    async def upload_file(self, file_data: bytes, file_path: str) -> str:
        """Upload file to local filesystem."""
        try:
            full_path = self.upload_dir / file_path
            
            # Create parent directories if they don't exist
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file data - use regular function, not async
            def write_file():
                with open(full_path, 'wb') as f:
                    f.write(file_data)
            
            # Run in thread pool to avoid blocking
            await asyncio.get_event_loop().run_in_executor(None, write_file)
            
            # Return public URL - include base URL if configured
            if self.base_url:
                return f"{self.base_url}{self.url_prefix}/{file_path}"
            else:
                return f"{self.url_prefix}/{file_path}"
            
        except Exception as e:
            raise Exception(f"Failed to upload file to local storage: {str(e)}")
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from local filesystem."""
        try:
            full_path = self.upload_dir / file_path
            
            if full_path.exists() and full_path.is_file():
                await asyncio.get_event_loop().run_in_executor(None, full_path.unlink)
                return True
            
            return False  # File doesn't exist
            
        except Exception:
            return False
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if file exists in local filesystem."""
        full_path = self.upload_dir / file_path
        return full_path.exists() and full_path.is_file()
    
    async def get_file_info(self, file_path: str) -> Optional[dict]:
        """Get file information from local filesystem."""
        try:
            full_path = self.upload_dir / file_path
            
            if not full_path.exists():
                return None
                
            stat = full_path.stat()
            
            # Return URL with base URL if configured
            if self.base_url:
                url = f"{self.base_url}{self.url_prefix}/{file_path}"
            else:
                url = f"{self.url_prefix}/{file_path}"
                
            return {
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "path": str(full_path),
                "url": url
            }
            
        except Exception:
            return None


class S3Storage(StorageBackend):
    """AWS S3 storage implementation."""
    
    def __init__(self, bucket_name: str, region: str = "us-east-1", 
                 access_key: Optional[str] = None, secret_key: Optional[str] = None):
        """
        Initialize S3 storage.
        
        Args:
            bucket_name: S3 bucket name
            region: AWS region
            access_key: AWS access key (optional, can use IAM roles)
            secret_key: AWS secret key (optional, can use IAM roles)
        """
        if not HAS_BOTO3:
            raise ImportError("boto3 is required for S3 storage. Install with: pip install boto3")
            
        self.bucket_name = bucket_name
        self.region = region
        
        # Initialize S3 client
        if access_key and secret_key:
            self.s3_client = boto3.client(
                's3',
                region_name=region,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key
            )
        else:
            # Use default credentials (IAM roles, ~/.aws/credentials, etc.)
            self.s3_client = boto3.client('s3', region_name=region)
    
    async def upload_file(self, file_data: bytes, file_path: str) -> str:
        """Upload file to S3."""
        try:
            # Upload to S3
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=file_path,
                    Body=file_data,
                    ContentType=self._get_content_type(file_path)
                )
            )
            
            # Return public URL
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{file_path}"
            
        except ClientError as e:
            raise Exception(f"Failed to upload file to S3: {str(e)}")
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from S3."""
        try:
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=file_path
                )
            )
            return True
            
        except ClientError:
            return False
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if file exists in S3."""
        try:
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3_client.head_object(
                    Bucket=self.bucket_name,
                    Key=file_path
                )
            )
            return True
            
        except ClientError:
            return False
    
    async def get_file_info(self, file_path: str) -> Optional[dict]:
        """Get file information from S3."""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3_client.head_object(
                    Bucket=self.bucket_name,
                    Key=file_path
                )
            )
            
            return {
                "size": response['ContentLength'],
                "modified": response['LastModified'].timestamp(),
                "etag": response['ETag'],
                "url": f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{file_path}"
            }
            
        except ClientError:
            return None
    
    def _get_content_type(self, file_path: str) -> str:
        """Get content type based on file extension."""
        extension = Path(file_path).suffix.lower()
        
        content_types = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.zip': 'application/zip',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.txt': 'text/plain'
        }
        
        return content_types.get(extension, 'application/octet-stream')


class GoogleCloudStorage(StorageBackend):
    """Google Cloud Storage implementation."""
    
    def __init__(self, bucket_name: str, project_id: Optional[str] = None):
        """
        Initialize Google Cloud Storage.
        
        Args:
            bucket_name: GCS bucket name
            project_id: Google Cloud project ID (optional)
        """
        if not HAS_GCS:
            raise ImportError("google-cloud-storage is required for GCS. Install with: pip install google-cloud-storage")
            
        self.bucket_name = bucket_name
        self.client = gcs.Client(project=project_id)
        self.bucket = self.client.bucket(bucket_name)
    
    async def upload_file(self, file_data: bytes, file_path: str) -> str:
        """Upload file to Google Cloud Storage."""
        try:
            blob = self.bucket.blob(file_path)
            
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: blob.upload_from_string(
                    file_data,
                    content_type=self._get_content_type(file_path)
                )
            )
            
            # Return public URL
            return f"https://storage.googleapis.com/{self.bucket_name}/{file_path}"
            
        except Exception as e:
            raise Exception(f"Failed to upload file to GCS: {str(e)}")
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from Google Cloud Storage."""
        try:
            blob = self.bucket.blob(file_path)
            await asyncio.get_event_loop().run_in_executor(None, blob.delete)
            return True
            
        except Exception:
            return False
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if file exists in Google Cloud Storage."""
        try:
            blob = self.bucket.blob(file_path)
            return await asyncio.get_event_loop().run_in_executor(None, blob.exists)
            
        except Exception:
            return False
    
    async def get_file_info(self, file_path: str) -> Optional[dict]:
        """Get file information from Google Cloud Storage."""
        try:
            blob = self.bucket.blob(file_path)
            
            # Reload to get latest metadata
            await asyncio.get_event_loop().run_in_executor(None, blob.reload)
            
            return {
                "size": blob.size,
                "modified": blob.updated.timestamp() if blob.updated else None,
                "url": f"https://storage.googleapis.com/{self.bucket_name}/{file_path}"
            }
            
        except Exception:
            return None
    
    def _get_content_type(self, file_path: str) -> str:
        """Get content type based on file extension."""
        extension = Path(file_path).suffix.lower()
        
        content_types = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.zip': 'application/zip',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.txt': 'text/plain'
        }
        
        return content_types.get(extension, 'application/octet-stream')


def get_storage_backend(
    use_local: bool = True,
    local_upload_dir: str = "/app/uploads",
    local_url_prefix: str = "/uploads",
    s3_bucket: Optional[str] = None,
    s3_region: str = "us-east-1",
    s3_access_key: Optional[str] = None,
    s3_secret_key: Optional[str] = None,
    gcs_bucket: Optional[str] = None,
    gcs_project_id: Optional[str] = None
) -> StorageBackend:
    """
    Factory function to get storage backend based on configuration.
    
    Args:
        use_local: Whether to use local storage
        local_upload_dir: Local upload directory
        local_url_prefix: URL prefix for local files
        s3_bucket: S3 bucket name
        s3_region: S3 region
        s3_access_key: S3 access key
        s3_secret_key: S3 secret key
        gcs_bucket: Google Cloud Storage bucket name
        gcs_project_id: Google Cloud project ID
        
    Returns:
        Configured storage backend instance
    """
    if use_local:
        # Get base URL from settings
        from ..core.config import settings
        base_url = settings.API_BASE_URL
        return LocalStorage(
            upload_dir=local_upload_dir,
            url_prefix=local_url_prefix,
            base_url=base_url
        )
    elif s3_bucket:
        return S3Storage(
            bucket_name=s3_bucket,
            region=s3_region,
            access_key=s3_access_key,
            secret_key=s3_secret_key
        )
    elif gcs_bucket:
        return GoogleCloudStorage(
            bucket_name=gcs_bucket,
            project_id=gcs_project_id
        )
    else:
        raise ValueError("No storage backend configured. Please specify local, S3, or GCS settings.")