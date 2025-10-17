from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# PO Models
class OrderLine(BaseModel):
    style_code: str
    product_description: str
    fabric_gsm: str
    colors: List[str]
    size_range: List[str]
    quantity: int
    unit_price: float
    unit: str = "pcs"

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
    buyer_designation: Optional[str] = None
    buyer_name: Optional[str] = None
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
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PurchaseOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    po_number: str
    po_date: str
    bill_to: Party
    buyer_static: BuyerStatic = Field(default_factory=BuyerStatic)
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


# Routes
@api_router.get("/")
async def root():
    return {"message": "Newline Apparel PO Generator API"}

@api_router.post("/pos", response_model=PurchaseOrder)
async def create_po(po_data: POCreate):
    po_obj = PurchaseOrder(**po_data.model_dump())
    doc = po_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.purchase_orders.insert_one(doc)
    return po_obj

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
    
    update_data = po_update.model_dump(exclude_unset=True)
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

# Settings Routes
@api_router.post("/settings/logo")
async def upload_logo(file: UploadFile = File(...)):
    # Validate file type
    allowed_types = ['image/png', 'image/jpeg', 'image/jpg']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, and JPEG files are allowed")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    # Convert to base64
    logo_base64 = base64.b64encode(contents).decode('utf-8')
    data_uri = f"data:{file.content_type};base64,{logo_base64}"
    
    # Save to settings collection
    settings_doc = {
        "_id": "app_settings",
        "logo_base64": data_uri,
        "logo_filename": file.filename,
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
        "filename": file.filename
    }

@api_router.get("/settings/logo")
async def get_logo():
    settings = await db.settings.find_one({"_id": "app_settings"}, {"_id": 0})
    
    if not settings or not settings.get('logo_base64'):
        return {"logo_base64": None, "logo_filename": None}
    
    return {
        "logo_base64": settings.get('logo_base64'),
        "logo_filename": settings.get('logo_filename')
    }

@api_router.delete("/settings/logo")
async def delete_logo():
    await db.settings.update_one(
        {"_id": "app_settings"},
        {"$set": {"logo_base64": None, "logo_filename": None, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Logo deleted successfully"}


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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()