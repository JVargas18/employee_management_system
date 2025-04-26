from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base

class LoanStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    PAID = "paid"
    DEFAULTED = "defaulted"

class LoanType(str, enum.Enum):
    PERSONAL = "personal"
    EDUCATION = "education"
    HOUSING = "housing"
    EMERGENCY = "emergency"
    BUSINESS = "business"

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    loan_number = Column(String, unique=True, index=True)
    loan_type = Column(String)
    amount = Column(Float)
    interest_rate = Column(Float)
    term_months = Column(Integer)
    status = Column(String, default=LoanStatus.PENDING)
    purpose = Column(Text)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    disbursed_at = Column(DateTime(timezone=True), nullable=True)
    next_payment_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="loans")
    approver = relationship("User", foreign_keys=[approved_by])
    payments = relationship("LoanPayment", back_populates="loan")