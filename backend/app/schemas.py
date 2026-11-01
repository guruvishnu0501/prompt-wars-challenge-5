from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, date

class BudgetItemBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    allocated_amount: float = Field(..., ge=0.0)
    spent_amount: float = Field(default=0.0, ge=0.0)
    is_variable_guest: bool = False
    percentage: float = 0.0
    notes: Optional[str] = ""
    is_user_edited: bool = False

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItemUpdate(BaseModel):
    category: Optional[str] = None
    allocated_amount: Optional[float] = Field(None, ge=0.0)
    spent_amount: Optional[float] = Field(None, ge=0.0)
    is_variable_guest: Optional[bool] = None
    notes: Optional[str] = None

class BudgetItemOut(BudgetItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_id: int
    created_at: Optional[datetime] = None

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="General", max_length=100)
    due_date: str = Field(..., description="Format: YYYY-MM-DD")
    days_before_event: int = 0
    status: str = Field(default="pending", pattern="^(pending|completed)$")
    priority: str = Field(default="medium", pattern="^(high|medium|low)$")
    notes: Optional[str] = ""
    is_user_edited: bool = False

    @field_validator("due_date")
    def validate_due_date_format(cls, v):
        try:
            datetime.strptime(v.strip(), "%Y-%m-%d")
        except ValueError:
            raise ValueError("due_date must be in YYYY-MM-DD format")
        return v.strip()

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[str] = None
    days_before_event: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(pending|completed)$")
    priority: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    notes: Optional[str] = None

    @field_validator("due_date")
    def validate_due_date_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v.strip(), "%Y-%m-%d")
            except ValueError:
                raise ValueError("due_date must be in YYYY-MM-DD format")
            return v.strip()
        return v

class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_id: int
    is_overdue: bool = False
    days_until_due: int = 0
    created_at: Optional[datetime] = None

class VendorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    contact_info: Optional[str] = ""
    quote_amount: float = Field(default=0.0, ge=0.0)
    status: str = Field(default="researching", pattern="^(researching|contacted|booked|paid)$")
    notes: Optional[str] = ""

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    contact_info: Optional[str] = None
    quote_amount: Optional[float] = Field(None, ge=0.0)
    status: Optional[str] = Field(None, pattern="^(researching|contacted|booked|paid)$")
    notes: Optional[str] = None

class VendorOut(VendorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_id: int
    created_at: Optional[datetime] = None

class GuestBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = ""
    rsvp_status: str = Field(default="pending", pattern="^(attending|declined|pending)$")
    dietary_notes: Optional[str] = ""
    plus_one: bool = False

class GuestCreate(GuestBase):
    pass

class GuestUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    rsvp_status: Optional[str] = Field(None, pattern="^(attending|declined|pending)$")
    dietary_notes: Optional[str] = None
    plus_one: Optional[bool] = None

class GuestOut(GuestBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_id: int
    created_at: Optional[datetime] = None

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    event_type: str = Field(..., min_length=1, max_length=100)
    event_date: str = Field(..., description="Format: YYYY-MM-DD")
    guest_count: int = Field(..., gt=0, description="Must be greater than 0")
    total_budget: float = Field(..., gt=0.0, description="Must be greater than 0")
    currency: str = Field(default="USD", max_length=10)
    location: Optional[str] = ""
    force_demo: bool = False
    custom_notes: Optional[str] = ""

    @field_validator("event_date")
    def validate_date(cls, v):
        try:
            datetime.strptime(v.strip(), "%Y-%m-%d")
        except ValueError:
            raise ValueError("event_date must be in YYYY-MM-DD format")
        return v.strip()

class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[str] = None
    guest_count: Optional[int] = Field(None, gt=0)
    total_budget: Optional[float] = Field(None, gt=0.0)
    currency: Optional[str] = None
    location: Optional[str] = None

    @field_validator("event_date")
    def validate_date(cls, v):
        if v is not None:
            try:
                datetime.strptime(v.strip(), "%Y-%m-%d")
            except ValueError:
                raise ValueError("event_date must be in YYYY-MM-DD format")
            return v.strip()
        return v

class PlanGenerateRequest(BaseModel):
    custom_notes: Optional[str] = ""
    force_demo: bool = False
    merge_mode: str = Field(default="merge", pattern="^(merge|replace)$")
    confirmed_overwrite: bool = False

class BudgetRecalculateRequest(BaseModel):
    new_total_budget: float = Field(..., gt=0.0)

class GuestCountChangeRequest(BaseModel):
    new_guest_count: int = Field(..., gt=0)

class EventDateChangeRequest(BaseModel):
    new_event_date: str

    @field_validator("new_event_date")
    def validate_date(cls, v):
        try:
            datetime.strptime(v.strip(), "%Y-%m-%d")
        except ValueError:
            raise ValueError("new_event_date must be in YYYY-MM-DD format")
        return v.strip()

class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    event_type: str
    event_date: str
    guest_count: int
    total_budget: float
    currency: str
    location: str
    theme_concept: str
    color_palette: str
    dress_code: str
    mood_description: str
    schedule_json: str
    is_demo: bool
    ai_provider: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Computed metrics
    total_spent: float = 0.0
    total_allocated: float = 0.0
    remaining_budget: float = 0.0
    cost_per_guest: float = 0.0
    overdue_task_count: int = 0
    total_task_count: int = 0
    completed_task_count: int = 0

    budget_items: List[BudgetItemOut] = []
    tasks: List[TaskOut] = []
    vendors: List[VendorOut] = []
    guests: List[GuestOut] = []
