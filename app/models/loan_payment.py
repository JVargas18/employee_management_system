from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

class LoanPayment(Base):
    __tablename__ = "loan_payments"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"))
    amount = Column(Float)
    principal_amount = Column(Float)
    interest_amount = Column(Float)
    payment_date = Column(DateTime(timezone=True))
    receipt_number = Column(String, unique=True, index=True)
    payment_method = Column(String)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    loan = relationship("Loan", back_populates="payments")