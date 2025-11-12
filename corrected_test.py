#!/usr/bin/env python3
"""
Corrected Test for Per-row Pricing Backend
Tests with proper data format where order_lines.colors is empty array
and backend extracts color names from size_colour_breakdown
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://order-system-59.preview.emergentagent.com/api"

def test_corrected_po_creation():
    """Test PO creation with corrected data format"""
    print("=" * 60)
    print("CORRECTED TEST: PO Creation with Proper Data Format")
    print("=" * 60)
    
    # Corrected PO data - empty colors array in order_lines
    corrected_po = {
        "po_number": f"TEST-CORRECTED-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
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
                "colors": [],  # CORRECTED: Empty array, backend will populate from size_colour_breakdown
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
                {"name": "Navy", "unit_price": 300}
            ],
            "values": {
                "Black": {"S": 20, "M": 30, "L": 25, "XL": 15},
                "Navy": {"S": 25, "M": 35, "L": 30, "XL": 20}
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
            "notes": "Test PO for corrected per-row pricing format"
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
        response = requests.post(f"{BACKEND_URL}/pos", json=corrected_po)
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            created_po = response.json()
            po_id = created_po['id']
            print(f"✅ PO created successfully with ID: {po_id}")
            
            # Verify the backend populated order_lines.colors correctly
            order_line = created_po.get('order_lines', [{}])[0]
            colors = order_line.get('colors', [])
            
            print(f"Order Line Colors: {colors}")
            
            # Check if colors were populated as strings
            if isinstance(colors, list) and len(colors) == 2:
                if "Black" in colors and "Navy" in colors:
                    print("✅ Backend correctly extracted color names from size_colour_breakdown")
                    print("✅ Order line colors populated as strings: ['Black', 'Navy']")
                else:
                    print(f"❌ Unexpected color names: {colors}")
                    return False
            else:
                print(f"❌ Colors not populated correctly: {colors}")
                return False
            
            # Verify size_colour_breakdown still has objects with pricing
            breakdown = created_po.get('size_colour_breakdown', {})
            breakdown_colors = breakdown.get('colors', [])
            
            print(f"Size Colour Breakdown Colors: {json.dumps(breakdown_colors, indent=2)}")
            
            if isinstance(breakdown_colors, list) and len(breakdown_colors) == 2:
                if (isinstance(breakdown_colors[0], dict) and 
                    'name' in breakdown_colors[0] and 
                    'unit_price' in breakdown_colors[0]):
                    print("✅ Size colour breakdown preserves pricing objects")
                else:
                    print(f"❌ Size colour breakdown format incorrect: {breakdown_colors}")
                    return False
            else:
                print(f"❌ Size colour breakdown invalid: {breakdown_colors}")
                return False
                
            return True
            
        else:
            print(f"❌ Failed to create PO: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating corrected PO: {str(e)}")
        return False

def main():
    print("Running Corrected Per-row Pricing Test")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 80)
    
    success = test_corrected_po_creation()
    
    print("\n" + "=" * 80)
    if success:
        print("🎉 CORRECTED TEST PASSED!")
        print("✅ Backend logic works correctly when data format is proper")
        print("✅ order_lines.colors populated from size_colour_breakdown")
        print("✅ Pricing objects preserved in size_colour_breakdown")
    else:
        print("💥 CORRECTED TEST FAILED!")
        print("❌ Issue persists even with correct data format")
    print("=" * 80)

if __name__ == "__main__":
    main()