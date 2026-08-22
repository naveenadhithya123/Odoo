const db = require('../database/db');

async function getAnalyticsOverview(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const companyId = req.user.company_id;

    const empCountRow = await db.prepare(`
      SELECT COUNT(*) as count FROM employees e
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = ? AND u.is_active = 1
    `).get(companyId);
    const totalEmployees = empCountRow ? empCountRow.count : 0;

    const presentRow = await db.prepare(`
      SELECT COUNT(DISTINCT a.employee_id) as count FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = ? AND a.date = ? AND a.check_in IS NOT NULL
    `).get(companyId, today);
    const presentToday = presentRow ? presentRow.count : 0;

    const leaveRow = await db.prepare(`
      SELECT COUNT(DISTINCT lr.employee_id) as count FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = ? AND lr.status = 'validated' AND ? BETWEEN lr.start_date AND lr.end_date
    `).get(companyId, today);
    const onLeaveToday = leaveRow ? leaveRow.count : 0;

    const absentToday = Math.max(0, totalEmployees - (presentToday + onLeaveToday));

    const pendingLeaveRow = await db.prepare(`
      SELECT COUNT(*) as count FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = ? AND lr.status = 'to_approve'
    `).get(companyId);
    const pendingLeaves = pendingLeaveRow ? pendingLeaveRow.count : 0;

    const deptRows = await db.prepare(`
      SELECT e.department, COUNT(*) as count FROM employees e
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = ? AND u.is_active = 1
      GROUP BY e.department
    `).all(companyId);

    const wageRow = await db.prepare(`
      SELECT SUM(ss.monthly_wage) as total_wage FROM salary_structures ss
      JOIN employees e ON e.id = ss.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = ? AND u.is_active = 1
    `).get(companyId);
    const totalMonthlyPayroll = wageRow && wageRow.total_wage ? wageRow.total_wage : 0;

    res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        onLeaveToday,
        absentToday,
        pendingLeaves,
        totalMonthlyPayroll,
        attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0
      },
      departments: deptRows
    });
  } catch (error) {
    console.error('Get Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
}

async function exportAttendanceCSV(req, res) {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : (now.getMonth() + 1);
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const monthStr = targetMonth.toString().padStart(2, '0');
    const monthPattern = `${targetYear}-${monthStr}%`;

    const records = await db.prepare(`
      SELECT 
        e.first_name || ' ' || e.last_name as name,
        u.login_id,
        e.department,
        a.date,
        COALESCE(a.check_in, 'N/A') as check_in,
        COALESCE(a.check_out, 'N/A') as check_out,
        COALESCE(a.work_hours, '00:00') as work_hours,
        COALESCE(a.extra_hours, '00:00') as extra_hours,
        a.status
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = ? AND a.date LIKE ?
      ORDER BY a.date ASC, e.first_name ASC
    `).all(req.user.company_id, monthPattern);

    let csv = 'Employee Name,Login ID,Department,Date,Check In,Check Out,Work Hours,Extra Hours,Status\n';
    records.forEach(r => {
      csv += `"${r.name}","${r.login_id}","${r.department}","${r.date}","${r.check_in}","${r.check_out}","${r.work_hours}","${r.extra_hours}","${r.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${targetYear}-${monthStr}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export Attendance CSV Error:', error);
    res.status(500).json({ success: false, message: 'Failed to export attendance CSV.' });
  }
}

module.exports = {
  getAnalyticsOverview,
  exportAttendanceCSV
};
