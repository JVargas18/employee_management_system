# Employee Fund Management System

A comprehensive web application for managing an employee fund, including user registration, client management, account management, and loan reporting.

## Features

- User authentication system with registration and login
- Client management for adding and tracking clients
- Account management for different types of accounts (savings, checking, credit)
- Loan application and approval system
- Comprehensive reporting dashboard with data visualization
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts
- **Backend**: Python, Flask, SQLite
- **State Management**: React Context API
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js
- Python 3.x

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```
   npm install
   ```
3. Set up Python environment:
   ```
   pip install flask flask-cors werkzeug
   ```

### Running the Application

1. Start the backend server:
   ```
   npm run server
   ```

2. Start the frontend development server:
   ```
   npm run dev
   ```

3. Access the application at http://localhost:5173

## Default Admin Account

- **Username**: admin
- **Password**: admin123

## Project Structure

- `/api` - Python backend code and SQLite database
- `/src` - React frontend
  - `/components` - Reusable UI components
  - `/context` - Context providers for state management
  - `/pages` - Main application pages

## License

This project is open-source.