from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.transaction import TransactionType

class TransactionBase(BaseModel):
    account_id: int
    amount: float
    transaction_type: TransactionType
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    reference_id: Optional[str] = None

class TransactionInDB(TransactionBase):
    id: int
    reference_id: str
    created_at: datetime

    class Config:
        orm_mode = True

class Transaction(TransactionInDB):
    pass