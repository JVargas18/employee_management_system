from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.user import User, UserRole
from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionType
from app.schemas.account import Account as AccountSchema, AccountCreate, AccountUpdate
from app.schemas.transaction import TransactionCreate, Transaction as TransactionSchema
from app.routers.auth import get_current_active_user, get_admin_user

router = APIRouter(
    prefix="/accounts",
    tags=["Accounts"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/", response_model=List[AccountSchema])
async def read_accounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Admin can see all accounts, others only see their own
    if current_user.role == UserRole.ADMIN:
        accounts = db.query(Account).offset(skip).limit(limit).all()
    else:
        accounts = db.query(Account).filter(Account.user_id == current_user.id).offset(skip).limit(limit).all()
    return accounts

@router.get("/{account_id}", response_model=AccountSchema)
async def read_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if db_account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Check if user has permission to view this account
    if current_user.role != UserRole.ADMIN and db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this account"
        )
    
    return db_account

@router.post("/", response_model=AccountSchema, status_code=status.HTTP_201_CREATED)
async def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Generate account number if not provided
    if not account.account_number:
        account.account_number = f"ACC-{uuid.uuid4().hex[:8].upper()}"
    
    # Create new account
    db_account = Account(**account.dict())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    # If initial balance, create deposit transaction
    if account.balance > 0:
        transaction = TransactionCreate(
            account_id=db_account.id,
            amount=account.balance,
            transaction_type=TransactionType.DEPOSIT,
            description="Initial deposit",
            reference_id=f"INIT-{uuid.uuid4().hex[:6].upper()}"
        )
        
        db_transaction = Transaction(**transaction.dict())
        db.add(db_transaction)
        db.commit()
    
    return db_account

@router.put("/{account_id}", response_model=AccountSchema)
async def update_account(
    account_id: int,
    account: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if db_account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Check if user has permission to update this account
    if current_user.role != UserRole.ADMIN and db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this account"
        )
    
    # Update account fields if provided
    account_data = account.dict(exclude_unset=True)
    for key, value in account_data.items():
        setattr(db_account, key, value)
    
    db.commit()
    db.refresh(db_account)
    return db_account

@router.post("/{account_id}/transactions", response_model=TransactionSchema)
async def create_transaction(
    account_id: int,
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if db_account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Check if user has permission to create transaction for this account
    if current_user.role != UserRole.ADMIN and db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create transactions for this account"
        )
    
    # Check if account has enough balance for withdrawal
    if transaction.transaction_type == TransactionType.WITHDRAWAL and db_account.balance < transaction.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance"
        )
    
    # Generate reference ID if not provided
    if not transaction.reference_id:
        transaction.reference_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    
    # Create transaction
    db_transaction = Transaction(**transaction.dict())
    db.add(db_transaction)
    
    # Update account balance
    if transaction.transaction_type == TransactionType.DEPOSIT:
        db_account.balance += transaction.amount
    elif transaction.transaction_type == TransactionType.WITHDRAWAL:
        db_account.balance -= transaction.amount
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/{account_id}/transactions", response_model=List[TransactionSchema])
async def read_account_transactions(
    account_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if db_account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Check if user has permission to view transactions for this account
    if current_user.role != UserRole.ADMIN and db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view transactions for this account"
        )
    
    transactions = db.query(Transaction).filter(
        Transaction.account_id == account_id
    ).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    return transactions