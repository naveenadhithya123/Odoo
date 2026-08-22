const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { generateLoginId, generateTempPassword } = require('../utils/idGenerator');
const { calculateSalaryBreakdown } = require('../utils/salaryCalculator');

/**
 * Get all employees with dynamic today status (🟢 Present, ✈️ On Leave, 🟡 Absent)
 */
async function getAllEmployees(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const companyId = req.user.company_id;

    const employees = await db.prepare(`
      SELECT 
        e.id, e.user_id, e.first_name, e.last_name, e.job_position, e.department, 
        e.location, e.date_of_joining, e.mobile, e.profile_picture,
        u.login_id, u.email, u.role, u.is_active,
        (
          SELECT a.status FROM attendance a 
          WHERE a.employee_id = e.id AND a.date = ?
        ) as today_attendance,
        (
          SELECT a.check_in FROM attendance a 
          WHERE a.employee_id = e.id AND a.date = ?
        ) as today_check_in,
        (
          SELECT a.check_out FROM attendance a 
          WHERE a.employee_id = e.id AND a.date = ?
        ) as today_check_out,
        (
          SELECT COUNT(*) FROM leave_requests lr 
          WHERE lr.employee_id = e.id AND lr.status = 'validated' 
            AND ? BETWEEN lr.start_date AND lr.end_date
        ) as is_on_leave
      FROM employees e
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = ? AND u.is_active = 1
      ORDER BY e.first_name ASC
    `).all(today, today, today, today, companyId);

    const results = employees.map(emp => {
      let statusIndicator = 'absent'; // 🟡 Yellow default
      let statusLabel = 'Absent';

      if (emp.is_on_leave > 0) {
        statusIndicator = 'on_leave'; // ✈️ Airplane
        statusLabel = 'On Leave';
      } else if (emp.today_check_in) {
        statusIndicator = 'present'; // 🟢 Green
        statusLabel = emp.today_check_out ? 'Checked Out' : 'Present';
      }

      return {
        ...emp,
        name: `${emp.first_name} ${emp.last_name}`,
        statusIndicator,
        statusLabel
      };
    });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Get All Employees Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees list.' });
  }
}

/**
 * Get single employee profile with full details across tabs
 */
async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;
    const isSelf = req.user.employee_id === id;
    const isAdminOrHR = req.user.role === 'admin' || req.user.role === 'hr';

    const employee = await db.prepare(`
      SELECT 
        e.*,
        u.login_id, u.email as account_email, u.role, u.is_active, u.last_login,
        c.name as company_name, c.code as company_code,
        m.first_name as manager_first_name, m.last_name as manager_last_name
      FROM employees e
      JOIN users u ON u.id = e.user_id
      LEFT JOIN companies c ON c.id = u.company_id
      LEFT JOIN employees m ON m.id = e.manager_id
      WHERE e.id = ? AND u.company_id = ?
    `).get(id, req.user.company_id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const skills = await db.prepare(`SELECT id, name FROM skills WHERE employee_id = ? ORDER BY created_at ASC`).all(id);
    const certifications = await db.prepare(`SELECT id, name FROM certifications WHERE employee_id = ? ORDER BY created_at ASC`).all(id);
    const bankDetails = (await db.prepare(`SELECT * FROM bank_details WHERE employee_id = ?`).get(id)) || {};

    let salaryInfo = null;
    if (isAdminOrHR) {
      const rawSalary = await db.prepare(`SELECT * FROM salary_structures WHERE employee_id = ?`).get(id);
      if (rawSalary) {
        const calculated = calculateSalaryBreakdown(rawSalary.monthly_wage, rawSalary);
        salaryInfo = {
          ...rawSalary,
          ...calculated
        };
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await db.prepare(`SELECT * FROM attendance WHERE employee_id = ? AND date = ?`).get(id, today);
    const activeLeave = await db.prepare(`
      SELECT lr.*, lt.name as leave_type_name 
      FROM leave_requests lr
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE lr.employee_id = ? AND lr.status = 'validated' AND ? BETWEEN lr.start_date AND lr.end_date
    `).get(id, today);

    let statusIndicator = 'absent';
    if (activeLeave) {
      statusIndicator = 'on_leave';
    } else if (todayAttendance && todayAttendance.check_in) {
      statusIndicator = 'present';
    }

    res.json({
      success: true,
      data: {
        ...employee,
        name: `${employee.first_name} ${employee.last_name}`,
        manager_name: employee.manager_first_name ? `${employee.manager_first_name} ${employee.manager_last_name}` : 'None',
        statusIndicator,
        todayAttendance,
        activeLeave,
        skills,
        certifications,
        bankDetails,
        salaryInfo,
        permissions: {
          isSelf,
          isAdminOrHR,
          canEditAll: isAdminOrHR,
          canEditLimited: isSelf || isAdminOrHR,
          canViewSalary: isAdminOrHR
        }
      }
    });
  } catch (error) {
    console.error('Get Employee By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee details.' });
  }
}

