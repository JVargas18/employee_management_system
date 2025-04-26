from flask import Flask, jsonify, request, session
from flask_cors import CORS
import sqlite3
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)

# Database setup
def get_db_connection():
    conn = sqlite3.connect('employee_fund.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        account_number TEXT UNIQUE NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        account_type TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        amount REAL NOT NULL,
        interest_rate REAL NOT NULL,
        term_months INTEGER NOT NULL,
        status TEXT NOT NULL,
        approved_by TEXT,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id),
        FOREIGN KEY (approved_by) REFERENCES users (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id)
    )
    ''')
    
    # Create admin user if not exists
    cursor.execute("SELECT * FROM users WHERE username = 'admin'")
    admin = cursor.fetchone()
    
    if not admin:
        admin_id = str(uuid.uuid4())
        hashed_password = generate_password_hash('admin123')
        cursor.execute(
            "INSERT INTO users (id, username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?, ?)",
            (admin_id, 'admin', hashed_password, 'admin@example.com', 'Administrator', 'admin')
        )
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'full_name': user['full_name'],
            'role': user['role']
        }), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    full_name = data.get('full_name')
    role = data.get('role', 'user')
    
    # Validate input
    if not username or not password or not email or not full_name:
        return jsonify({'error': 'All fields are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if username or email already exists
    cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, email))
    existing_user = cursor.fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({'error': 'Username or email already exists'}), 409
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = generate_password_hash(password)
    
    try:
        cursor.execute(
            "INSERT INTO users (id, username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, username, hashed_password, email, full_name, role)
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': user_id,
            'username': username,
            'email': email,
            'full_name': full_name,
            'role': role
        }), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/clients', methods=['GET'])
def get_clients():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM clients")
    clients = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(client) for client in clients]), 200

@app.route('/api/clients', methods=['POST'])
def create_client():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')
    user_id = session.get('user_id')
    
    if not name or not email:
        return jsonify({'error': 'Name and email are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if email already exists
    cursor.execute("SELECT * FROM clients WHERE email = ?", (email,))
    existing_client = cursor.fetchone()
    
    if existing_client:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 409
    
    # Create new client
    client_id = str(uuid.uuid4())
    
    try:
        cursor.execute(
            "INSERT INTO clients (id, name, email, phone, address, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            (client_id, name, email, phone, address, user_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': client_id,
            'name': name,
            'email': email,
            'phone': phone,
            'address': address,
            'user_id': user_id
        }), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT a.*, c.name as client_name 
    FROM accounts a 
    JOIN clients c ON a.client_id = c.id
    ''')
    accounts = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(account) for account in accounts]), 200

@app.route('/api/accounts', methods=['POST'])
def create_account():
    data = request.get_json()
    client_id = data.get('client_id')
    account_type = data.get('account_type')
    initial_balance = data.get('initial_balance', 0)
    
    if not client_id or not account_type:
        return jsonify({'error': 'Client ID and account type are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if client exists
    cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
    client = cursor.fetchone()
    
    if not client:
        conn.close()
        return jsonify({'error': 'Client not found'}), 404
    
    # Generate account number
    account_number = f"ACC-{uuid.uuid4().hex[:8].upper()}"
    account_id = str(uuid.uuid4())
    
    try:
        # Create account
        cursor.execute(
            "INSERT INTO accounts (id, client_id, account_number, balance, account_type, status) VALUES (?, ?, ?, ?, ?, ?)",
            (account_id, client_id, account_number, initial_balance, account_type, 'active')
        )
        
        # Create initial deposit transaction if balance > 0
        if float(initial_balance) > 0:
            transaction_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO transactions (id, account_id, amount, transaction_type, description) VALUES (?, ?, ?, ?, ?)",
                (transaction_id, account_id, initial_balance, 'deposit', 'Initial deposit')
            )
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': account_id,
            'client_id': client_id,
            'account_number': account_number,
            'balance': initial_balance,
            'account_type': account_type,
            'status': 'active'
        }), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/loans', methods=['GET'])
