const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');

function formatTime(dateObj) {
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const time24 = `${hours}:${minutes}`;

  let hours12 = dateObj.getHours();
  const ampm = hours12 >= 12 ? 'PM' : 'AM';
  hours12 = hours12 % 12;
  hours12 = hours12 ? hours12 : 12;
  const time12 = `${hours12.toString().padStart(2, '0')}:${minutes} ${ampm}`;

  return { time24, time12 };
}

function calculateHours(checkInStr, checkOutStr, breakHours = 1.0) {
  if (!checkInStr || !checkOutStr) return { workHours: '00:00', extraHours: '00:00' };

  const [inH, inM] = checkInStr.split(':').map(Number);
  const [outH, outM] = checkOutStr.split(':').map(Number);

  let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (totalMinutes < 0) totalMinutes += 24 * 60;

  if (totalMinutes > 240) {
    totalMinutes = Math.max(0, totalMinutes - (breakHours * 60));
  }

  const workH = Math.floor(totalMinutes / 60);
  const workM = totalMinutes % 60;
  const workHours = `${workH.toString().padStart(2, '0')}:${workM.toString().padStart(2, '0')}`;

  const standardMinutes = 8 * 60;
  let extraMinutes = Math.max(0, totalMinutes - standardMinutes);
  const extraH = Math.floor(extraMinutes / 60);
  const extraM = extraMinutes % 60;
  const extraHours = `${extraH.toString().padStart(2, '0')}:${extraM.toString().padStart(2, '0')}`;

  return { workHours, extraHours };
}

async function getSystrayStatus(req, res) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.json({ success: true, isCheckedIn: false, message: 'No employee record associated' });
    }

    const today = new Date().toISOString().split('T')[0];
    const record = await db.prepare(`SELECT * FROM attendance WHERE employee_id = ? AND date = ?`).get(employeeId, today);

    if (!record || !record.check_in) {
      return res.json({
        success: true,
        isCheckedIn: false,
        isCheckedOut: false,
        statusDot: 'red',
        checkInTime: null,
        sinceText: null
      });
    }

    if (record.check_in && !record.check_out) {
      return res.json({
        success: true,
        isCheckedIn: true,
        isCheckedOut: false,
        statusDot: 'green',
        checkInTime: record.check_in,
        sinceText: `Since ${record.check_in}`
      });
    }

    return res.json({
      success: true,
      isCheckedIn: false,
      isCheckedOut: true,
      statusDot: 'green',
      checkInTime: record.check_in,
      checkOutTime: record.check_out,
      workHours: record.work_hours,
      extraHours: record.extra_hours,
      sinceText: `Checked Out (${record.work_hours} hrs)`
    });
  } catch (error) {
    console.error('Systray Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch systray status.' });
  }
}

async function checkIn(req, res) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee record linked to this user.' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const { time12 } = formatTime(now);

    const existing = await db.prepare(`SELECT * FROM attendance WHERE employee_id = ? AND date = ?`).get(employeeId, today);

    if (existing && existing.check_in) {
      return res.status(400).json({
        success: false,
        message: `Already checked in today at ${existing.check_in}`
      });
    }

    if (existing) {
      await db.prepare(`
        UPDATE attendance SET check_in = ?, status = 'present' WHERE id = ?
      `).run(time12, existing.id);
    } else {
      await db.prepare(`
        INSERT INTO attendance (id, employee_id, date, check_in, status)
        VALUES (?, ?, ?, ?, 'present')
      `).run(uuidv4(), employeeId, today, time12);
    }

    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, 'Checked In', ?, 'attendance')
    `).run(uuidv4(), req.user.id, `Checked in at ${time12}`);

    res.json({
      success: true,
      message: 'Checked in successfully!',
      statusDot: 'green',
      checkInTime: time12,
      sinceText: `Since ${time12}`
    });
  } catch (error) {
    console.error('Check In Error:', error);
    res.status(500).json({ success: false, message: 'Failed to check in.' });
  }
}

async function checkOut(req, res) {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee record linked to this user.' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const { time12 } = formatTime(now);

    const record = await db.prepare(`SELECT * FROM attendance WHERE employee_id = ? AND date = ?`).get(employeeId, today);
    if (!record || !record.check_in) {
      return res.status(400).json({ success: false, message: 'You have not checked in today yet.' });
    }

    if (record.check_out) {
      return res.status(400).json({ success: false, message: `Already checked out at ${record.check_out}` });
    }

    const inTimeParts = record.check_in.split(' ');
    let [inH, inM] = inTimeParts[0].split(':').map(Number);
    if (inTimeParts[1] === 'PM' && inH < 12) inH += 12;
    if (inTimeParts[1] === 'AM' && inH === 12) inH = 0;
    const formattedIn = `${inH.toString().padStart(2, '0')}:${inM.toString().padStart(2, '0')}`;

    const formattedOut = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { workHours, extraHours } = calculateHours(formattedIn, formattedOut);

    await db.prepare(`
      UPDATE attendance SET
        check_out = ?,
        work_hours = ?,
        extra_hours = ?,
        status = 'present'
      WHERE id = ?
    `).run(time12, workHours, extraHours, record.id);

    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, 'Checked Out', ?, 'attendance')
    `).run(uuidv4(), req.user.id, `Checked out at ${time12}. Total Work: ${workHours} hrs.`);

    res.json({
      success: true,
      message: 'Checked out successfully!',
      checkOutTime: time12,
      workHours,
      extraHours
    });
  } catch (error) {
    console.error('Check Out Error:', error);
    res.status(500).json({ success: false, message: 'Failed to check out.' });
  }
}

