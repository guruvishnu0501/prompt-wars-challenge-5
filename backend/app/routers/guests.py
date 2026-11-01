from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Event, Guest
from backend.app.schemas import GuestCreate, GuestUpdate, GuestOut

router = APIRouter(tags=["Guests"])

@router.post("/api/events/{event_id}/guests", response_model=GuestOut, status_code=status.HTTP_201_CREATED)
def add_guest(event_id: int, payload: GuestCreate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    guest = Guest(
        event_id=event_id,
        name=payload.name,
        email=payload.email or "",
        rsvp_status=payload.rsvp_status,
        dietary_notes=payload.dietary_notes or "",
        plus_one=payload.plus_one
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest

@router.put("/api/guests/{guest_id}", response_model=GuestOut)
def update_guest(guest_id: int, payload: GuestUpdate, db: Session = Depends(get_db)):
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    if payload.name is not None:
        guest.name = payload.name
    if payload.email is not None:
        guest.email = payload.email
    if payload.rsvp_status is not None:
        guest.rsvp_status = payload.rsvp_status
    if payload.dietary_notes is not None:
        guest.dietary_notes = payload.dietary_notes
    if payload.plus_one is not None:
        guest.plus_one = payload.plus_one

    db.commit()
    db.refresh(guest)
    return guest

@router.delete("/api/guests/{guest_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_guest(guest_id: int, db: Session = Depends(get_db)):
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    db.delete(guest)
    db.commit()
    return None
