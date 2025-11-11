#!/usr/bin/env python3
"""
Backend API Testing Script for PO Generator
Tests the DELETE /api/pos/{po_id} endpoint functionality
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://order-system-59.preview.emergentagent.com/api"

def test_delete_po_endpoint():
    """Test the DELETE /api/pos/{po_id} endpoint"""
    print("=" * 60)
    print("TESTING DELETE PO ENDPOINT")
    print("=" * 60)
    
    # First, let's get existing POs to have a valid ID for testing
    print("\n1. Getting existing POs...")
    try:
        response = requests.get(f"{BACKEND_URL}/pos")
        if response.status_code == 200:
            pos = response.json()
            print(f"✅ Found {len(pos)} existing POs")
            
            if len(pos) == 0:
                print("⚠️  No existing POs found. Creating a test PO first...")
                test_po_id = create_test_po()
                if not test_po_id:
                    print("❌ Failed to create test PO. Cannot proceed with delete tests.")
                    return False
            else:
                # Use the first existing PO for testing
                test_po_id = pos[0]['id']
                print(f"✅ Using existing PO ID for testing: {test_po_id}")
        else:
            print(f"❌ Failed to get POs: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error getting POs: {str(e)}")
        return False
    
    # Test 1: Delete an existing PO
    print(f"\n2. Testing DELETE existing PO (ID: {test_po_id})...")
    try:
        response = requests.delete(f"{BACKEND_URL}/pos/{test_po_id}")
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("message") == "PO deleted successfully":
                print("✅ DELETE existing PO: SUCCESS - Correct response message")
            else:
                print(f"❌ DELETE existing PO: FAILED - Unexpected message: {response_data}")
                return False
        else:
            print(f"❌ DELETE existing PO: FAILED - Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error deleting existing PO: {str(e)}")
        return False
    
    # Test 2: Verify PO is actually removed from database
    print(f"\n3. Verifying PO {test_po_id} is removed from database...")
    try:
        response = requests.get(f"{BACKEND_URL}/pos/{test_po_id}")
        if response.status_code == 404:
            print("✅ PO verification: SUCCESS - PO properly removed from database")
        else:
            print(f"❌ PO verification: FAILED - PO still exists (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Error verifying PO deletion: {str(e)}")
        return False
    
    # Test 3: Try to delete non-existent PO
    print("\n4. Testing DELETE non-existent PO...")
    fake_po_id = "non-existent-po-id-12345"
    try:
        response = requests.delete(f"{BACKEND_URL}/pos/{fake_po_id}")
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 404:
            response_data = response.json()
            if "PO not found" in response_data.get("detail", ""):
                print("✅ DELETE non-existent PO: SUCCESS - Correct 404 error")
            else:
                print(f"❌ DELETE non-existent PO: FAILED - Wrong error message: {response_data}")
                return False
        else:
            print(f"❌ DELETE non-existent PO: FAILED - Expected 404, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing non-existent PO deletion: {str(e)}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ ALL DELETE PO TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
    return True

def create_test_po():
    """Create a test PO for deletion testing"""
    print("Creating test PO...")
    
    test_po_data = {
        "po_number": f"TEST-DELETE-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "po_date": "2024-01-15",
        "bill_to": {
            "company": "Test Bill To Company",
            "address_lines": ["123 Test Street", "Test City", "Test State"],
            "gstin": "TEST123456789",
            "contact_name": "Test Contact",
            "phone": "1234567890",
            "email": "test@example.com"
        },
        "buyer": {
            "company": "Newline Apparel",
            "address_lines": ["61, GKD Nagar, PN Palayam", "Coimbatore – 641037", "Tamil Nadu"],
            "gstin": "33AABCN1234F1Z5"
        },
        "supplier": {
            "company": "Test Supplier Ltd",
            "address_lines": ["456 Supplier Ave", "Supplier City", "Supplier State"],
            "gstin": "SUP123456789",
            "contact_name": "Supplier Contact",
            "phone": "9876543210",
            "email": "supplier@example.com"
        },
        "delivery_date": "2024-02-15",
        "delivery_terms": "FOB Destination",
        "payment_terms": "Net 30",
        "currency": "INR",
        "order_lines": [
            {
                "style_code": "TEST-001",
                "product_description": "Test Product for Deletion",
                "fabric_gsm": "180 GSM",
                "colors": ["Red", "Blue"],
                "size_range": ["S", "M", "L"],
                "quantity": 100,
                "unit_price": 25.50,
                "unit": "pcs"
            }
        ],
        "size_colour_breakdown": {
            "sizes": ["S", "M", "L"],
            "colors": ["Red", "Blue"],
            "values": {
                "Red": {"S": 10, "M": 15, "L": 20},
                "Blue": {"S": 15, "M": 20, "L": 20}
            },
            "grand_total": 100
        },
        "packing_instructions": {
            "folding_instruction": "Fold neatly",
            "packing_instruction": "Pack in poly bags",
            "carton_bag_markings": "Handle with care"
        },
        "other_terms": {
            "qc": "Standard QC",
            "labels_tags": "As per buyer requirement",
            "shortage_excess": "±5%",
            "penalty": "As per agreement",
            "notes": "Test PO for deletion testing"
        },
        "authorisation": {
            "buyer_company": "Newline Apparel",
            "buyer_designation": "Purchase Manager",
            "buyer_name": "Test Buyer",
            "supplier_company": "Test Supplier Ltd",
            "supplier_designation": "Sales Manager",
            "supplier_name": "Test Supplier"
        }
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/pos", json=test_po_data)
        if response.status_code == 200:
            created_po = response.json()
            po_id = created_po['id']
            print(f"✅ Test PO created successfully with ID: {po_id}")
            return po_id
        else:
            print(f"❌ Failed to create test PO: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating test PO: {str(e)}")
        return None

def main():
    """Main test execution"""
    print("Starting Backend API Tests for DELETE PO Endpoint")
    print(f"Backend URL: {BACKEND_URL}")
    
    # Test delete PO functionality
    success = test_delete_po_endpoint()
    
    if success:
        print("\n🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()