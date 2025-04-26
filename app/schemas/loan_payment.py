from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class LoanPaymentBase(BaseModel):
    loan_id: int
    amount: float
    principal_amount: float
    interest_amount: float
    payment_date: datetime
    payment_method: str
    notes: Optional[str] = None

class LoanPaymentCreate(LoanPaymentBase):
    receipt_number: Optional[str] = None

class LoanPaymentInDB(LoanPaymentBase):
    id: int
    receipt_number: str
    created_at: datetime

    class Config:
        orm_mode = True

class LoanPayment(LoanPaymentInDB):
    pass