async function getDailyAttendance(req, res) {
  try {
    const { date, search } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const companyId = req.user.company_id;

    let query = `
      SELECT 
        e.id as employee_id, e.first_name, e.last_name, e.job_position, e.department, e.profile_picture,
        u.login_id,
        a.id as attendance_id, a.date, a.check_in, a.check_out, a.work_hours, a.extra_hours, a.status,
        (
          SELECT lt.name FROM leave_requests lr
          JOIN leave_types lt ON lt.id = lr.leave_type_id
          WHERE lr.employee_id = e.id AND lr.status = 'validated' AND ? BETWEEN lr.start_date AND lr.end_date
        ) as leave_type
      FROM employees e
      JOIN users u ON u.id = e.user_id
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = ?
      WHERE u.company_id = ? AND u.is_active = 1
    `;

    const params = [targetDate, targetDate, companyId];

    if (search) {
      query += ` AND (LOWER(e.first_name || ' ' || e.last_name) LIKE ? OR LOWER(u.login_id) LIKE ? OR LOWER(e.department) LIKE ?)`;
      const searchParam = `%${search.toLowerCase()}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY e.first_name ASC`;

    const records = await db.prepare(query).all(...params);

    const formatted = records.map(r => ({
      employee_id: r.employee_id,
      name: `${r.first_name} ${r.last_name}`,
      login_id: r.login_id,
      job_position: r.job_position,
      department: r.department,
      profile_picture: r.profile_picture,
      date: targetDate,
      check_in: r.check_in || '-',
      check_out: r.check_out || '-',
      work_hours: r.work_hours || (r.check_in && !r.check_out ? 'In Progress' : '00:00'),
      extra_hours: r.extra_hours || '00:00',
      status: r.leave_type ? `On Leave (${r.leave_type})` : (r.check_in ? 'Present' : 'Absent')
    }));

    res.json({
      success: true,
      date: targetDate,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('Get Daily Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch daily attendance.' });
  }
}

async function getMonthlyAttendance(req, res) {
  try {
    const employeeId = req.params.employeeId || req.user.employee_id;
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : (now.getMonth() + 1);
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const monthStr = targetMonth.toString().padStart(2, '0');
    const monthPattern = `${targetYear}-${monthStr}%`;

    const records = await db.prepare(`
      SELECT * FROM attendance 
      WHERE employee_id = ? AND date LIKE ?
      ORDER BY date ASC
    `).all(employeeId, monthPattern);

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    let totalWorkingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(targetYear, targetMonth - 1, day);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkingDays++;
      }
    }

    const presentDays = records.filter(r => r.check_in).length;

    const leaves = await db.prepare(`
      SELECT SUM(days_count) as total_leaves FROM leave_requests
      WHERE employee_id = ? AND status = 'validated'
        AND ((start_date LIKE ?) OR (end_date LIKE ?))
    `).get(employeeId, monthPattern, monthPattern);

    const leavesCount = leaves && leaves.total_leaves ? leaves.total_leaves : 0;

    res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      kpis: {
        present_days: presentDays,
        leaves_count: leavesCount,
        total_working_days: totalWorkingDays
      },
      data: records
    });
  } catch (error) {
    console.error('Get Monthly Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly attendance.' });
  }
}

module.exports = {
  getSystrayStatus,
  checkIn,
  checkOut,
  getDailyAttendance,
  getMonthlyAttendance
};