/**
 * Create a new employee record (Admin/HR only)
 */
async function createEmployee(req, res) {
  try {
    const {
      first_name,
      last_name,
      email,
      mobile,
      job_position,
      department,
      location,
      manager_id,
      date_of_joining,
      dob,
      gender,
      marital_status,
      nationality,
      address,
      monthly_wage,
      account_number,
      bank_name,
      ifsc_code,
      pan_no,
      uan_no,
      emp_code
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name, and email are required.' });
    }

    const existingUser = await db.prepare(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`).get(email.trim());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const company = await db.prepare(`SELECT * FROM companies WHERE id = ?`).get(req.user.company_id);
    const companyCode = company ? company.code : 'OI';
    const joiningDate = date_of_joining || new Date().toISOString().split('T')[0];
    const joiningYear = new Date(joiningDate).getFullYear();

    const loginId = await generateLoginId(db, companyCode, first_name, last_name, joiningYear);
    const tempPassword = generateTempPassword(8);
    const passwordHash = bcrypt.hashSync(tempPassword, 10);

    const userId = uuidv4();
    const employeeId = uuidv4();
    const wage = Number(monthly_wage) || 50000.00;

    let profilePictureUrl = null;
    if (req.file) {
      profilePictureUrl = `/uploads/${req.file.filename}`;
    }

    // 1. Create User
    await db.prepare(`
      INSERT INTO users (id, login_id, email, password_hash, role, company_id, must_change_password)
      VALUES (?, ?, ?, ?, 'employee', ?, 1)
    `).run(userId, loginId, email.trim(), passwordHash, req.user.company_id);

    // 2. Create Employee
    await db.prepare(`
      INSERT INTO employees (
        id, user_id, first_name, last_name, job_position, department, manager_id,
        location, date_of_joining, mobile, personal_email, dob, gender, marital_status,
        nationality, address, profile_picture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      employeeId, userId, first_name.trim(), last_name.trim(),
      job_position || 'Associate', department || 'General', manager_id || null,
      location || 'Headquarters', joiningDate, mobile || null, email.trim(),
      dob || null, gender || 'Other', marital_status || 'Single',
      nationality || 'Indian', address || null, profilePictureUrl
    );

    // 3. Create Bank Details
    await db.prepare(`
      INSERT INTO bank_details (id, employee_id, account_number, bank_name, ifsc_code, pan_no, uan_no, emp_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), employeeId, account_number || '', bank_name || '',
      ifsc_code || '', pan_no || '', uan_no || '', emp_code || loginId
    );

    // 4. Create Salary Structure
    const breakdown = calculateSalaryBreakdown(wage);
    await db.prepare(`
      INSERT INTO salary_structures (
        id, employee_id, wage_type, monthly_wage, yearly_wage, working_days_per_week, break_time_hours,
        basic_pct, hra_pct, standard_allowance_pct, performance_bonus_pct, lta_pct, fixed_allowance_amount,
        pf_employee_pct, pf_employer_pct, professional_tax
      ) VALUES (?, ?, 'Fixed wage', ?, ?, 5, 1.0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), employeeId, wage, breakdown.yearly_wage,
      breakdown.basic_pct, breakdown.hra_pct, breakdown.standard_allowance_pct,
      breakdown.performance_bonus_pct, breakdown.lta_pct, breakdown.fixed_allowance_amount,
      breakdown.pf_employee_pct, breakdown.pf_employer_pct, breakdown.professional_tax
    );

    // 5. Initialize Leave Balances
    const leaveTypes = await db.prepare(`SELECT id, default_days FROM leave_types WHERE company_id = ?`).all(req.user.company_id);
    for (const lt of leaveTypes) {
      await db.prepare(`
        INSERT INTO leave_balances (id, employee_id, leave_type_id, days_available, days_used)
        VALUES (?, ?, ?, ?, 0)
      `).run(uuidv4(), employeeId, lt.id, lt.default_days);
    }

    // 6. Audit Log
    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'CREATE_EMPLOYEE', 'employees', ?, ?)
    `).run(uuidv4(), req.user.id, employeeId, `Created employee ${first_name} ${last_name} with Login ID ${loginId}`);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully!',
      employee: {
        id: employeeId,
        user_id: userId,
        login_id: loginId,
        temp_password: tempPassword,
        name: `${first_name} ${last_name}`,
        email: email.trim(),
        job_position: job_position || 'Associate',
        department: department || 'General'
      }
    });
  } catch (error) {
    console.error('Create Employee Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create employee.' });
  }
}

/**
 * Update employee profile
 */
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const isSelf = req.user.employee_id === id;
    const isAdminOrHR = req.user.role === 'admin' || req.user.role === 'hr';

    if (!isSelf && !isAdminOrHR) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this profile.' });
    }

    const currentEmp = await db.prepare(`SELECT * FROM employees WHERE id = ?`).get(id);
    if (!currentEmp) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const {
      first_name, last_name, job_position, department, location, manager_id,
      date_of_joining, mobile, personal_email, dob, gender, marital_status,
      nationality, address, resume_about, resume_love, resume_hobbies,
      account_number, bank_name, ifsc_code, pan_no, uan_no, emp_code
    } = req.body;

    let profilePicture = currentEmp.profile_picture;
    if (req.file) {
      profilePicture = `/uploads/${req.file.filename}`;
    }

    if (isAdminOrHR) {
      await db.prepare(`
        UPDATE employees SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          job_position = COALESCE(?, job_position),
          department = COALESCE(?, department),
          location = COALESCE(?, location),
          manager_id = ?,
          date_of_joining = COALESCE(?, date_of_joining),
          mobile = COALESCE(?, mobile),
          personal_email = COALESCE(?, personal_email),
          dob = COALESCE(?, dob),
          gender = COALESCE(?, gender),
          marital_status = COALESCE(?, marital_status),
          nationality = COALESCE(?, nationality),
          address = COALESCE(?, address),
          profile_picture = ?,
          resume_about = COALESCE(?, resume_about),
          resume_love = COALESCE(?, resume_love),
          resume_hobbies = COALESCE(?, resume_hobbies)
        WHERE id = ?
      `).run(
        first_name, last_name, job_position, department, location,
        manager_id !== undefined ? manager_id : currentEmp.manager_id,
        date_of_joining, mobile, personal_email, dob, gender, marital_status,
        nationality, address, profilePicture,
        resume_about, resume_love, resume_hobbies, id
      );

      if (account_number !== undefined || bank_name !== undefined || pan_no !== undefined) {
        const existingBank = await db.prepare(`SELECT id FROM bank_details WHERE employee_id = ?`).get(id);
        if (existingBank) {
          await db.prepare(`
            UPDATE bank_details SET
              account_number = ?, bank_name = ?, ifsc_code = ?, pan_no = ?, uan_no = ?, emp_code = ?
            WHERE employee_id = ?
          `).run(account_number || '', bank_name || '', ifsc_code || '', pan_no || '', uan_no || '', emp_code || '', id);
        } else {
          await db.prepare(`
            INSERT INTO bank_details (id, employee_id, account_number, bank_name, ifsc_code, pan_no, uan_no, emp_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(uuidv4(), id, account_number || '', bank_name || '', ifsc_code || '', pan_no || '', uan_no || '', emp_code || '');
        }
      }
    } else {
      await db.prepare(`
        UPDATE employees SET
          mobile = COALESCE(?, mobile),
          personal_email = COALESCE(?, personal_email),
          address = COALESCE(?, address),
          profile_picture = ?,
          resume_about = COALESCE(?, resume_about),
          resume_love = COALESCE(?, resume_love),
          resume_hobbies = COALESCE(?, resume_hobbies)
        WHERE id = ?
      `).run(
        mobile, personal_email, address, profilePicture,
        resume_about, resume_love, resume_hobbies, id
      );
    }

    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Update Employee Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update employee.' });
  }
}

