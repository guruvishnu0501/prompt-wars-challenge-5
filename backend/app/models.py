import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    event_type = Column(String(100), nullable=False)
    event_date = Column(String(50), nullable=False)
    guest_count = Column(Integer, nullable=False, default=50)
    total_budget = Column(Float, nullable=False, default=5000.0)
    currency = Column(String(10), default="USD")
    location = Column(String(255), default="")
    
    # AI Blueprint Data
    theme_concept = Column(Text, default="")
    color_palette = Column(String(255), default="")
    dress_code = Column(String(255), default="")
    mood_description = Column(Text, default="")
    schedule_json = Column(Text, default="[]")
    
    # Metadata
    is_demo = Column(Boolean, default=False)
    ai_provider = Column(String(100), default="Demo Mode")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    budget_items = relationship("BudgetItem", back_populates="event", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="event", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="event", cascade="all, delete-orphan")
    guests = relationship("Guest", back_populates="event", cascade="all, delete-orphan")

class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    allocated_amount = Column(Float, nullable=False, default=0.0)
    spent_amount = Column(Float, nullable=False, default=0.0)
    is_variable_guest = Column(Boolean, default=False)
    percentage = Column(Float, default=0.0)
    notes = Column(Text, default="")
    is_user_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="budget_items")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="General")
    due_date = Column(String(50), nullable=False)
    days_before_event = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # "pending", "completed"
    priority = Column(String(20), default="medium")  # "high", "medium", "low"
    notes = Column(Text, default="")
    is_user_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="tasks")

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    contact_info = Column(String(255), default="")
    quote_amount = Column(Float, default=0.0)
    status = Column(String(50), default="researching")  # "researching", "contacted", "booked", "paid"
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="vendors")

class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), default="")
    rsvp_status = Column(String(50), default="pending")  # "attending", "declined", "pending"
    dietary_notes = Column(String(255), default="")
    plus_one = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    event = relationship("Event", back_populates="guests")
