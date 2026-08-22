const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const config = require('../config');

async function getLeaveBalances(req, res) {
  try {
    const employeeId = req.params.employeeId || req.user.employee_id;
    const companyId = req.user.company_id;

    const balances = await db.prepare(`
      SELECT 
        lt.id as leave_type_id, lt.name as leave_type_name, lt.is_paid, lt.requires_attachment,
        COALESCE(lb.days_available, lt.default_days) as days_available,
        COALESCE(lb.days_used, 0) as days_used
      FROM leave_types lt
      LEFT JOIN leave_balances lb ON lb.leave_type_id = lt.id AND lb.employee_id = ?
      WHERE lt.company_id = ?
      ORDER BY lt.is_paid DESC, lt.name ASC
    `).all(employeeId, companyId);

    let paidAvailable = 24;
    let sickAvailable = 7;

    balances.forEach(b => {
      if (b.leave_type_name.toLowerCase().includes('paid')) {
        paidAvailable = b.days_available;
      } else if (b.leave_type_name.toLowerCase().includes('sick')) {
        sickAvailable = b.days_available;
      }
    });

    res.json({
      success: true,
      summary: {
        paid_days_available: paidAvailable,
        sick_days_available: sickAvailable
      },
      balances
    });
  } catch (error) {
    console.error('Get Balances Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave balances.' });
  }
}

async function getLeaveRequests(req, res) {
  try {
    const isAdminOrHR = req.user.role === 'admin' || req.user.role === 'hr';
    const employeeId = req.user.employee_id;
    const companyId = req.user.company_id;
    const { status, search } = req.query;

    let query = `
      SELECT 
        lr.*,
        e.first_name, e.last_name, e.job_position, e.department, e.profile_picture,
        u.login_id,
        lt.name as leave_type_name, lt.is_paid, lt.requires_attachment,
        app_u.login_id as approver_login_id
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      JOIN users u ON u.id = e.user_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      LEFT JOIN users app_u ON app_u.id = lr.approver_id
      WHERE u.company_id = ?
    `;

    const params = [companyId];

    if (!isAdminOrHR) {
      query += ` AND lr.employee_id = ?`;
      params.push(employeeId);
    }

    if (status) {
      query += ` AND lr.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (LOWER(e.first_name || ' ' || e.last_name) LIKE ? OR LOWER(u.login_id) LIKE ? OR LOWER(lt.name) LIKE ?)`;
      const searchParam = `%${search.toLowerCase()}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY lr.created_at DESC`;

    const requests = await db.prepare(query).all(...params);

    const formatted = requests.map(r => ({
      id: r.id,
      employee_id: r.employee_id,
      name: `${r.first_name} ${r.last_name}`,
      login_id: r.login_id,
      job_position: r.job_position,
      department: r.department,
      profile_picture: r.profile_picture,
      start_date: r.start_date,
      end_date: r.end_date,
      days_count: r.days_count,
      leave_type_id: r.leave_type_id,
      leave_type_name: r.leave_type_name,
      attachment_url: r.attachment_url,
      reason: r.reason,
      status: r.status,
      approver_comment: r.approver_comment,
      created_at: r.created_at
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('Get Leave Requests Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests.' });
  }
}

async function submitLeaveRequest(req, res) {
  try {
    const employeeId = req.body.employee_id || req.user.employee_id;
    const { leave_type_id, start_date, end_date, days_count, reason } = req.body;

    if (!leave_type_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Leave type, start date, and end date are required.' });
    }

    const leaveType = await db.prepare(`SELECT * FROM leave_types WHERE id = ?`).get(leave_type_id);
    if (!leaveType) {
      return res.status(404).json({ success: false, message: 'Invalid leave type selected.' });
    }

    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
    }

    if (leaveType.requires_attachment && !attachmentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Medical certificate / attachment is required for Sick Leave requests.'
      });
    }

    let calculatedDays = Number(days_count);
    if (!calculatedDays || calculatedDays <= 0) {
      const s = new Date(start_date);
      const e = new Date(end_date);
      const diffTime = Math.abs(e - s);
      calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    if (leaveType.is_paid) {
      const balance = await db.prepare(`
        SELECT days_available FROM leave_balances 
        WHERE employee_id = ? AND leave_type_id = ?
      `).get(employeeId, leave_type_id);

      if (balance && balance.days_available < calculatedDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance. You have ${balance.days_available} days available, but requested ${calculatedDays} days.`
        });
      }
    }

    const requestId = uuidv4();

    await db.prepare(`
      INSERT INTO leave_requests (
        id, employee_id, leave_type_id, start_date, end_date, days_count, attachment_url, reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'to_approve')
    `).run(
      requestId, employeeId, leave_type_id, start_date, end_date,
      calculatedDays, attachmentUrl, reason || 'Time off request'
    );

    const admins = await db.prepare(`SELECT id FROM users WHERE company_id = ? AND role IN ('admin', 'hr')`).all(req.user.company_id);
    for (const admin of admins) {
      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (?, ?, 'New Leave Request', ?, 'leave')
      `).run(uuidv4(), admin.id, `${req.user.first_name || 'An employee'} requested ${calculatedDays} day(s) of ${leaveType.name}.`);
    }

    res.status(201).json({
      success: true,
      message: 'Time off request submitted successfully and is pending approval.',
      requestId
    });
  } catch (error) {
    console.error('Submit Leave Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit leave request.' });
  }
}

