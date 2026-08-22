-- Dayflow HRMS Relational Schema

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  login_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'employee')),
  company_id TEXT NOT NULL,
  must_change_password INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  job_position TEXT,
  department TEXT,
  manager_id TEXT,
  location TEXT DEFAULT 'Headquarters',
  date_of_joining DATE NOT NULL,
  mobile TEXT,
  personal_email TEXT,
  dob DATE,
  gender TEXT,
  marital_status TEXT,
  nationality TEXT DEFAULT 'Indian',
  address TEXT,
  profile_picture TEXT,
  resume_about TEXT,
  resume_love TEXT,
  resume_hobbies TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bank_details (
  id TEXT PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  account_number TEXT,
  bank_name TEXT,
  ifsc_code TEXT,
  pan_no TEXT,
  uan_no TEXT,
  emp_code TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salary_structures (
  id TEXT PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  wage_type TEXT DEFAULT 'Fixed wage',
  monthly_wage REAL NOT NULL DEFAULT 50000.00,
  yearly_wage REAL NOT NULL DEFAULT 600000.00,
  working_days_per_week INTEGER DEFAULT 5,
  break_time_hours REAL DEFAULT 1.0,
  basic_pct REAL DEFAULT 50.00,
  hra_pct REAL DEFAULT 50.00,
  standard_allowance_pct REAL DEFAULT 16.67,
  performance_bonus_pct REAL DEFAULT 8.33,
  lta_pct REAL DEFAULT 8.33,
  fixed_allowance_amount REAL DEFAULT 2918.00,
  pf_employee_pct REAL DEFAULT 12.00,
  pf_employer_pct REAL DEFAULT 12.00,
  professional_tax REAL DEFAULT 200.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  date DATE NOT NULL,
  check_in TEXT,
  check_out TEXT,
  work_hours TEXT,
  extra_hours TEXT,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'on_leave', 'half_day')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_types (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_paid INTEGER DEFAULT 1,
  default_days REAL DEFAULT 24.0,
  requires_attachment INTEGER DEFAULT 0,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  leave_type_id TEXT NOT NULL,
  days_available REAL NOT NULL DEFAULT 0,
  days_used REAL NOT NULL DEFAULT 0,
  UNIQUE(employee_id, leave_type_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  leave_type_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count REAL NOT NULL,
  attachment_url TEXT,
  reason TEXT,
  status TEXT DEFAULT 'to_approve' CHECK (status IN ('to_approve', 'validated', 'refused')),
  approver_id TEXT,
  approver_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payslips (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  monthly_wage REAL NOT NULL,
  payable_days REAL NOT NULL,
  total_working_days REAL NOT NULL,
  basic REAL NOT NULL,
  hra REAL NOT NULL,
  standard_allowance REAL NOT NULL,
  performance_bonus REAL NOT NULL,
  lta REAL NOT NULL,
  fixed_allowance REAL NOT NULL,
  gross_salary REAL NOT NULL,
  pf_employee REAL NOT NULL,
  pf_employer REAL NOT NULL,
  professional_tax REAL NOT NULL,
  total_deductions REAL NOT NULL,
  net_salary REAL NOT NULL,
  status TEXT DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'paid')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, month, year),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_req_emp ON leave_requests(employee_id);
