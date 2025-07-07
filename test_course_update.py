#!/usr/bin/env python3
"""
Test script to verify course update API functionality
Tests which fields from frontend are causing issues with backend validation
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# Add the backend directory to the Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from app.schemas.course import CourseUpdate
from pydantic import ValidationError

# Frontend sends this full structure
frontend_payload = {
    "_id": "123",
    "title": "Test Course",
    "description": "Test Description", 
    "short_description": "Short desc",
    "category": "programming",
    "level": "beginner",
    "language": "vi",
    "creator_id": "456",
    "creator_name": "Test Creator",
    "thumbnail": None,
    "preview_video": None,
    "syllabus": ["Learn X", "Learn Y"],
    "prerequisites": ["Basic programming"],
    "target_audience": ["Beginners"],
    "pricing": {
        "is_free": False,
        "price": 99,
        "currency": "USD"
    },
    "total_chapters": 3,
    "total_lessons": 10,
    "total_duration": 300,
    "status": "draft",
    "published_at": None,
    "stats": {
        "total_enrollments": 0,
        "active_students": 0,
        "completion_rate": 0,
        "average_rating": 0,
        "total_reviews": 0,
        "total_revenue": 0
    },
    "created_at": "2025-01-06T10:00:00Z",
    "updated_at": "2025-01-06T10:00:00Z"
}

# Backend CourseUpdate only accepts these fields
allowed_fields = [
    "title", "description", "short_description", "category", 
    "level", "language", "thumbnail", "preview_video", 
    "syllabus", "prerequisites", "target_audience", "status"
]

def test_full_payload():
    """Test with the full frontend payload"""
    print("=" * 60)
    print("TEST 1: Full Frontend Payload")
    print("=" * 60)
    
    try:
        course_update = CourseUpdate(**frontend_payload)
        print("✅ SUCCESS: Full payload accepted")
        print(f"Created CourseUpdate: {course_update}")
    except ValidationError as e:
        print("❌ FAILED: Validation errors:")
        for error in e.errors():
            print(f"  - Field '{error['loc'][0]}': {error['msg']}")
            print(f"    Type: {error['type']}")
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")

def test_filtered_payload():
    """Test with only allowed fields"""
    print("\n" + "=" * 60)
    print("TEST 2: Filtered Payload (Only Allowed Fields)")
    print("=" * 60)
    
    # Filter to only allowed fields
    filtered_payload = {k: v for k, v in frontend_payload.items() if k in allowed_fields}
    
    print("Filtered payload:")
    print(json.dumps(filtered_payload, indent=2, default=str))
    
    try:
        course_update = CourseUpdate(**filtered_payload)
        print("\n✅ SUCCESS: Filtered payload accepted")
        print(f"Created CourseUpdate: {course_update}")
    except ValidationError as e:
        print("\n❌ FAILED: Validation errors:")
        for error in e.errors():
            print(f"  - Field '{error['loc'][0]}': {error['msg']}")
    except Exception as e:
        print(f"\n❌ FAILED: {type(e).__name__}: {e}")

def test_minimal_payload():
    """Test with minimal required fields"""
    print("\n" + "=" * 60)
    print("TEST 3: Minimal Payload")
    print("=" * 60)
    
    minimal_payload = {
        "title": "Test Course"
    }
    
    print("Minimal payload:")
    print(json.dumps(minimal_payload, indent=2))
    
    try:
        course_update = CourseUpdate(**minimal_payload)
        print("\n✅ SUCCESS: Minimal payload accepted")
        print(f"Created CourseUpdate: {course_update}")
    except ValidationError as e:
        print("\n❌ FAILED: Validation errors:")
        for error in e.errors():
            print(f"  - Field '{error['loc'][0]}': {error['msg']}")
    except Exception as e:
        print(f"\n❌ FAILED: {type(e).__name__}: {e}")

def test_field_by_field():
    """Test each field individually to identify problematic ones"""
    print("\n" + "=" * 60)
    print("TEST 4: Field-by-Field Testing")
    print("=" * 60)
    
    # Test each field from frontend payload
    for field, value in frontend_payload.items():
        try:
            test_payload = {field: value}
            course_update = CourseUpdate(**test_payload)
            
            if field in allowed_fields:
                print(f"✅ '{field}': Accepted (allowed field)")
            else:
                print(f"⚠️  '{field}': Accepted but NOT in allowed fields list")
        except ValidationError as e:
            if field in allowed_fields:
                print(f"❌ '{field}': FAILED (should be allowed)")
                for error in e.errors():
                    print(f"    Error: {error['msg']}")
            else:
                print(f"⭕ '{field}': Rejected (extra field, expected)")
        except Exception as e:
            print(f"❌ '{field}': Unexpected error - {type(e).__name__}: {e}")

def main():
    """Run all tests"""
    print("Course Update API Test Script")
    print("Testing which fields from frontend cause backend validation issues")
    
    # Run tests
    test_full_payload()
    test_filtered_payload()
    test_minimal_payload()
    test_field_by_field()
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print("\nThe backend CourseUpdate schema should:")
    print("1. Only accept these fields:", ", ".join(allowed_fields))
    print("2. Reject extra fields like: _id, creator_id, creator_name, pricing, stats, etc.")
    print("3. All fields should be optional for partial updates")
    
    print("\nRECOMMENDATION:")
    print("The frontend should filter the payload before sending to only include allowed fields.")

if __name__ == "__main__":
    main()