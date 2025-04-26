from sqlalchemy import Boolean, Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    ASSOCIATE = "associate"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(String, default=UserRole.ASSOCIATE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    accounts = relationship("Account", back_populates="user")
    loans = relationship("Loan", back_populates="user")
    
    def full_name(self):
        return f"{self.first_name} {self.last_name}"