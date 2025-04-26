from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

class ClientBase(BaseModel):
    name: str
    contact_person: str
    email: EmailStr
    phone: str
    address: str
    identification: str

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    identification: Optional[str] = None
    is_active: Optional[bool] = None

class ClientInDB(ClientBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class Client(ClientInDB):
    pass