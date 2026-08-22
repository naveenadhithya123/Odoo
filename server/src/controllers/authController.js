const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const config = require('../config');
const { generateLoginId } = require('../utils/idGenerator');

/**
 * Sign In for all users (Admin, HR, Employees)
 */
async function signIn(req, res) {
  try {
    const { loginIdOrEmail, password } = req.body;

    if (!loginIdOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide login ID / email and password.' });
    }

    const trimmed = loginIdOrEmail.trim();

    // Query user by login_id OR email
    const user = await db.prepare(`
      SELECT u.*, 
             e.id as employee_id, e.first_name, e.last_name, e.job_position, e.department, e.location, e.profile_picture,
             c.name as company_name, c.code as company_code, c.logo_url as company_logo
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE LOWER(u.login_id) = LOWER(?) OR LOWER(u.email) = LOWER(?)
    `).get(trimmed, trimmed);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your Login ID / Email and password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Contact your administrator.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your Login ID / Email and password.' });
    }

    // Update last_login
    await db.prepare(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, login_id: user.login_id, role: user.role, company_id: user.company_id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    // Audit log
    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), user.id, 'USER_LOGIN', 'users', user.id, `User ${user.login_id} logged in successfully`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        login_id: user.login_id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: user.company_name,
        company_code: user.company_code,
        company_logo: user.company_logo,
        employee_id: user.employee_id,
        first_name: user.first_name,
        last_name: user.last_name,
        job_position: user.job_position,
        department: user.department,
        profile_picture: user.profile_picture,
        must_change_password: !!user.must_change_password
      }
    });
  } catch (error) {
    console.error('Sign In Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
}

/**
 * Sign Up for Company / Admin Initial Registration Only
 */
async function signUpCompany(req, res) {
  try {
    const { companyName, name, email, phone, password, confirmPassword } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const existingUser = await db.prepare(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`).get(email.trim());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Generate Company code (e.g. Odoo India -> OI)
    const words = companyName.trim().split(/\s+/);
    let code = '';
    if (words.length >= 2) {
      code = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      code = (companyName.trim().slice(0, 2)).toUpperCase();
    }

    let logoUrl = null;
    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    const companyId = uuidv4();
    const userId = uuidv4();
    const employeeId = uuidv4();

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Admin';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const currentYear = new Date().getFullYear();
    const loginId = await generateLoginId(db, code, firstName, lastName, currentYear);
    const passwordHash = bcrypt.hashSync(password, 10);

    // 1. Insert Company
    await db.prepare(`
      INSERT INTO companies (id, name, code, logo_url, phone, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(companyId, companyName.trim(), code, logoUrl, phone || null, email.trim());

    // 2. Insert Admin User
    await db.prepare(`
      INSERT INTO users (id, login_id, email, password_hash, role, company_id, must_change_password)
      VALUES (?, ?, ?, ?, 'admin', ?, 0)
    `).run(userId, loginId, email.trim(), passwordHash, companyId);

    // 3. Insert Employee Record for the Admin
    await db.prepare(`
      INSERT INTO employees (id, user_id, first_name, last_name, job_position, department, date_of_joining, mobile, personal_email, resume_about)
      VALUES (?, ?, ?, ?, 'Administrator', 'Management', DATE('now'), ?, ?, 'Company Administrator & Founder')
    `).run(employeeId, userId, firstName, lastName, phone || null, email.trim());

    // 4. Insert Default Leave Types
    const paidLeaveId = uuidv4();
    const sickLeaveId = uuidv4();
    const unpaidLeaveId = uuidv4();

    await db.prepare(`INSERT INTO leave_types (id, company_id, name, is_paid, default_days, requires_attachment) VALUES (?, ?, 'Paid time off', 1, 24, 0)`).run(paidLeaveId, companyId);
    await db.prepare(`INSERT INTO leave_types (id, company_id, name, is_paid, default_days, requires_attachment) VALUES (?, ?, 'Sick Leave', 1, 7, 1)`).run(sickLeaveId, companyId);
    await db.prepare(`INSERT INTO leave_types (id, company_id, name, is_paid, default_days, requires_attachment) VALUES (?, ?, 'Unpaid Leaves', 0, 0, 0)`).run(unpaidLeaveId, companyId);

    // 5. Initialize Leave Balances
    await db.prepare(`INSERT INTO leave_balances (id, employee_id, leave_type_id, days_available, days_used) VALUES (?, ?, ?, 24, 0)`).run(uuidv4(), employeeId, paidLeaveId);
    await db.prepare(`INSERT INTO leave_balances (id, employee_id, leave_type_id, days_available, days_used) VALUES (?, ?, ?, 7, 0)`).run(uuidv4(), employeeId, sickLeaveId);
    await db.prepare(`INSERT INTO leave_balances (id, employee_id, leave_type_id, days_available, days_used) VALUES (?, ?, ?, 0, 0)`).run(uuidv4(), employeeId, unpaidLeaveId);

    // 6. Initialize Salary Structure
    await db.prepare(`
      INSERT INTO salary_structures (id, employee_id, monthly_wage, yearly_wage, working_days_per_week, break_time_hours)
      VALUES (?, ?, 100000, 1200000, 5, 1.0)
    `).run(uuidv4(), employeeId);

    // 7. Audit log
    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'COMPANY_REGISTERED', 'companies', ?, ?)
    `).run(uuidv4(), userId, companyId, `Company ${companyName} registered with Admin ${loginId}`);

    const token = jwt.sign(
      { id: userId, login_id: loginId, role: 'admin', company_id: companyId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Company registered successfully!',
      token,
      user: {
        id: userId,
        login_id: loginId,
        email: email.trim(),
        role: 'admin',
        company_id: companyId,
        company_name: companyName.trim(),
        company_code: code,
        company_logo: logoUrl,
        employee_id: employeeId,
        first_name: firstName,
        last_name: lastName,
        job_position: 'Administrator',
        department: 'Management',
        profile_picture: null,
        must_change_password: false
      }
    });
  } catch (error) {
    console.error('Sign Up Company Error:', error);
    res.status(500).json({ success: false, message: 'Registration failed due to internal server error.' });
  }
}

async function getMe(req, res) {
  try {
    const unreadCount = await db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(req.user.id);

    res.json({
      success: true,
      user: req.user,
      unread_notifications: unreadCount ? unreadCount.count : 0
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving user details.' });
  }
}

async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = bcrypt.compareSync(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.prepare(`
      UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?
    `).run(newHash, req.user.id);

    await db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, 'PASSWORD_CHANGED', 'users', ?, 'User updated password via Security tab')
    `).run(uuidv4(), req.user.id, req.user.id);

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
}

module.exports = {
  signIn,
  signUpCompany,
  getMe,
  changePassword
};