/**
 * Update Salary Structure (Admin Only)
 */
async function updateSalaryStructure(req, res) {
  try {
    const { id } = req.params;
    const {
      monthly_wage,
      working_days_per_week,
      break_time_hours,
      basic_pct,
      hra_pct,
      standard_allowance_pct,
      performance_bonus_pct,
      lta_pct,
      pf_employee_pct,
      pf_employer_pct,
      professional_tax
    } = req.body;

    const wage = Number(monthly_wage) || 50000.00;
    const customPcts = {
      basic_pct,
      hra_pct,
      standard_allowance_pct,
      performance_bonus_pct,
      lta_pct,
      pf_employee_pct,
      pf_employer_pct,
      professional_tax
    };

    const breakdown = calculateSalaryBreakdown(wage, customPcts);
    const existing = await db.prepare(`SELECT id FROM salary_structures WHERE employee_id = ?`).get(id);

    if (existing) {
      await db.prepare(`
        UPDATE salary_structures SET
          monthly_wage = ?,
          yearly_wage = ?,
          working_days_per_week = ?,
          break_time_hours = ?,
          basic_pct = ?,
          hra_pct = ?,
          standard_allowance_pct = ?,
          performance_bonus_pct = ?,
          lta_pct = ?,
          fixed_allowance_amount = ?,
          pf_employee_pct = ?,
          pf_employer_pct = ?,
          professional_tax = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ?
      `).run(
        wage, breakdown.yearly_wage,
        working_days_per_week || 5, break_time_hours || 1.0,
        breakdown.basic_pct, breakdown.hra_pct, breakdown.standard_allowance_pct,
        breakdown.performance_bonus_pct, breakdown.lta_pct, breakdown.fixed_allowance_amount,
        breakdown.pf_employee_pct, breakdown.pf_employer_pct, breakdown.professional_tax,
        id
      );
    } else {
      await db.prepare(`
        INSERT INTO salary_structures (
          id, employee_id, wage_type, monthly_wage, yearly_wage, working_days_per_week, break_time_hours,
          basic_pct, hra_pct, standard_allowance_pct, performance_bonus_pct, lta_pct, fixed_allowance_amount,
          pf_employee_pct, pf_employer_pct, professional_tax
        ) VALUES (?, ?, 'Fixed wage', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), id, wage, breakdown.yearly_wage,
        working_days_per_week || 5, break_time_hours || 1.0,
        breakdown.basic_pct, breakdown.hra_pct, breakdown.standard_allowance_pct,
        breakdown.performance_bonus_pct, breakdown.lta_pct, breakdown.fixed_allowance_amount,
        breakdown.pf_employee_pct, breakdown.pf_employer_pct, breakdown.professional_tax
      );
    }

    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'UPDATE_SALARY_STRUCTURE', 'salary_structures', ?, ?)
    `).run(uuidv4(), req.user.id, id, `Updated salary structure for employee ${id}. New wage: ₹${wage}`);

    res.json({
      success: true,
      message: 'Salary structure updated successfully!',
      data: breakdown
    });
  } catch (error) {
    console.error('Update Salary Structure Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary structure.' });
  }
}

async function addSkill(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Skill name is required.' });

    const skillId = uuidv4();
    await db.prepare(`INSERT INTO skills (id, employee_id, name) VALUES (?, ?, ?)`).run(skillId, id, name.trim());
    res.json({ success: true, skill: { id: skillId, name: name.trim() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add skill.' });
  }
}

async function deleteSkill(req, res) {
  try {
    const { skillId } = req.params;
    await db.prepare(`DELETE FROM skills WHERE id = ?`).run(skillId);
    res.json({ success: true, message: 'Skill removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete skill.' });
  }
}

async function addCertification(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Certification name is required.' });

    const certId = uuidv4();
    await db.prepare(`INSERT INTO certifications (id, employee_id, name) VALUES (?, ?, ?)`).run(certId, id, name.trim());
    res.json({ success: true, certification: { id: certId, name: name.trim() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add certification.' });
  }
}

async function deleteCertification(req, res) {
  try {
    const { certId } = req.params;
    await db.prepare(`DELETE FROM certifications WHERE id = ?`).run(certId);
    res.json({ success: true, message: 'Certification removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete certification.' });
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateSalaryStructure,
  addSkill,
  deleteSkill,
  addCertification,
  deleteCertification
};