def get_loans():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT l.*, a.account_number, c.name as client_name 
    FROM loans l 
    JOIN accounts a ON l.account_id = a.id 
    JOIN clients c ON a.client_id = c.id
    ''')
    loans = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(loan) for loan in loans]), 200

@app.route('/api/loans', methods=['POST'])
def create_loan():
    data = request.get_json()
    account_id = data.get('account_id')
    amount = data.get('amount')
    interest_rate = data.get('interest_rate')
    term_months = data.get('term_months')
    
    if not account_id or not amount or not interest_rate or not term_months:
        return jsonify({'error': 'All fields are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if account exists
    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    account = cursor.fetchone()
    
    if not account:
        conn.close()
        return jsonify({'error': 'Account not found'}), 404
    
    # Create loan
    loan_id = str(uuid.uuid4())
    
    try:
        cursor.execute(
            "INSERT INTO loans (id, account_id, amount, interest_rate, term_months, status) VALUES (?, ?, ?, ?, ?, ?)",
            (loan_id, account_id, amount, interest_rate, term_months, 'pending')
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': loan_id,
            'account_id': account_id,
            'amount': amount,
            'interest_rate': interest_rate,
            'term_months': term_months,
            'status': 'pending'
        }), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/loans/<loan_id>/approve', methods=['POST'])
def approve_loan(loan_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if loan exists
    cursor.execute("SELECT * FROM loans WHERE id = ?", (loan_id,))
    loan = cursor.fetchone()
    
    if not loan:
        conn.close()
        return jsonify({'error': 'Loan not found'}), 404
    
    if loan['status'] != 'pending':
        conn.close()
        return jsonify({'error': 'Loan is not pending approval'}), 400
    
    # Get account
    cursor.execute("SELECT * FROM accounts WHERE id = ?", (loan['account_id'],))
    account = cursor.fetchone()
    
    # Update loan status
    try:
        cursor.execute(
            "UPDATE loans SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?",
            ('approved', user_id, loan_id)
        )
        
        # Add loan amount to account balance
        new_balance = account['balance'] + loan['amount']
        cursor.execute(
            "UPDATE accounts SET balance = ? WHERE id = ?",
            (new_balance, loan['account_id'])
        )
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO transactions (id, account_id, amount, transaction_type, description) VALUES (?, ?, ?, ?, ?)",
            (transaction_id, loan['account_id'], loan['amount'], 'loan', f"Loan approved: {loan_id}")
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Loan approved successfully'}), 200
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    account_id = request.args.get('account_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if account_id:
        cursor.execute("SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC", (account_id,))
    else:
        cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC")
    
    transactions = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(transaction) for transaction in transactions]), 200

@app.route('/api/reports/loans', methods=['GET'])
def loan_reports():
    status = request.args.get('status')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if status:
        cursor.execute('''
        SELECT l.*, a.account_number, c.name as client_name 
        FROM loans l 
        JOIN accounts a ON l.account_id = a.id 
        JOIN clients c ON a.client_id = c.id
        WHERE l.status = ?
        ''', (status,))
    else:
        cursor.execute('''
        SELECT l.*, a.account_number, c.name as client_name 
        FROM loans l 
        JOIN accounts a ON l.account_id = a.id 
        JOIN clients c ON a.client_id = c.id
        ''')
    
    loans = cursor.fetchall()
    
    # Get summary stats
    cursor.execute('''
    SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_loans,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_loans,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_loans,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount
    FROM loans
    ''')
    summary = cursor.fetchone()
    
    conn.close()
    
    return jsonify({
        'loans': [dict(loan) for loan in loans],
        'summary': dict(summary)
    }), 200

@app.route('/api/user/dashboard', methods=['GET'])
def user_dashboard():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    
    # Get counts
    cursor.execute("SELECT COUNT(*) as total_clients FROM clients")
    clients_count = cursor.fetchone()['total_clients']
    
    cursor.execute("SELECT COUNT(*) as total_accounts FROM accounts")
    accounts_count = cursor.fetchone()['total_accounts']
    
    cursor.execute("SELECT COUNT(*) as total_loans FROM loans")
    loans_count = cursor.fetchone()['total_loans']
    
    cursor.execute("SELECT SUM(balance) as total_balance FROM accounts")
    total_balance = cursor.fetchone()['total_balance'] or 0
    
    # Get recent loans
    cursor.execute('''
    SELECT l.*, a.account_number, c.name as client_name 
    FROM loans l 
    JOIN accounts a ON l.account_id = a.id 
    JOIN clients c ON a.client_id = c.id
    ORDER BY l.created_at DESC LIMIT 5
    ''')
    recent_loans = cursor.fetchall()
    
    # Get recent transactions
    cursor.execute('''
    SELECT t.*, a.account_number
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    ORDER BY t.created_at DESC LIMIT 5
    ''')
    recent_transactions = cursor.fetchall()
    
    conn.close()
    
    return jsonify({
        'user': dict(user) if user else None,
        'stats': {
            'clients_count': clients_count,
            'accounts_count': accounts_count,
            'loans_count': loans_count,
            'total_balance': total_balance
        },
        'recent_loans': [dict(loan) for loan in recent_loans],
        'recent_transactions': [dict(transaction) for transaction in recent_transactions]
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)