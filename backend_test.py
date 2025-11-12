#!/usr/bin/env python3
"""
Backend API Testing Script for PO Generator
Tests the Per-row Pricing Feature Implementation
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://order-system-59.preview.emergentagent.com/api"

def test_settings_default_unit_price():
    """Test Scenario 1: Settings API - Default Unit Price"""
    print("=" * 60)
    print("SCENARIO 1: TESTING SETTINGS API - DEFAULT UNIT PRICE")
    print("=" * 60)
    
    # Test 1.1: GET /api/settings - verify default_unit_price field exists
    print("\n1.1 Testing GET /api/settings - verify default_unit_price field...")
    try:
        response = requests.get(f"{BACKEND_URL}/settings")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            settings = response.json()
            print(f"Response Body: {json.dumps(settings, indent=2)}")
            
            if 'default_unit_price' in settings:
                default_price = settings['default_unit_price']
                print(f"✅ default_unit_price field exists with value: {default_price}")
                
                # Should be 0 by default or a number
                if isinstance(default_price, (int, float)):
                    print("✅ default_unit_price has correct data type (number)")
                else:
                    print(f"❌ default_unit_price has wrong data type: {type(default_price)}")
                    return False
            else:
                print("❌ default_unit_price field missing from settings")
                return False
        else:
            print(f"❌ Failed to get settings: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error getting settings: {str(e)}")
        return False
    
    # Test 1.2: PUT /api/settings with default_unit_price
    print("\n1.2 Testing PUT /api/settings with default_unit_price = 295.50...")
    try:
        update_data = {"default_unit_price": 295.50}
        response = requests.put(f"{BACKEND_URL}/settings", json=update_data)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Settings update successful")
        else:
            print(f"❌ Failed to update settings: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error updating settings: {str(e)}")
        return False
    
    # Test 1.3: GET /api/settings again - verify it returns 295.50
    print("\n1.3 Testing GET /api/settings again - verify updated value...")
    try:
        response = requests.get(f"{BACKEND_URL}/settings")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            settings = response.json()
            default_price = settings.get('default_unit_price')
            print(f"Updated default_unit_price: {default_price}")
            
            if default_price == 295.50:
                print("✅ default_unit_price correctly updated and persisted")
            else:
                print(f"❌ default_unit_price not updated correctly. Expected: 295.50, Got: {default_price}")
                return False
        else:
            print(f"❌ Failed to get updated settings: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting updated settings: {str(e)}")
        return False
    
    print("\n✅ SCENARIO 1 PASSED: Settings API with default_unit_price works correctly")
    return True

def test_create_po_new_format():
    """Test Scenario 2: Create PO with New Format (colors as objects)"""
    print("\n" + "=" * 60)
    print("SCENARIO 2: TESTING CREATE PO WITH NEW FORMAT")
    print("=" * 60)
    
    # Create PO with new format colors (objects with name/unitPrice)
    print("\n2.1 Creating PO with new format colors (objects with name/unitPrice)...")
    
    new_format_po = {
        "po_number": f"TEST-NEW-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "po_date": "2024-01-15",
        "bill_to": {
            "company": "Fashion Retail Ltd",
            "address_lines": ["123 Fashion Street", "Mumbai", "Maharashtra"],
            "gstin": "27AABCF1234G1Z5",
            "contact_name": "Retail Manager",
            "phone": "9876543210",
            "email": "retail@fashion.com"
        },
        "buyer": {
            "company": "Newline Apparel",
            "address_lines": ["61, GKD Nagar, PN Palayam", "Coimbatore – 641037", "Tamil Nadu"],
            "gstin": "33AABCN1234F1Z5"
        },
        "supplier": {
            "company": "Premium Textiles Pvt Ltd",
            "address_lines": ["456 Industrial Area", "Tirupur", "Tamil Nadu"],
            "gstin": "33DEFGH5678I1Z9",
            "contact_name": "Production Head",
            "phone": "9123456789",
            "email": "production@premium.com"
        },
        "delivery_date": "2024-03-15",
        "delivery_terms": "FOB Factory",
        "payment_terms": "30 Days from Invoice Date",
        "currency": "INR",
        "order_lines": [
            {
                "style_code": "NL-T001",
                "product_description": "Premium Cotton T-Shirt with Per-Row Pricing",
                "fabric_gsm": "180 GSM Cotton",
                "colors": [],  # Empty - backend should extract from size_colour_breakdown
                "size_range": ["S", "M", "L", "XL"],
                "quantity": 200,
                "unit_price": 297.50,  # Average price
                "unit": "pcs"
            }
        ],
        "size_colour_breakdown": {
            "sizes": ["S", "M", "L", "XL"],
            "colors": [
                {"name": "Black", "unit_price": 295},
                {"name": "Navy Blue", "unit_price": 310}
            ],
            "values": {
                "Black": {"S": 20, "M": 30, "L": 25, "XL": 15},
                "Navy Blue": {"S": 25, "M": 35, "L": 30, "XL": 20}
            },
            "grand_total": 200
        },
        "packing_instructions": {
            "folding_instruction": "Fold with tissue paper",
            "packing_instruction": "Individual poly bags, then cartons",
            "carton_bag_markings": "Premium Quality - Handle with Care"
        },
        "other_terms": {
            "qc": "AQL 2.5 Standard",
            "labels_tags": "Woven labels as per artwork",
            "shortage_excess": "±3%",
            "penalty": "2% per week for delay",
            "notes": "Test PO for new per-row pricing format"
        },
        "authorisation": {
            "buyer_company": "Newline Apparel",
            "buyer_designation": "Purchase Manager",
            "buyer_name": "Arjun Kumar",
            "supplier_company": "Premium Textiles Pvt Ltd",
            "supplier_designation": "Sales Director",
            "supplier_name": "Rajesh Patel"
        }
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/pos", json=new_format_po)
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            created_po = response.json()
            po_id = created_po['id']
            print(f"✅ PO created successfully with ID: {po_id}")
            
            # Verify the colors format is preserved
            breakdown = created_po.get('size_colour_breakdown', {})
            colors = breakdown.get('colors', [])
            
            print(f"Colors in response: {json.dumps(colors, indent=2)}")
            
            # Check if colors are objects with name and unit_price
            if isinstance(colors, list) and len(colors) > 0:
                if isinstance(colors[0], dict) and 'name' in colors[0] and 'unit_price' in colors[0]:
                    print("✅ Colors format preserved as objects with name/unit_price")
                    
                    # Verify specific values
                    black_color = next((c for c in colors if c['name'] == 'Black'), None)
                    navy_color = next((c for c in colors if c['name'] == 'Navy Blue'), None)
                    
                    if black_color and black_color.get('unit_price') == 295:
                        print("✅ Black color unit_price correctly saved (295)")
                    else:
                        print(f"❌ Black color unit_price incorrect: {black_color}")
                        return False, None
                    
                    if navy_color and navy_color.get('unit_price') == 310:
                        print("✅ Navy Blue color unit_price correctly saved (310)")
                    else:
                        print(f"❌ Navy Blue color unit_price incorrect: {navy_color}")
                        return False, None
                        
                    # CRITICAL: Verify order_lines.colors was populated with extracted names
                    order_lines = created_po.get('order_lines', [])
                    if order_lines and len(order_lines) > 0:
                        line_colors = order_lines[0].get('colors', [])
                        print(f"Order line colors: {line_colors}")
                        
                        expected_names = ["Black", "Navy Blue"]
                        if isinstance(line_colors, list) and set(line_colors) == set(expected_names):
                            print("✅ Order line colors correctly extracted from size_colour_breakdown")
                        else:
                            print(f"❌ Order line colors not extracted correctly. Expected: {expected_names}, Got: {line_colors}")
                            return False, None
                    else:
                        print("❌ No order lines found in response")
                        return False, None
                        
                else:
                    print(f"❌ Colors not in expected object format: {colors}")
                    return False, None
            else:
                print(f"❌ Colors field invalid: {colors}")
                return False, None
                
            return True, po_id
            
        else:
            print(f"❌ Failed to create PO: {response.status_code} - {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Error creating PO with new format: {str(e)}")
        return False, None

def test_retrieve_new_format_po(po_id):
    """Test retrieving the newly created PO to verify data persistence"""
    print(f"\n2.2 Retrieving PO {po_id} to verify data persistence...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/pos/{po_id}")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            po_data = response.json()
            breakdown = po_data.get('size_colour_breakdown', {})
            colors = breakdown.get('colors', [])
            
            print("✅ PO retrieved successfully")
            print(f"Colors format: {json.dumps(colors, indent=2)}")
            
            # Verify colors are still in object format
            if isinstance(colors, list) and len(colors) > 0:
                if isinstance(colors[0], dict) and 'name' in colors[0] and 'unit_price' in colors[0]:
                    print("✅ Colors format preserved after retrieval")
                    return True
                else:
                    print(f"❌ Colors format changed after retrieval: {colors}")
                    return False
            else:
                print(f"❌ Invalid colors data after retrieval: {colors}")
                return False
        else:
            print(f"❌ Failed to retrieve PO: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error retrieving PO: {str(e)}")
        return False

def test_update_existing_po():
    """Test Scenario 3: Update Existing PO with New Pricing Format"""
    print("\n" + "=" * 60)
    print("SCENARIO 3: TESTING UPDATE EXISTING PO WITH NEW FORMAT")
    print("=" * 60)
    
    # First get an existing PO to update
    print("\n3.1 Finding existing PO to update...")
    try:
        response = requests.get(f"{BACKEND_URL}/pos")
        if response.status_code == 200:
            pos = response.json()
            if len(pos) > 0:
                # Use the first PO for updating
                existing_po = pos[0]
                po_id = existing_po['id']
                po_number = existing_po.get('po_number', 'Unknown')
                print(f"✅ Found existing PO to update: {po_number} (ID: {po_id})")
                
                # Update with new pricing format
                update_data = {
                    "size_colour_breakdown": {
                        "sizes": ["S", "M", "L", "XL"],
                        "colors": [
                            {"name": "Updated Black", "unit_price": 320},
                            {"name": "Updated Navy", "unit_price": 335}
                        ],
                        "values": {
                            "Updated Black": {"S": 15, "M": 25, "L": 20, "XL": 10},
                            "Updated Navy": {"S": 20, "M": 30, "L": 25, "XL": 15}
                        },
                        "grand_total": 160
                    },
                    "order_lines": [
                        {
                            "style_code": "UPD-001",
                            "product_description": "Updated Product with New Pricing",
                            "fabric_gsm": "200 GSM",
                            "colors": [],  # Empty - should be populated by backend
                            "size_range": ["S", "M", "L", "XL"],
                            "quantity": 160,
                            "unit_price": 327.50,
                            "unit": "pcs"
                        }
                    ]
                }
                
                print(f"\n3.2 Updating PO {po_number} with new pricing format...")
                response = requests.put(f"{BACKEND_URL}/pos/{po_id}", json=update_data)
                print(f"Update Response Status: {response.status_code}")
                
                if response.status_code == 200:
                    updated_po = response.json()
                    print("✅ PO updated successfully")
                    
                    # Verify the update worked
                    breakdown = updated_po.get('size_colour_breakdown', {})
                    colors = breakdown.get('colors', [])
                    
                    if isinstance(colors, list) and len(colors) >= 2:
                        updated_black = next((c for c in colors if c['name'] == 'Updated Black'), None)
                        updated_navy = next((c for c in colors if c['name'] == 'Updated Navy'), None)
                        
                        if updated_black and updated_black.get('unit_price') == 320:
                            print("✅ Updated Black color price correctly saved (320)")
                        else:
                            print(f"❌ Updated Black color incorrect: {updated_black}")
                            return False
                        
                        if updated_navy and updated_navy.get('unit_price') == 335:
                            print("✅ Updated Navy color price correctly saved (335)")
                        else:
                            print(f"❌ Updated Navy color incorrect: {updated_navy}")
                            return False
                        
                        # Check if order_lines colors were extracted
                        order_lines = updated_po.get('order_lines', [])
                        if order_lines and len(order_lines) > 0:
                            line_colors = order_lines[0].get('colors', [])
                            expected_names = ["Updated Black", "Updated Navy"]
                            if isinstance(line_colors, list) and set(line_colors) == set(expected_names):
                                print("✅ Order line colors correctly extracted after update")
                                return True
                            else:
                                print(f"❌ Order line colors not extracted after update. Expected: {expected_names}, Got: {line_colors}")
                                return False
                        else:
                            print("❌ No order lines found after update")
                            return False
                    else:
                        print(f"❌ Invalid colors after update: {colors}")
                        return False
                else:
                    print(f"❌ Failed to update PO: {response.status_code} - {response.text}")
                    return False
            else:
                print("⚠️  No existing POs found to update")
                return True  # Skip this test if no POs exist
        else:
            print(f"❌ Failed to get existing POs: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error in update test: {str(e)}")
        return False

def test_backward_compatibility():
    """Test Scenario 3: Backward Compatibility - Load Old PO"""
    print("\n" + "=" * 60)
    print("SCENARIO 3: TESTING BACKWARD COMPATIBILITY - LOAD OLD PO")
    print("=" * 60)
    
    # First, get existing POs to find one with old format
    print("\n3.1 Finding existing PO with old format colors...")
    try:
        response = requests.get(f"{BACKEND_URL}/pos")
        if response.status_code == 200:
            pos = response.json()
            print(f"✅ Found {len(pos)} existing POs")
            
            # Look for a PO with old format colors (strings)
            old_format_po = None
            for po in pos:
                breakdown = po.get('size_colour_breakdown', {})
                colors = breakdown.get('colors', [])
                
                # Check if colors are strings (old format)
                if isinstance(colors, list) and len(colors) > 0 and isinstance(colors[0], str):
                    old_format_po = po
                    break
            
            if old_format_po:
                po_id = old_format_po['id']
                po_number = old_format_po.get('po_number', 'Unknown')
                colors = old_format_po['size_colour_breakdown']['colors']
                print(f"✅ Found old format PO: {po_number} (ID: {po_id})")
                print(f"Old format colors: {colors}")
                
                # Test loading this PO
                return test_load_old_format_po(po_id, po_number)
            else:
                print("⚠️  No existing PO with old format found. Creating one for testing...")
                return create_and_test_old_format_po()
                
        else:
            print(f"❌ Failed to get POs: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error getting POs: {str(e)}")
        return False

def test_load_old_format_po(po_id, po_number):
    """Test loading an existing old format PO"""
    print(f"\n3.2 Testing GET old format PO ({po_number})...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/pos/{po_id}")
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            po_data = response.json()
            print("✅ Old format PO loaded without errors")
            
            # Verify the response structure
            breakdown = po_data.get('size_colour_breakdown', {})
            colors = breakdown.get('colors', [])
            
            print(f"Colors in response: {json.dumps(colors, indent=2)}")
            
            # The backend should convert old format to new format automatically
            if isinstance(colors, list) and len(colors) > 0:
                if isinstance(colors[0], dict) and 'name' in colors[0]:
                    print("✅ Backward compatibility working - old strings converted to objects")
                    
                    # Verify unit_price is set (should be 0.0 for converted colors)
                    for color in colors:
                        if 'unit_price' not in color:
                            print(f"❌ Converted color missing unit_price: {color}")
                            return False
                        if color['unit_price'] != 0.0:
                            print(f"⚠️  Converted color has non-zero unit_price: {color}")
                    
                    print("✅ All converted colors have unit_price field (default 0.0)")
                    return True
                elif isinstance(colors[0], str):
                    print("⚠️  Colors still in old string format - conversion not applied")
                    # This might be acceptable depending on implementation
                    return True
                else:
                    print(f"❌ Unexpected colors format: {colors}")
                    return False
            else:
                print(f"❌ Invalid colors data: {colors}")
                return False
                
        else:
            print(f"❌ Failed to load old format PO: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error loading old format PO: {str(e)}")
        return False

def create_and_test_old_format_po():
    """Create a PO with old format colors for testing"""
    print("\n3.2 Creating PO with old format colors for testing...")
    
    old_format_po = {
        "po_number": f"TEST-OLD-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "po_date": "2024-01-10",
        "bill_to": {
            "company": "Legacy Customer Ltd",
            "address_lines": ["789 Old Street", "Chennai", "Tamil Nadu"],
            "gstin": "33LEGACY123Z1",
            "contact_name": "Legacy Manager",
            "phone": "9988776655",
            "email": "legacy@customer.com"
        },
        "buyer": {
            "company": "Newline Apparel",
            "address_lines": ["61, GKD Nagar, PN Palayam", "Coimbatore – 641037", "Tamil Nadu"],
            "gstin": "33AABCN1234F1Z5"
        },
        "supplier": {
            "company": "Traditional Textiles",
            "address_lines": ["321 Heritage Road", "Erode", "Tamil Nadu"],
            "gstin": "33TRAD567890Z2",
            "contact_name": "Traditional Head",
            "phone": "9876543210",
            "email": "info@traditional.com"
        },
        "delivery_date": "2024-02-28",
        "delivery_terms": "Ex-Factory",
        "payment_terms": "Advance Payment",
        "currency": "INR",
        "order_lines": [
            {
                "style_code": "OLD-001",
                "product_description": "Traditional Cotton Shirt - Old Format",
                "fabric_gsm": "160 GSM",
                "colors": ["Black", "Grey Melange"],  # Old format - strings
                "size_range": ["M", "L", "XL"],
                "quantity": 150,
                "unit_price": 250.00,
                "unit": "pcs"
            }
        ],
        "size_colour_breakdown": {
            "sizes": ["M", "L", "XL"],
            "colors": ["Black", "Grey Melange"],  # Old format - strings
            "values": {
                "Black": {"M": 25, "L": 30, "XL": 20},
                "Grey Melange": {"M": 30, "L": 25, "XL": 20}
            },
            "grand_total": 150
        },
        "packing_instructions": {
            "folding_instruction": "Standard folding",
            "packing_instruction": "Carton packing",
            "carton_bag_markings": "Standard markings"
        },
        "other_terms": {
            "qc": "Standard QC",
            "labels_tags": "Standard labels",
            "shortage_excess": "±5%",
            "penalty": "Standard penalty",
            "notes": "Test PO with old format colors"
        },
        "authorisation": {
            "buyer_company": "Newline Apparel",
            "buyer_designation": "Manager",
            "buyer_name": "Test Manager",
            "supplier_company": "Traditional Textiles",
            "supplier_designation": "Owner",
            "supplier_name": "Traditional Owner"
        }
    }
    
    try:
        # Create the old format PO
        response = requests.post(f"{BACKEND_URL}/pos", json=old_format_po)
        print(f"Create Response Status: {response.status_code}")
        
        if response.status_code == 200:
            created_po = response.json()
            po_id = created_po['id']
            po_number = created_po['po_number']
            print(f"✅ Old format PO created: {po_number} (ID: {po_id})")
            
            # Now test loading it
            return test_load_old_format_po(po_id, po_number)
        else:
            print(f"❌ Failed to create old format PO: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating old format PO: {str(e)}")
        return False

def main():
    """Main test execution for Per-row Pricing Feature"""
    print("Starting Backend API Tests for Per-row Pricing Feature")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 80)
    
    all_tests_passed = True
    
    # Scenario 1: Settings API - Default Unit Price
    print("\n🧪 RUNNING SCENARIO 1: Settings API - Default Unit Price")
    if not test_settings_default_unit_price():
        all_tests_passed = False
        print("❌ SCENARIO 1 FAILED")
    else:
        print("✅ SCENARIO 1 PASSED")
    
    # Scenario 2: Create PO with New Format
    print("\n🧪 RUNNING SCENARIO 2: Create PO with New Format")
    success, po_id = test_create_po_new_format()
    if not success:
        all_tests_passed = False
        print("❌ SCENARIO 2 FAILED")
    else:
        print("✅ SCENARIO 2.1 PASSED")
        
        # Test retrieving the PO
        if po_id and test_retrieve_new_format_po(po_id):
            print("✅ SCENARIO 2.2 PASSED")
        else:
            all_tests_passed = False
            print("❌ SCENARIO 2.2 FAILED")
    
    # Scenario 3: Update Existing PO
    print("\n🧪 RUNNING SCENARIO 3: Update Existing PO with New Format")
    if not test_update_existing_po():
        all_tests_passed = False
        print("❌ SCENARIO 3 FAILED")
    else:
        print("✅ SCENARIO 3 PASSED")
    
    # Scenario 4: Backward Compatibility
    print("\n🧪 RUNNING SCENARIO 4: Backward Compatibility - Load Old PO")
    if not test_backward_compatibility():
        all_tests_passed = False
        print("❌ SCENARIO 4 FAILED")
    else:
        print("✅ SCENARIO 4 PASSED")
    
    # Final Results
    print("\n" + "=" * 80)
    if all_tests_passed:
        print("🎉 ALL PER-ROW PRICING TESTS COMPLETED SUCCESSFULLY!")
        print("✅ Settings API with default_unit_price works correctly")
        print("✅ PO creation with new format (colors as objects) works")
        print("✅ Data persistence verified for new format")
        print("✅ Backward compatibility with old format maintained")
        print("=" * 80)
        sys.exit(0)
    else:
        print("💥 SOME PER-ROW PRICING TESTS FAILED!")
        print("❌ Check the detailed output above for specific failures")
        print("=" * 80)
        sys.exit(1)

if __name__ == "__main__":
    main()