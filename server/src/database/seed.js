const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { calculateSalaryBreakdown } = require('../utils/salaryCalculator');

async function seed() {
  console.log('Seeding Dayflow HRMS database...');

  try {
    // Wait a brief moment for initial schema execution
    await new Promise((r) => setTimeout(r, 200));

    // Clear existing tables in reverse dependency order
    await db.prepare(`DELETE FROM audit_logs`).run();
    await db.prepare(`DELETE FROM notifications`).run();
    await db.prepare(`DELETE FROM payslips`).run();
    await db.prepare(`DELETE FROM leave_requests`).run();
    await db.prepare(`DELETE FROM leave_balances`).run();
    await db.prepare(`DELETE FROM leave_types`).run();
    await db.prepare(`DELETE FROM attendance`).run();
    await db.prepare(`DELETE FROM salary_structures`).run();
    await db.prepare(`DELETE FROM bank_details`).run();
    await db.prepare(`DELETE FROM certifications`).run();
    await db.prepare(`DELETE FROM skills`).run();
    await db.prepare(`DELETE FROM employees`).run();
    await db.prepare(`DELETE FROM users`).run();
    await db.prepare(`DELETE FROM companies`).run();

    // 1. Create Company
    const companyId = 'company-odoo-india-001';
    await db.prepare(`
      INSERT INTO companies (id, name, code, logo_url, phone, email)
      VALUES (?, 'Odoo India', 'OI', '/uploads/company_logo.png', '+91 79 4000 3000', 'contact@odooindia.com')
    `).run(companyId);

    // 2. Create Leave Types
    const paidLeaveTypeId = 'lt-paid-001';
    const sickLeaveTypeId = 'lt-sick-002';
    const unpaidLeaveTypeId = 'lt-unpaid-003';

    await db.prepare(`INSERT INTO leave_types (id, company_id, name, is_paid, default_days, requires_attachment) VALUES (?, ?, 'Paid time off', 1, 24, 0)`).run(paidLeaveTypeId, companyId);
    await db.prepare(`INSERT INTO leave_types (id, company_id, name, is_paid, default_days, requires_attachment) VALUES (?, ?, 'Sick Leave', 1, 7, 1)`).run(sickLeaveTypeId, companyId);
    await db.prepare(`INSERT INTO leave_types (id, company_id, name, is_paid, default_days, requires_attachment) VALUES (?, ?, 'Unpaid Leaves', 0, 0, 0)`).run(unpaidLeaveTypeId, companyId);

    // Passwords
    const adminPassHash = bcrypt.hashSync('admin123', 10);
    const empPassHash = bcrypt.hashSync('password123', 10);

    // Employees Data
    const employeesData = [
      {
        userId: 'user-admin-001',
        empId: 'emp-admin-001',
        loginId: 'OIADMI20220001',
        email: 'admin@odooindia.com',
        passwordHash: adminPassHash,
        role: 'admin',
        firstName: 'Naveen',
        lastName: 'Aadhithya',
        jobPosition: 'Head of People & Operations',
        department: 'Management',
        location: 'Gandhinagar Tech Park',
        doj: '2022-01-10',
        mobile: '+91 98765 43210',
        dob: '1992-05-14',
        gender: 'Male',
        maritalStatus: 'Married',
        nationality: 'Indian',
        address: '102 Skyline Greens, Infocity, Gandhinagar, Gujarat',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        wage: 120000,
        skills: ['Strategic HR', 'Talent Acquisition', 'Payroll Compliance', 'Leadership', 'Odoo ERP'],
        certs: ['SHRM Senior Certified Professional (SHRM-SCP)', 'Certified Payroll Specialist'],
        pan: 'ABCDE1234F',
        bankName: 'HDFC Bank',
        accNo: '50100432987102',
        ifsc: 'HDFC0001234',
        uan: '101293847561'
      },
      {
        userId: 'user-emp-001',
        empId: 'emp-001',
        loginId: 'OIJODO20220001',
        email: 'john.doe@odooindia.com',
        passwordHash: empPassHash,
        role: 'employee',
        firstName: 'John',
        lastName: 'Doe',
        jobPosition: 'Lead Software Engineer',
        department: 'Engineering',
        location: 'Gandhinagar Tech Park',
        doj: '2022-03-15',
        mobile: '+91 98980 11223',
        dob: '1994-08-22',
        gender: 'Male',
        maritalStatus: 'Single',
        nationality: 'Indian',
        address: '404 Silicon Enclave, Bodakdev, Ahmedabad, Gujarat',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        wage: 50000,
        skills: ['React.js', 'Node.js', 'PostgreSQL', 'Python', 'System Architecture'],
        certs: ['AWS Certified Solutions Architect', 'Meta React Developer Professional'],
        pan: 'FGHIJ5678K',
        bankName: 'State Bank of India',
        accNo: '309871234567',
        ifsc: 'SBIN0005432',
        uan: '100876543219'
      },
      {
        userId: 'user-emp-002',
        empId: 'emp-002',
        loginId: 'OISAJE20230002',
        email: 'sarah.j@odooindia.com',
        passwordHash: empPassHash,
        role: 'employee',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        jobPosition: 'Senior UI/UX Designer',
        department: 'Design',
        location: 'Gandhinagar Tech Park',
        doj: '2023-06-01',
        mobile: '+91 97234 55667',
        dob: '1996-11-03',
        gender: 'Female',
        maritalStatus: 'Single',
        nationality: 'Indian',
        address: 'B-12 Palm Springs, SG Highway, Ahmedabad',
        profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        wage: 65000,
        skills: ['Figma', 'Design Systems', 'User Research', 'Wireframing', 'Prototyping'],
        certs: ['Google UX Design Professional Certificate', 'Nielsen Norman UX Master'],
        pan: 'KLMNO9012P',
        bankName: 'ICICI Bank',
        accNo: '001205098765',
        ifsc: 'ICIC0000012',
        uan: '101987654320'
      },
      {
        userId: 'user-emp-003',
        empId: 'emp-003',
        loginId: 'OIRASH20240003',
        email: 'rahul.sharma@odooindia.com',
        passwordHash: empPassHash,
        role: 'employee',
        firstName: 'Rahul',
        lastName: 'Sharma',
        jobPosition: 'Senior Product Manager',
        department: 'Product',
        location: 'Gandhinagar Tech Park',
        doj: '2024-01-15',
        mobile: '+91 98123 99887',
        dob: '1991-04-19',
        gender: 'Male',
        maritalStatus: 'Married',
        nationality: 'Indian',
        address: 'A-701 Royal Heights, Vastrapur, Ahmedabad',
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        wage: 90000,
        skills: ['Agile / Scrum', 'Roadmapping', 'User Stories', 'Data Analytics', 'Jira'],
        certs: ['Certified Scrum Product Owner (CSPO)', 'Pragmatic Institute Certified'],
        pan: 'PQRST3456U',
        bankName: 'Axis Bank',
        accNo: '918020045678901',
        ifsc: 'UTIB0000345',
        uan: '101456789012'
      },
      {
        userId: 'user-emp-004',
        empId: 'emp-004',
        loginId: 'OIPRPA20240004',
        email: 'priya.patel@odooindia.com',
        passwordHash: empPassHash,
        role: 'employee',
        firstName: 'Priya',
        lastName: 'Patel',
        jobPosition: 'Backend Python Engineer',
        department: 'Engineering',
        location: 'Gandhinagar Tech Park',
        doj: '2024-05-10',
        mobile: '+91 99090 33445',
        dob: '1997-09-28',
        gender: 'Female',
        maritalStatus: 'Single',
        nationality: 'Indian',
        address: '503 Shivalik Residency, Prahladnagar, Ahmedabad',
        profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        wage: 55000,
        skills: ['Python', 'PostgreSQL', 'FastAPI', 'Docker', 'Redis'],
        certs: ['Python Institute PCAP', 'PostgreSQL Associate Engineer'],
        pan: 'UVWXY7890Z',
        bankName: 'Kotak Mahindra Bank',
        accNo: '441209876543',
        ifsc: 'KKBK0000123',
        uan: '101567890123'
      },
      {
        userId: 'user-emp-005',
        empId: 'emp-005',
        loginId: 'OIAMKU20250005',
        email: 'amit.kumar@odooindia.com',
        passwordHash: empPassHash,
        role: 'employee',
        firstName: 'Amit',
        lastName: 'Kumar',
        jobPosition: 'QA Automation Engineer',
        department: 'Engineering',
        location: 'Gandhinagar Tech Park',
        doj: '2025-02-01',
        mobile: '+91 98250 77889',
        dob: '1995-12-12',
        gender: 'Male',
        maritalStatus: 'Single',
        nationality: 'Indian',
        address: '204 Galaxy Apartments, Chandkheda, Ahmedabad',
        profilePicture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        wage: 48000,
        skills: ['Cypress', 'Playwright', 'Selenium', 'CI/CD Pipelines', 'Jest'],
        certs: ['ISTQB Certified Tester', 'Playwright Automation Master'],
        pan: 'ABCDE9876G',
        bankName: 'HDFC Bank',
        accNo: '50100789012345',
        ifsc: 'HDFC0001234',
        uan: '101678901234'
      }
    ];

    for (const emp of employeesData) {
      await db.prepare(`
        INSERT INTO users (id, login_id, email, password_hash, role, company_id, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `).run(emp.userId, emp.loginId, emp.email, emp.passwordHash, emp.role, companyId);

      await db.prepare(`
        INSERT INTO employees (
          id, user_id, first_name, last_name, job_position, department, location,
          date_of_joining, mobile, personal_email, dob, gender, marital_status, nationality,
          address, profile_picture, resume_about, resume_love, resume_hobbies
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        emp.empId, emp.userId, emp.firstName, emp.lastName, emp.jobPosition, emp.department, emp.location,
        emp.doj, emp.mobile, emp.email, emp.dob, emp.gender, emp.maritalStatus, emp.nationality,
        emp.address, emp.profilePicture,
        `${emp.firstName} is a dedicated professional with deep passion for excellence and collaboration.`,
        `I love working on impactful scalable enterprise software with an energetic and supportive team.`,
        `Reading tech blogs, playing chess, weekend cycling, and exploring photography.`
      );

      for (const skill of emp.skills) {
        await db.prepare(`INSERT INTO skills (id, employee_id, name) VALUES (?, ?, ?)`).run(uuidv4(), emp.empId, skill);
      }

      for (const cert of emp.certs) {
        await db.prepare(`INSERT INTO certifications (id, employee_id, name) VALUES (?, ?, ?)`).run(uuidv4(), emp.empId, cert);
      }

      await db.prepare(`
        INSERT INTO bank_details (id, employee_id, account_number, bank_name, ifsc_code, pan_no, uan_no, emp_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), emp.empId, emp.accNo, emp.bankName, emp.ifsc, emp.pan, emp.uan, emp.loginId);

      const breakdown = calculateSalaryBreakdown(emp.wage);
      await db.prepare(`
        INSERT INTO salary_structures (
          id, employee_id, wage_type, monthly_wage, yearly_wage, working_days_per_week, break_time_hours,
          basic_pct, hra_pct, standard_allowance_pct, performance_bonus_pct, lta_pct, fixed_allowance_amount,
          pf_employee_pct, pf_employer_pct, professional_tax
        ) VALUES (?, ?, 'Fixed wage', ?, ?, 5, 1.0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), emp.empId, emp.wage, breakdown.yearly_wage,
        breakdown.basic_pct, breakdown.hra_pct, breakdown.standard_allowance_pct,
        breakdown.performance_bonus_pct, breakdown.lta_pct, breakdown.fixed_allowance_amount,
        breakdown.pf_employee_pct, breakdown.pf_employer_pct, breakdown.professional_tax
      );

      await db.prepare(`INSERT INTO leave_balances (id, employee_id, leave_type_id, days_available, days_used) VALUES (?, ?, ?, 24, 0)`).run(uuidv4(), emp.empId, paidLeaveTypeId);
      await db.prepare(`INSERT INTO leave_balances (id, employee_id, leave_type_id, days_available, days_used) VALUES (?, ?, ?, 7, 0)`).run(uuidv4(), emp.empId, sickLeaveTypeId);
      await db.prepare(`INSERT INTO leave_balances (id, employee_id, leave_type_id, days_available, days_used) VALUES (?, ?, ?, 0, 0)`).run(uuidv4(), emp.empId, unpaidLeaveTypeId);
    }

    // Sarah on leave today
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await db.prepare(`
      INSERT INTO leave_requests (
        id, employee_id, leave_type_id, start_date, end_date, days_count, reason, status, approver_id, approver_comment
      ) VALUES (?, 'emp-002', ?, ?, ?, 3, 'Attending design summit and personal time off', 'validated', 'user-admin-001', 'Approved. Enjoy!')
    `).run(uuidv4(), paidLeaveTypeId, todayStr, tomorrowStr);

    await db.prepare(`UPDATE leave_balances SET days_available = 21, days_used = 3 WHERE employee_id = 'emp-002' AND leave_type_id = ?`).run(paidLeaveTypeId);

    // Pending Leave Request for John Doe (emp-001)
    await db.prepare(`
      INSERT INTO leave_requests (
        id, employee_id, leave_type_id, start_date, end_date, days_count, reason, status
      ) VALUES (?, 'emp-001', ?, '2026-10-28', '2026-10-29', 2, 'Family function', 'to_approve')
    `).run(uuidv4(), paidLeaveTypeId);

    // Today's attendance
    await db.prepare(`INSERT INTO attendance (id, employee_id, date, check_in, status) VALUES (?, 'emp-admin-001', ?, '09:15 AM', 'present')`).run(uuidv4(), todayStr);
    await db.prepare(`INSERT INTO attendance (id, employee_id, date, check_in, check_out, work_hours, extra_hours, status) VALUES (?, 'emp-001', ?, '10:00 AM', '07:00 PM', '09:00', '01:00', 'present')`).run(uuidv4(), todayStr);
    await db.prepare(`INSERT INTO attendance (id, employee_id, date, check_in, status) VALUES (?, 'emp-004', ?, '09:30 AM', 'present')`).run(uuidv4(), todayStr);
    await db.prepare(`INSERT INTO attendance (id, employee_id, date, check_in, check_out, work_hours, extra_hours, status) VALUES (?, 'emp-005', ?, '10:00 AM', '07:00 PM', '09:00', '01:00', 'present')`).run(uuidv4(), todayStr);
    await db.prepare(`INSERT INTO attendance (id, employee_id, date, status) VALUES (?, 'emp-002', ?, 'on_leave')`).run(uuidv4(), todayStr);

    // Historical attendance
    for (let i = 1; i <= 10; i++) {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() - i);
      const dayOfWeek = prevDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const pDateStr = prevDate.toISOString().split('T')[0];
        await db.prepare(`
          INSERT INTO attendance (id, employee_id, date, check_in, check_out, work_hours, extra_hours, status)
          VALUES (?, 'emp-001', ?, '10:00 AM', '07:00 PM', '09:00', '01:00', 'present')
        `).run(uuidv4(), pDateStr);
      }
    }

    // Sample payslips
    const lastMonth = new Date().getMonth() === 0 ? 12 : new Date().getMonth();
    const lastYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();

    for (const emp of employeesData) {
      const breakdown = calculateSalaryBreakdown(emp.wage);
      await db.prepare(`
        INSERT INTO payslips (
          id, employee_id, month, year, monthly_wage, payable_days, total_working_days,
          basic, hra, standard_allowance, performance_bonus, lta, fixed_allowance,
          gross_salary, pf_employee, pf_employer, professional_tax, total_deductions, net_salary, status
        ) VALUES (?, ?, ?, ?, ?, 22, 22, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated')
      `).run(
        uuidv4(), emp.empId, lastMonth, lastYear, emp.wage,
        breakdown.basic_amount, breakdown.hra_amount, breakdown.standard_allowance_amount,
        breakdown.performance_bonus_amount, breakdown.lta_amount, breakdown.fixed_allowance_amount,
        emp.wage, breakdown.pf_employee_amount, breakdown.pf_employer_amount,
        breakdown.professional_tax, breakdown.total_deductions, breakdown.net_salary
      );
    }

    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, 'user-admin-001', 'Welcome to Dayflow', 'Your HRMS workspace is fully configured and ready.', 'system')
    `).run(uuidv4());

    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, 'user-admin-001', 'New Leave Request', 'John Doe requested 2 days of Paid time off.', 'leave')
    `).run(uuidv4());

    console.log('=============================================');
    console.log('DAYFLOW HRMS SEED COMPLETED SUCCESSFULLY!');
    console.log('---------------------------------------------');
    console.log('Admin Account:');
    console.log('  Login ID: OIADMI20220001 or admin@odooindia.com');
    console.log('  Password: admin123');
    console.log('Employee Account:');
    console.log('  Login ID: OIJODO20220001 or john.doe@odooindia.com');
    console.log('  Password: password123');
    console.log('=============================================');
  } catch (err) {
    console.error('Seed Failed:', err);
  }
}

seed();
