# Dayflow — Human Resource Management System (HRMS)
> *"Every workday, perfectly aligned."*

A full-stack, enterprise-ready Human Resource Management System (HRMS) built to match the wireframes and specifications with high visual fidelity, relational integrity, role-based access control, and real-time attendance & payroll integration.

---

## 🌟 Tech Stack & Architecture

- **Frontend:** React 18, React Router v6, Tailwind CSS, Lucide Icons, Canvas Confetti, Axios.
- **Backend:** Node.js, Express, JWT Auth, Bcrypt, Multer (file uploads), PDFKit (payslip generation).
- **Database:** Relational SQLite / PostgreSQL with foreign key enforcement and relational schema.
- **Styling Aesthetic:** Dark slate wireframe theme (`#0d1117`, `#161b22`, purple `#8b5cf6` action buttons, status badges: 🟢 Present, ✈️ On Leave, 🟡 Absent).

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 2. Seed Database
Seeds default organization (**Zooz**), default leave policies, Admin, and realistic employee profiles with skills, certifications, bank details, attendance logs, and salary structures.
```bash
npm run seed
```

### 3. Run Development Servers
Starts both Backend API (Port 5000) and Frontend (Port 3000) concurrently:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Default Credentials (Ready for Demo)

| Role | Login ID / Email | Password | Access |
|---|---|---|---|
| **Admin / HR Officer** | `ZOADMI20220001` or `admin@zooz.com` | `admin123` | Full access, Employee Creation, Salary Info, Leave Approvals, Payroll & Reports |
| **Standard Employee** | `ZOJODO20220001` or `john.doe@zooz.com` | `password123` | Self profile, Check In/Out, Monthly Attendance, Leave Calendar, View Payslips |

---

## 📋 Features Implemented (Matching All 8 Wireframes)

### 1. Authentication & Auto-Provisioning
- **Company Sign-Up:** Initial registration for company and admin setup with logo upload.
- **Sign-In:** Single sign-in portal accepting either Login ID or Email + Password.
- **Auto Login ID Format:** Enforces `[Company Code][First 2 of first name + First 2 of last name][Year][Serial]` (e.g. `ZOJODO20260001`).
- **Temporary Password Generator:** Auto-generates secure temp passwords for newly hired employees created by Admin.

### 2. Post-Login Landing & Systray (Wireframes 1 & 2)
- **Top Navigation Bar:** Company logo, Navigation tabs (`Employees | Attendance | Time Off | Payroll | Reports`), User Avatar with status dot, and Notification Bell with unread badges.
- **Check In / Check Out Systray:**
  - Red dot initially + `Check In →`
  - On click: red dot transitions to green 🟢, button changes to `Check Out →` and displays `Since [HH:MM AM/PM]`.
  - On check out: logs duration, work hours, and extra hours (>8 hrs) into database.
- **Employees Grid:** 3 cards per row with profile picture, name, designation, department, and live status indicator:
  - 🟢 Green: Present in the office
  - ✈️ Airplane: On approved leave
  - 🟡 Yellow: Absent (not checked in, no leave)
- **Clickable Cards:** View-only for employees; Admin can toggle into full edit mode.

### 3. Employee Profile ("My Profile" — Wireframes 3 & 4)
- **Header:** Avatar, Full Name, Login ID, Work Email, Mobile, Company, Department, Manager, Location.
- **Resume Tab:** Free-text editors for *About*, *What I love about my job*, *Interests & hobbies*, dynamic *Skills* (+ Add Skills) and *Certifications* (+ Add Cert).
- **Private Info Tab:** Personal details (DOB, Residing Address, Nationality, Personal Email, Gender, Marital Status, Date of Joining) and Bank Details (Account #, Bank Name, IFSC, PAN, UAN, Emp Code). Role-based edit restrictions enforced.
- **Salary Info Tab (Admin Only):**
  - Monthly Wage & Yearly Wage (Wage × 12)
  - Auto-recalculating Salary Components: Basic Salary (50%), HRA (50% of Basic), Standard Allowance (16.67% of Basic), Performance Bonus (8.33% of Basic), LTA (8.33% of Basic), Fixed Allowance (Remainder = Wage − sum of others).
  - Provident Fund (PF): 12% Employee + 12% Employer on Basic.
  - Professional Tax: ₹200/month.
- **Security Tab:** Password change and session management.

### 4. Attendance Module (Wireframes 5 & 8)
- **Admin Daily View:** Day navigation (`← →`, date selector, Day view toggle), search bar, and employee attendance logs (`Emp | Check In | Check Out | Work Hours | Extra Hours`).
- **Employee Monthly View:** Month selector (`← →`, month dropdown), KPI summary tiles (*Count of days present*, *Leaves count*, *Total working days*), and day-wise attendance log.

### 5. Time Off (Leave) Module (Wireframes 6 & 7)
- **Admin View:** `Time Off | Allocation` subtabs, balance summary cards (*Paid time off: 24 Days Available*, *Sick time off: 07 Days Available*), table with Reject (red) and Approve (green) action buttons with comment popups.
- **Employee View:** Balance summary cards, `NEW` button opening the **Time off Type Request** modal (pre-filled employee, leave type dropdown, validity date range, dynamic day count calculation, mandatory attachment for sick leave, submit/discard buttons).
- **Full-Year Calendar View:** 12-month visual calendar with day status indicators:
  - 🟩 Validated
  - 🟨 To Approve
  - 🟥 Refused
  - Public Holidays list (Kite Festival, Republic Day, Holi, Independence Day, Rakhi, Gandhi Jayanti, Diwali, New Year, Bhai Duj).

### 6. Payroll & PDF Payslips
- Attendance-driven payable days calculation feeding into salary generation.
- Prorated earnings, PF, and Professional Tax deductions.
- Downloadable high-fidelity PDF Payslips.

### 7. Notifications & Analytics Reports
- In-app notification bell with categorized alerts.
- HR KPI Dashboard: Headcount, attendance rates, leave breakdown, monthly payroll expense, department distribution.
- Attendance CSV report export.
