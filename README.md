# ERP-2026 Workflow
**Tech Stack:** Laravel 12, React (Inertia.js), Tailwind CSS  
**Authentication:** Role-Based Access Control (RBAC)

## Overview
ERP-2026 Workflow is built using Laravel 12 with the official Laravel 12 Starter Kit (React + Inertia.js).  
React is integrated by default using Inertia.js, and the UI is developed using Tailwind CSS along with Laravel’s inbuilt components.

The project demonstrates a complete role-based order management workflow with security, activity tracking, and approval controls.

## Local Setup Instructions
1. Clone the project from the public Git repository.
2. Import the provided database file.
3. Configure the `.env` file with database credentials.
4. Run migrations (if required) and start the Laravel server.
This setup will allow the project to run correctly in a local environment.

## Key Features

### 1. Role-Based Authentication
- User registration includes a role selection dropdown.
- Roles available: Sales, Manager, Accounts.
- Role assignment is done at the time of user registration.

### 2. Role-Based Order Permissions
- **Sales User:**
  - Can create, edit, and delete orders.
- **Manager User:**
  - Can approve or reject orders.
  - Cannot create, edit, delete, or mark orders as paid.
- **Accounts User:**
  - Can only mark orders as paid.

### 3. UI-Level Access Control
- Action buttons are shown or hidden based on user roles.
- Implemented using `auth.user.role` conditions to prevent unauthorized actions at the UI level.

### 4. Order Approval Control
- An `approved_by` column is added to the orders table.
- This ensures:
  - Only one manager can approve or reject an order.
  - Multiple managers cannot act on the same order simultaneously.

### 5. Activity Logs
- Each order includes an activity log button.
- Tracks:
  - Order creation
  - Updates
  - Approval or rejection
  - Payment marking
- Logs record which user performed each action.

### 6. Centralized Activity Log Module
- A separate menu is created for viewing all order-related activities.
- Allows users to track complete order histories across the system.

## Security Considerations
- Users can only perform actions permitted by their assigned role.
- Unauthorized actions are restricted both at the UI level and logically at the workflow level.
- Approval logic prevents duplicate or conflicting manager actions on the same order.

## Test Users (For Demo)

**Sales User:**
- Name: Aftab Mashakpautra
- Email: aftabmashakpautra@gmail.com
- Password: demo1admin

**Manager User:**
- Name: Ramiz Theba
- Email: ramiz@gmail.com
- Password: demo1admin

**Accounts User:**
- Name: Krunal Kandoliya
- Email: krunal@gmail.com
- Password: demo1admin
