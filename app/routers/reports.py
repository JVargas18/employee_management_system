from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import io
from enum import Enum

from app.database import get_db
from app.models.user import User, UserRole
from app.models.loan import Loan, LoanStatus, LoanType
from app.models.loan_payment import LoanPayment
from app.models.account import Account
from app.models.transaction import Transaction, TransactionType
from app.routers.auth import get_current_active_user, get_admin_user

# Define report types
class ReportType(str, Enum):
    LOAN_SUMMARY = "loan_summary"
    LOAN_PAYMENTS = "loan_payments"
    LOAN_STATUS = "loan_status"
    ACCOUNT_SUMMARY = "account_summary"
    TRANSACTION_SUMMARY = "transaction_summary"

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/", response_model=Dict[str, Any])
async def get_report_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is admin or staff
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access reports"
        )
    
    # Get current date
    today = datetime.now()
    
    # Get loan statistics
    total_loans = db.query(func.count(Loan.id)).scalar()
    active_loans = db.query(func.count(Loan.id)).filter(
        Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.APPROVED])
    ).scalar()
    loan_amount = db.query(func.sum(Loan.amount)).filter(
        Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.APPROVED, LoanStatus.PAID])
    ).scalar() or 0
    
    # Get account statistics
    total_accounts = db.query(func.count(Account.id)).scalar()
    total_balance = db.query(func.sum(Account.balance)).scalar() or 0
    
    # Get payment statistics
    total_payments = db.query(func.sum(LoanPayment.amount)).scalar() or 0
    
    # Get monthly loan distribution
    month_loans = db.query(
        extract('month', Loan.created_at).label('month'),
        func.count(Loan.id).label('count')
    ).filter(
        Loan.created_at >= today - timedelta(days=365)
    ).group_by('month').all()
    
    month_loan_dict = {month: 0 for month in range(1, 13)}
    for month, count in month_loans:
        month_loan_dict[int(month)] = count
    
    # Get loan status distribution
    loan_status_dist = db.query(
        Loan.status,
        func.count(Loan.id).label('count')
    ).group_by(Loan.status).all()
    
    loan_status_dict = {status.value: 0 for status in LoanStatus}
    for status, count in loan_status_dist:
        loan_status_dict[status] = count
    
    # Get loan type distribution
    loan_type_dist = db.query(
        Loan.loan_type,
        func.count(Loan.id).label('count')
    ).group_by(Loan.loan_type).all()
    
    loan_type_dict = {loan_type.value: 0 for loan_type in LoanType}
    for loan_type, count in loan_type_dist:
        loan_type_dict[loan_type] = count
    
    # Return aggregated data
    return {
        "loan_statistics": {
            "total_loans": total_loans,
            "active_loans": active_loans,
            "loan_amount": loan_amount,
            "monthly_distribution": month_loan_dict,
            "status_distribution": loan_status_dict,
            "type_distribution": loan_type_dict
        },
        "account_statistics": {
            "total_accounts": total_accounts,
            "total_balance": total_balance
        },
        "payment_statistics": {
            "total_payments": total_payments
        }
    }

@router.get("/export", response_class=Response)
async def export_report(
    report_type: ReportType,
    start_date: datetime = None,
    end_date: datetime = None,
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is admin or staff
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to export reports"
        )
    
    # Set default dates if not provided
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Generate report based on type
    data = None
    
    if report_type == ReportType.LOAN_SUMMARY:
        loans = db.query(
            Loan.id,
            Loan.loan_number,
            Loan.loan_type,
            Loan.amount,
            Loan.interest_rate,
            Loan.term_months,
            Loan.status,
            Loan.created_at,
            User.first_name.label('user_first_name'),
            User.last_name.label('user_last_name')
        ).join(User, Loan.user_id == User.id).filter(
            Loan.created_at.between(start_date, end_date)
        ).all()
        
        # Convert to DataFrame
        columns = ['id', 'loan_number', 'loan_type', 'amount', 'interest_rate', 
                  'term_months', 'status', 'created_at', 'user_first_name', 'user_last_name']
        data = pd.DataFrame([{c: getattr(loan, c) for c in columns} for loan in loans])
    
    elif report_type == ReportType.LOAN_PAYMENTS:
        payments = db.query(
            LoanPayment.id,
            LoanPayment.receipt_number,
            LoanPayment.amount,
            LoanPayment.principal_amount,
            LoanPayment.interest_amount,
            LoanPayment.payment_date,
            LoanPayment.payment_method,
            Loan.loan_number,
            User.first_name.label('user_first_name'),
            User.last_name.label('user_last_name')
        ).join(Loan, LoanPayment.loan_id == Loan.id
        ).join(User, Loan.user_id == User.id
        ).filter(
            LoanPayment.payment_date.between(start_date, end_date)
        ).all()
        
        # Convert to DataFrame
        columns = ['id', 'receipt_number', 'amount', 'principal_amount', 'interest_amount', 
                  'payment_date', 'payment_method', 'loan_number', 'user_first_name', 'user_last_name']
        data = pd.DataFrame([{c: getattr(payment, c) for c in columns} for payment in payments])
    
    elif report_type == ReportType.LOAN_STATUS:
        loans = db.query(
            Loan.status,
            func.count(Loan.id).label('count'),
            func.sum(Loan.amount).label('total_amount')
        ).group_by(Loan.status).all()
        
        # Convert to DataFrame
        data = pd.DataFrame([{
            'status': loan.status, 
            'count': loan.count, 
            'total_amount': loan.total_amount
        } for loan in loans])
    
    elif report_type == ReportType.ACCOUNT_SUMMARY:
        accounts = db.query(
            Account.id,
            Account.account_number,
            Account.account_type,
            Account.balance,
            Account.created_at,
            User.first_name.label('user_first_name'),
            User.last_name.label('user_last_name')
        ).join(User, Account.user_id == User.id).all()
        
        # Convert to DataFrame
        columns = ['id', 'account_number', 'account_type', 'balance', 
                  'created_at', 'user_first_name', 'user_last_name']
        data = pd.DataFrame([{c: getattr(account, c) for c in columns} for account in accounts])
    
    elif report_type == ReportType.TRANSACTION_SUMMARY:
        transactions = db.query(
            Transaction.id,
            Transaction.reference_id,
            Transaction.transaction_type,
            Transaction.amount,
            Transaction.description,
            Transaction.created_at,
            Account.account_number
        ).join(Account, Transaction.account_id == Account.id
        ).filter(
            Transaction.created_at.between(start_date, end_date)
        ).all()
        
        # Convert to DataFrame
        columns = ['id', 'reference_id', 'transaction_type', 'amount', 
                  'description', 'created_at', 'account_number']
        data = pd.DataFrame([{c: getattr(transaction, c) for c in columns} for transaction in transactions])
    
    # Handle case where no data is found
    if data is None or data.empty:
        return Response(content="No data available for the selected period", 
                       media_type="text/plain")
    
    # Convert DataFrame to requested format
    buffer = io.BytesIO()
    
    if format == "csv":
        csv_data = data.to_csv(index=False)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={report_type}_{start_date.date()}_{end_date.date()}.csv"
            }
        )
    elif format == "excel":
        data.to_excel(buffer, index=False)
        buffer.seek(0)
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={report_type}_{start_date.date()}_{end_date.date()}.xlsx"
            }
        )
    elif format == "json":
        json_data = data.to_json(orient="records")
        return Response(
            content=json_data,
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename={report_type}_{start_date.date()}_{end_date.date()}.json"
            }
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format: {format}"
        )