#!/usr/bin/env python3
"""
Test to confirm Pydantic's behavior with extra fields
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

# Test 1: Default Pydantic behavior (allows extra fields)
class DefaultModel(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None

# Test 2: Pydantic with forbid extra
class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    name: Optional[str] = None
    age: Optional[int] = None

# Test 3: Pydantic with ignore extra (silently ignores)
class IgnoreModel(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    name: Optional[str] = None
    age: Optional[int] = None

def test_models():
    test_data = {
        "name": "John",
        "age": 30,
        "extra_field": "This should not be here",
        "_id": "12345"
    }
    
    print("Test Data:", test_data)
    print("\n" + "="*60)
    
    # Test 1: Default behavior
    print("1. DEFAULT MODEL (no config):")
    try:
        default = DefaultModel(**test_data)
        print(f"✅ Success: {default}")
        print(f"   Has extra fields: {hasattr(default, 'extra_field')}")
        print(f"   Model dict: {default.model_dump()}")
    except Exception as e:
        print(f"❌ Failed: {e}")
    
    print("\n" + "="*60)
    
    # Test 2: Strict model
    print("2. STRICT MODEL (extra='forbid'):")
    try:
        strict = StrictModel(**test_data)
        print(f"✅ Success: {strict}")
    except Exception as e:
        print(f"❌ Failed: {e}")
    
    print("\n" + "="*60)
    
    # Test 3: Ignore model
    print("3. IGNORE MODEL (extra='ignore'):")
    try:
        ignore = IgnoreModel(**test_data)
        print(f"✅ Success: {ignore}")
        print(f"   Model dict: {ignore.model_dump()}")
        print(f"   Extra fields ignored: extra_field and _id not in output")
    except Exception as e:
        print(f"❌ Failed: {e}")
    
    print("\n" + "="*60)
    print("CONCLUSION:")
    print("The CourseUpdate schema is using default Pydantic behavior,")
    print("which silently ignores extra fields but doesn't raise errors.")
    print("\nSOLUTIONS:")
    print("1. Frontend should filter fields before sending")
    print("2. OR Backend could use ConfigDict(extra='forbid') to reject extra fields")
    print("3. OR Backend could use ConfigDict(extra='ignore') to be explicit about ignoring")

if __name__ == "__main__":
    test_models()