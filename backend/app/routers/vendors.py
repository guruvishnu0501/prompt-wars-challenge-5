from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Event, Vendor
from backend.app.schemas import VendorCreate, VendorUpdate, VendorOut

router = APIRouter(tags=["Vendors"])

@router.post("/api/events/{event_id}/vendors", response_model=VendorOut, status_code=status.HTTP_201_CREATED)
def add_vendor(event_id: int, payload: VendorCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    vendor = Vendor(
        event_id=event_id,
        name=payload.name,
        category=payload.category,
        contact_info=payload.contact_info or "",
        quote_amount=payload.quote_amount,
        status=payload.status,
        notes=payload.notes or ""
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

@router.put("/api/vendors/{vendor_id}", response_model=VendorOut)
def update_vendor(vendor_id: int, payload: VendorUpdate, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if payload.name is not None:
        vendor.name = payload.name
    if payload.category is not None:
        vendor.category = payload.category
    if payload.contact_info is not None:
        vendor.contact_info = payload.contact_info
    if payload.quote_amount is not None:
        vendor.quote_amount = payload.quote_amount
    if payload.status is not None:
        vendor.status = payload.status
    if payload.notes is not None:
        vendor.notes = payload.notes

    db.commit()
    db.refresh(vendor)
    return vendor

@router.delete("/api/vendors/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(vendor)
    db.commit()
    return None
