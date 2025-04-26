from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, UserRole
from app.models.loan import Loan, LoanStatus, LoanType
from app.models.loan_payment import LoanPayment
from app.models.account import Account
from app.models.transaction import Transaction, TransactionType
from app.schemas.loan import Loan as LoanSchema, LoanCreate, LoanUpdate
from app.schemas.loan_payment import LoanPayment as LoanPaymentSchema, LoanPaymentCreate
from app.routers.auth import get_current_active_user, get_admin_user

router = APIRouter(
    prefix="/loans",
    tags=["Loans"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/", response_model=List[LoanSchema])
async def read_loans(
    skip: int = 0,
    limit: int = 100,
    status: LoanStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Build query
    query = db.query(Loan)
    
    # Filter by status if provided
    if status:
        query = query.filter(Loan.status == status)
    
    # Admin can see all loans, others only see their own
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Loan.user_id == current_user.id)
    
    loans = query.order_by(Loan.created_at.desc()).offset(skip).limit(limit).all()
    return loans

@router.get("/{loan_id}", response_model=LoanSchema)
async def read_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Check if user has permission to view this loan
    if current_user.role != UserRole.ADMIN and db_loan.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this loan"
        )
    
    return db_loan

@router.post("/", response_model=LoanSchema, status_code=status.HTTP_201_CREATED)
async def create_loan(
    loan: LoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Users can only create loans for themselves unless they are admin
    if current_user.role != UserRole.ADMIN and loan.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create loan for other users"
        )
    
    # Generate loan number if not provided
    if not loan.loan_number:
        loan.loan_number = f"LOAN-{uuid.uuid4().hex[:8].upper()}"
    
    # Create new loan
    db_loan = Loan(**loan.dict())
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    
    return db_loan

@router.put("/{loan_id}", response_model=LoanSchema)
async def update_loan(
    loan_id: int,
    loan: LoanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Check permissions for updating loan status
    if loan.status and loan.status != db_loan.status:
        # Only admins can approve, reject, or mark as paid
        if loan.status in [LoanStatus.APPROVED, LoanStatus.REJECTED, LoanStatus.PAID, LoanStatus.DEFAULTED]:
            if current_user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Not enough permissions to change loan status to {loan.status}"
                )
            
            # Set approved_by and approved_at if loan is being approved
            if loan.status == LoanStatus.APPROVED:
                loan.approved_by = current_user.id
                setattr(db_loan, "approved_at", datetime.now())
                
                # Set next payment date (usually 30 days from approval)
                if not loan.next_payment_date:
                    setattr(db_loan, "next_payment_date", datetime.now() + timedelta(days=30))
                    
                # Set disbursed date
                setattr(db_loan, "disbursed_at", datetime.now())
    
    # Update loan fields if provided
    loan_data = loan.dict(exclude_unset=True)
    for key, value in loan_data.items():
        setattr(db_loan, key, value)
    
    db.commit()
    db.refresh(db_loan)
    return db_loan

@router.post("/{loan_id}/payments", response_model=LoanPaymentSchema)
async def create_loan_payment(
    loan_id: int,
    payment: LoanPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Check if loan is in active status
    if db_loan.status != LoanStatus.ACTIVE and db_loan.status != LoanStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot make payment on loan with status {db_loan.status}"
        )
    
    # Generate receipt number if not provided
    if not payment.receipt_number:
        payment.receipt_number = f"RCPT-{uuid.uuid4().hex[:8].upper()}"
    
    # Create new payment
    db_payment = LoanPayment(**payment.dict())
    db.add(db_payment)
    
    # Update loan status if needed
    # This is a simplified approach; in a real system you'd check total paid amount vs. loan amount
    total_paid = sum([p.amount for p in db_loan.payments]) + payment.amount
    if total_paid >= db_loan.amount * (1 + db_loan.interest_rate):
        db_loan.status = LoanStatus.PAID
    else:
        # Set next payment date (usually 30 days from current payment)
        db_loan.next_payment_date = datetime.now() + timedelta(days=30)
        db_loan.status = LoanStatus.ACTIVE
    
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.get("/{loan_id}/payments", response_model=List[LoanPaymentSchema])
async def read_loan_payments(
    loan_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if db_loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Check if user has permission to view payments for this loan
    if current_user.role != UserRole.ADMIN and db_loan.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view payments for this loan"
        )
    
    payments = db.query(LoanPayment).filter(
        LoanPayment.loan_id == loan_id
    ).order_by(LoanPayment.payment_date.desc()).offset(skip).limit(limit).all()
    
    return payments