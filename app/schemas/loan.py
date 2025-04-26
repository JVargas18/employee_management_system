from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.loan import LoanStatus, LoanType

class LoanBase(BaseModel):
    user_id: int
    loan_type: LoanType
    amount: float
    interest_rate: float
    term_months: int
    purpose: str

class LoanCreate(LoanBase):
    loan_number: Optional[str] = None

class LoanUpdate(BaseModel):
    status: Optional[LoanStatus] = None
    approved_by: Optional[int] = None
    next_payment_date: Optional[datetime] = None

class LoanInDB(LoanBase):
    id: int
    loan_number: str
    status: LoanStatus
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    disbursed_at: Optional[datetime] = None
    next_payment_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Loan(LoanInDB):
    pass