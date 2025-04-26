from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.account import AccountType

class AccountBase(BaseModel):
    user_id: int
    client_id: int
    account_type: AccountType = AccountType.SAVINGS

class AccountCreate(AccountBase):
    account_number: Optional[str] = None
    balance: float = 0.0

class AccountUpdate(BaseModel):
    account_type: Optional[AccountType] = None
    is_active: Optional[bool] = None

class AccountInDB(AccountBase):
    id: int
    account_number: str
    balance: float
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Account(AccountInDB):
    pass