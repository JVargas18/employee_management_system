from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base

class AccountType(str, enum.Enum):
    SAVINGS = "savings"
    CHECKING = "checking"
    INVESTMENT = "investment"

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    account_type = Column(String, default=AccountType.SAVINGS)
    balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="accounts")
    client = relationship("Client", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")