async function approveLeaveRequest(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const request = await db.prepare(`
      SELECT lr.*, lt.is_paid, lt.name as leave_type_name, e.user_id 
      FROM leave_requests lr
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      JOIN employees e ON e.id = lr.employee_id
      WHERE lr.id = ?
    `).get(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    // 1. Update Request Status
    await db.prepare(`
      UPDATE leave_requests SET
        status = 'validated',
        approver_id = ?,
        approver_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, comment || 'Approved', id);

    // 2. Deduct from balance
    if (request.is_paid) {
      await db.prepare(`
        UPDATE leave_balances SET
          days_available = MAX(0, days_available - ?),
          days_used = days_used + ?
        WHERE employee_id = ? AND leave_type_id = ?
      `).run(request.days_count, request.days_count, request.employee_id, request.leave_type_id);
    }

    // 3. Mark attendance status
    const s = new Date(request.start_date);
    const e = new Date(request.end_date);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = await db.prepare(`SELECT id FROM attendance WHERE employee_id = ? AND date = ?`).get(request.employee_id, dateStr);
      if (existing) {
        await db.prepare(`UPDATE attendance SET status = 'on_leave' WHERE id = ?`).run(existing.id);
      } else {
        await db.prepare(`
          INSERT INTO attendance (id, employee_id, date, status)
          VALUES (?, ?, ?, 'on_leave')
        `).run(uuidv4(), request.employee_id, dateStr);
      }
    }

    // 4. Notify Employee
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, 'Leave Approved', ?, 'leave')
    `).run(
      uuidv4(), request.user_id,
      `Your ${request.leave_type_name} request from ${request.start_date} to ${request.end_date} has been approved.`
    );

    res.json({ success: true, message: 'Leave request approved successfully!' });
  } catch (error) {
    console.error('Approve Leave Error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve leave request.' });
  }
}

async function rejectLeaveRequest(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const request = await db.prepare(`
      SELECT lr.*, lt.name as leave_type_name, e.user_id 
      FROM leave_requests lr
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      JOIN employees e ON e.id = lr.employee_id
      WHERE lr.id = ?
    `).get(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    await db.prepare(`
      UPDATE leave_requests SET
        status = 'refused',
        approver_id = ?,
        approver_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, comment || 'Rejected', id);

    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, 'Leave Refused', ?, 'leave')
    `).run(
      uuidv4(), request.user_id,
      `Your ${request.leave_type_name} request from ${request.start_date} to ${request.end_date} was rejected. Reason: ${comment || 'No reason provided'}`
    );

    res.json({ success: true, message: 'Leave request rejected.' });
  } catch (error) {
    console.error('Reject Leave Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject leave request.' });
  }
}

async function getYearCalendar(req, res) {
  try {
    const employeeId = req.params.employeeId || req.user.employee_id;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const yearPattern = `${year}%`;
    const requests = await db.prepare(`
      SELECT lr.*, lt.name as leave_type_name 
      FROM leave_requests lr
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE lr.employee_id = ? AND (lr.start_date LIKE ? OR lr.end_date LIKE ?)
    `).all(employeeId, yearPattern, yearPattern);

    const dayMap = {};
    requests.forEach(r => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (dateStr.startsWith(String(year))) {
          dayMap[dateStr] = {
            status: r.status,
            leave_type: r.leave_type_name,
            reason: r.reason
          };
        }
      }
    });

    res.json({
      success: true,
      year,
      dayMap,
      holidays: config.PUBLIC_HOLIDAYS
    });
  } catch (error) {
    console.error('Year Calendar Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar data.' });
  }
}

function getPublicHolidays(req, res) {
  res.json({
    success: true,
    holidays: config.PUBLIC_HOLIDAYS
  });
}

module.exports = {
  getLeaveBalances,
  getLeaveRequests,
  submitLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  getYearCalendar,
  getPublicHolidays
};
