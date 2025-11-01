from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timezone
import base64
import re


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'po_generator')]

# Upload directory setup
upload_dir = os.environ.get('UPLOAD_DIR', str(ROOT_DIR / 'uploads'))
Path(upload_dir).mkdir(parents=True, exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Mount uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


# PO Models
class OrderLine(BaseModel):
    style_code: str
    product_description: str
    fabric_gsm: str
    colors: Optional[Union[List[str], str]] = Field(default_factory=list)
    size_range: Optional[Union[List[str], str]] = Field(default_factory=list)
    quantity: int
    unit_price: float
    unit: str = "pcs"
    
    @field_validator('colors', mode='before')
    @classmethod
    def parse_colors(cls, v):
        if isinstance(v, str):
            # Split comma-separated string into array
            return [c.strip() for c in v.split(',') if c.strip()]
        return v or []
    
    @field_validator('size_range', mode='before')
    @classmethod
    def parse_size_range(cls, v):
        if isinstance(v, str):
            # Split comma-separated string into array
            return [s.strip() for s in v.split(',') if s.strip()]
        return v or []

class SizeColourBreakdown(BaseModel):
    sizes: List[str]
    colors: List[str]
    values: Dict[str, Dict[str, int]]  # {color: {size: count}}
    grand_total: int

class PackingInstructions(BaseModel):
    folding_instruction: Optional[str] = None
    packing_instruction: Optional[str] = None
    carton_bag_markings: Optional[str] = None

class OtherTerms(BaseModel):
    qc: Optional[str] = None
    labels_tags: Optional[str] = None
    shortage_excess: Optional[str] = None
    penalty: Optional[str] = None
    notes: Optional[str] = None

class Authorisation(BaseModel):
    buyer_company: Optional[str] = None
    buyer_designation: Optional[str] = None
    buyer_name: Optional[str] = None
    supplier_company: Optional[str] = None
    supplier_designation: Optional[str] = None
    supplier_name: Optional[str] = None

class Party(BaseModel):
    company: str
    address_lines: List[str]
    gstin: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class BuyerStatic(BaseModel):
    company: str = "Newline Apparel"
    address_lines: List[str] = ["61, GKD Nagar, PN Palayam", "Coimbatore – 641037", "Tamil Nadu"]
    gstin: str = "33AABCN1234F1Z5"

class AppSettings(BaseModel):
    logo_base64: Optional[str] = None
    logo_filename: Optional[str] = None
    # PO/PI auto-increment settings
    next_po_number: int = 1
    po_prefix: str = "NA/"
    use_po_prefix: bool = False
    next_pi_number: int = 1
    pi_prefix: str = "PI/"
    use_pi_prefix: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PurchaseOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    po_number: str
    po_date: str
    bill_to: Optional[Party] = None  # Make optional for backward compatibility
    buyer: Party = Field(default_factory=lambda: Party(
        company="Newline Apparel",
        address_lines=["61, GKD Nagar, PN Palayam", "Coimbatore – 641037", "Tamil Nadu"],
        gstin="33AABCN1234F1Z5"
    ))
    supplier: Party
    delivery_date: str
    delivery_terms: str
    payment_terms: str
    currency: str = "INR"
    order_lines: List[OrderLine]
    size_colour_breakdown: SizeColourBreakdown
    packing_instructions: PackingInstructions
    other_terms: OtherTerms
    authorisation: Authorisation
    logo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class POCreate(BaseModel):
    po_number: str
    po_date: str
    bill_to: Party
    buyer: Party
    supplier: Party
    delivery_date: str
    delivery_terms: str
    payment_terms: str
    currency: str = "INR"
    order_lines: List[OrderLine]
    size_colour_breakdown: SizeColourBreakdown
    packing_instructions: PackingInstructions
    other_terms: OtherTerms
    authorisation: Authorisation
    logo_url: Optional[str] = None

class POUpdate(BaseModel):
    po_number: Optional[str] = None
    po_date: Optional[str] = None
    bill_to: Optional[Party] = None
    buyer: Optional[Party] = None
    supplier: Optional[Party] = None
    delivery_date: Optional[str] = None
    delivery_terms: Optional[str] = None
    payment_terms: Optional[str] = None
    currency: Optional[str] = None
    order_lines: Optional[List[OrderLine]] = None
    size_colour_breakdown: Optional[SizeColourBreakdown] = None
    packing_instructions: Optional[PackingInstructions] = None
    other_terms: Optional[OtherTerms] = None
    authorisation: Optional[Authorisation] = None
    logo_url: Optional[str] = None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and ensure safety"""
    # Remove any path components
    filename = os.path.basename(filename)
    # Remove any non-alphanumeric characters except dots, hyphens, and underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    # Add timestamp to make unique
    name, ext = os.path.splitext(filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return f"{name}_{timestamp}{ext}"


# Routes
@api_router.get("/")
async def root():
    return {"message": "Newline Apparel PO Generator API"}

@api_router.post("/pos", response_model=PurchaseOrder)
async def create_po(po_data: POCreate):
    try:
        # If colors/size_range not provided in order_lines, derive from breakdown
        for line in po_data.order_lines:
            if not line.colors:
                line.colors = po_data.size_colour_breakdown.colors
            if not line.size_range:
                line.size_range = po_data.size_colour_breakdown.sizes
        
        po_obj = PurchaseOrder(**po_data.model_dump())
        doc = po_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.purchase_orders.insert_one(doc)
        return po_obj
    except Exception as e:
        logging.error(f"Error creating PO: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=f"Validation error creating PO: {str(e)}"
        )

@api_router.get("/pos", response_model=List[PurchaseOrder])
async def get_all_pos(search: Optional[str] = None, supplier: Optional[str] = None):
    query = {}
    
    if search:
        query["$or"] = [
            {"po_number": {"$regex": search, "$options": "i"}},
            {"supplier.company": {"$regex": search, "$options": "i"}}
        ]
    
    if supplier:
        query["supplier.company"] = {"$regex": supplier, "$options": "i"}
    
    pos = await db.purchase_orders.find(query, {"_id": 0}).to_list(1000)
    
    for po in pos:
        if isinstance(po['created_at'], str):
            po['created_at'] = datetime.fromisoformat(po['created_at'])
        if isinstance(po['updated_at'], str):
            po['updated_at'] = datetime.fromisoformat(po['updated_at'])
    
    return pos

@api_router.get("/pos/{po_id}", response_model=PurchaseOrder)
async def get_po(po_id: str):
    po = await db.purchase_orders.find_one({"id": po_id}, {"_id": 0})
    
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    
    if isinstance(po['created_at'], str):
        po['created_at'] = datetime.fromisoformat(po['created_at'])
    if isinstance(po['updated_at'], str):
        po['updated_at'] = datetime.fromisoformat(po['updated_at'])
    
    return po

@api_router.put("/pos/{po_id}", response_model=PurchaseOrder)
async def update_po(po_id: str, po_update: POUpdate):
    existing_po = await db.purchase_orders.find_one({"id": po_id}, {"_id": 0})
    
    if not existing_po:
        raise HTTPException(status_code=404, detail="PO not found")
    
    try:
        update_data = po_update.model_dump(exclude_unset=True)
        
        # If colors/size_range not provided in order_lines, derive from breakdown
        if 'order_lines' in update_data and 'size_colour_breakdown' in update_data:
            for line in update_data['order_lines']:
                if not line.get('colors'):
                    line['colors'] = update_data['size_colour_breakdown']['colors']
                if not line.get('size_range'):
                    line['size_range'] = update_data['size_colour_breakdown']['sizes']
        
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        await db.purchase_orders.update_one(
            {"id": po_id},
            {"$set": update_data}
        )
        
        updated_po = await db.purchase_orders.find_one({"id": po_id}, {"_id": 0})
        
        if isinstance(updated_po['created_at'], str):
            updated_po['created_at'] = datetime.fromisoformat(updated_po['created_at'])
        if isinstance(updated_po['updated_at'], str):
            updated_po['updated_at'] = datetime.fromisoformat(updated_po['updated_at'])
        
        return updated_po
    except Exception as e:
        logging.error(f"Error updating PO: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=f"Validation error updating PO: {str(e)}"
        )

@api_router.delete("/pos/{po_id}")
async def delete_po(po_id: str):
    result = await db.purchase_orders.delete_one({"id": po_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="PO not found")
    
    return {"message": "PO deleted successfully"}

@api_router.get("/buyer-info")
async def get_buyer_info():
    return {
        "company": "Newline Apparel",
        "address_lines": [
            "61, GKD Nagar, PN Palayam",
            "Coimbatore – 641037",
            "Tamil Nadu"
        ],
        "gstin": "33AABCN1234F1Z5",
        "brand_name": "Newline Apparel"
    }

# Settings Routes - Accept both 'file' and 'logo' field names
@api_router.post("/settings/logo")
async def upload_logo(
    file: Optional[UploadFile] = File(None),
    logo: Optional[UploadFile] = File(None)
):
    # Use whichever field is present
    upload_file = file or logo
    
    if not upload_file:
        raise HTTPException(
            status_code=422,
            detail="No file provided. Please upload a file using 'file' or 'logo' field."
        )
    
    # Validate file type
    allowed_types = ['image/png', 'image/jpeg', 'image/jpg']
    if upload_file.content_type not in allowed_types:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type '{upload_file.content_type}'. Only PNG, JPG, and JPEG files are allowed."
        )
    
    # Read and validate file size (max 5MB)
    contents = await upload_file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=422,
            detail="File size must be less than 5MB"
        )
    
    try:
        # Convert to base64 for database storage
        logo_base64 = base64.b64encode(contents).decode('utf-8')
        data_uri = f"data:{upload_file.content_type};base64,{logo_base64}"
        
        # Also save as file for static serving
        safe_name = sanitize_filename(upload_file.filename)
        file_path = Path(upload_dir).resolve() / safe_name
        
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        # Save to settings collection
        settings_doc = {
            "_id": "app_settings",
            "logo_base64": data_uri,
            "logo_filename": upload_file.filename,
            "logo_path": str(file_path),
            "logo_url": f"/uploads/{safe_name}",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.settings.update_one(
            {"_id": "app_settings"},
            {"$set": settings_doc},
            upsert=True
        )
        
        return {
            "message": "Logo uploaded successfully",
            "logo_base64": data_uri,
            "filename": upload_file.filename,
            "url": f"/uploads/{safe_name}",
            "path": str(file_path)
        }
    except Exception as e:
        logging.error(f"Error uploading logo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading logo: {str(e)}"
        )

@api_router.get("/settings/logo")
async def get_logo():
    settings = await db.settings.find_one({"_id": "app_settings"}, {"_id": 0})
    
    if not settings or not settings.get('logo_base64'):
        return {"logo_base64": None, "logo_filename": None}
    
    return {
        "logo_base64": settings.get('logo_base64'),
        "logo_filename": settings.get('logo_filename'),
        "logo_url": settings.get('logo_url')
    }

@api_router.delete("/settings/logo")
async def delete_logo():
    settings = await db.settings.find_one({"_id": "app_settings"}, {"_id": 0})
    
    # Delete physical file if exists
    if settings and settings.get('logo_path'):
        try:
            Path(settings['logo_path']).unlink(missing_ok=True)
        except Exception as e:
            logging.warning(f"Could not delete logo file: {str(e)}")
    
    await db.settings.update_one(
        {"_id": "app_settings"},
        {"$set": {
            "logo_base64": None,
            "logo_filename": None,
            "logo_path": None,
            "logo_url": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": "Logo deleted successfully"}


# Settings endpoints for PO/PI auto-increment
@api_router.get("/settings")
async def get_settings():
    """Get all app settings including PO/PI counters"""
    settings = await db.settings.find_one({"_id": "app_settings"})
    
    if not settings:
        # Create default settings
        default_settings = {
            "_id": "app_settings",
            "next_po_number": 1,
            "po_prefix": "NA/",
            "use_po_prefix": False,
            "next_pi_number": 1,
            "pi_prefix": "PI/",
            "use_pi_prefix": False,
            "logo_base64": None,
            "logo_filename": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(default_settings)
        settings = default_settings
    
    # Remove _id from response
    settings.pop('_id', None)
    return settings


@api_router.patch("/settings")
async def update_settings(settings_update: Dict[str, Any]):
    """Update app settings (PO/PI prefixes and flags)"""
    # Only allow updating specific fields
    allowed_fields = ['po_prefix', 'use_po_prefix', 'pi_prefix', 'use_pi_prefix']
    update_data = {k: v for k, v in settings_update.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one(
        {"_id": "app_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Settings updated successfully", "updated_fields": list(update_data.keys())}


@api_router.post("/po/next-number")
async def get_next_po_number():
    """Atomically get and increment PO number with format: NA/DDMMYY/XXXX"""
    # Find and update atomically
    result = await db.settings.find_one_and_update(
        {"_id": "app_settings"},
        {"$inc": {"next_po_number": 1}},
        return_document=True,
        upsert=True
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate PO number")
    
    # Get the number (after increment, so we need to use it as-is)
    number = result.get('next_po_number', 1)
    prefix = result.get('po_prefix', 'NA')
    
    # Format: NA/DDMMYY/XXXX
    # Get current date in ddmmyy format
    current_date = datetime.now(timezone.utc)
    date_str = current_date.strftime('%d%m%y')  # e.g., 181025
    
    # Pad number to 4 digits
    number_str = str(number).zfill(4)  # e.g., 0001, 1403
    
    # Compose final number: NA/181025/1403
    final_number = f"{prefix}/{date_str}/{number_str}"
    
    return {
        "number": final_number,
        "raw_number": number,
        "date": date_str,
        "formatted_number": number_str
    }


@api_router.post("/pi/next-number")
async def get_next_pi_number():
    """Atomically get and increment PI number"""
    # Find and update atomically
    result = await db.settings.find_one_and_update(
        {"_id": "app_settings"},
        {"$inc": {"next_pi_number": 1}},
        return_document=True,
        upsert=True
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate PI number")
    
    # Get the number (before increment)
    number = result.get('next_pi_number', 1) - 1
    use_prefix = result.get('use_pi_prefix', False)
    prefix = result.get('pi_prefix', 'PI/')
    
    # Compose final number
    final_number = f"{prefix}{number}" if use_prefix else str(number)
    
    return {
        "number": final_number,
        "raw_number": number,
        "prefix": prefix if use_prefix else None
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Upload directory: {upload_dir}")
    logger.info(f"MongoDB URL: {mongo_url}")
    logger.info(f"Database: {os.environ.get('DB_NAME', 'po_generator')}")
    logger.info(f"CORS Origins: {os.environ.get('CORS_ORIGINS', '*')}")
    
    # Seed default settings if missing
    settings = await db.settings.find_one({"_id": "app_settings"})
    if not settings:
        default_settings = {
            "_id": "app_settings",
            "next_po_number": 1,
            "po_prefix": "NA/",
            "use_po_prefix": False,
            "next_pi_number": 1,
            "pi_prefix": "PI/",
            "use_pi_prefix": False,
            "logo_base64": None,
            "logo_filename": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(default_settings)
        logger.info("✅ Created default app settings")
    else:
        # Update existing settings to add new fields if missing
        update_fields = {}
        if 'next_po_number' not in settings:
            update_fields['next_po_number'] = 1
        if 'po_prefix' not in settings:
            update_fields['po_prefix'] = "NA/"
        if 'use_po_prefix' not in settings:
            update_fields['use_po_prefix'] = False
        if 'next_pi_number' not in settings:
            update_fields['next_pi_number'] = 1
        if 'pi_prefix' not in settings:
            update_fields['pi_prefix'] = "PI/"
        if 'use_pi_prefix' not in settings:
            update_fields['use_pi_prefix'] = False
        
        if update_fields:
            await db.settings.update_one(
                {"_id": "app_settings"},
                {"$set": update_fields}
            )
            logger.info(f"✅ Updated settings with new fields: {list(update_fields.keys())}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()