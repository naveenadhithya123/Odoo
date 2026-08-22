const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { calculateSalaryBreakdown, calculatePayslipFromAttendance } = require('../utils/salaryCalculator');
const { generatePayslipPDF } = require('../utils/pdfGenerator');

async function computePayableDays(employeeId, month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStr = month.toString().padStart(2, '0');
  const monthPattern = `${year}-${monthStr}%`;

  let totalWorkingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      totalWorkingDays++;
    }
  }

  const presentRows = await db.prepare(`
    SELECT COUNT(DISTINCT date) as count FROM attendance
    WHERE employee_id = ? AND date LIKE ? AND check_in IS NOT NULL
  `).get(employeeId, monthPattern);
  const presentDays = presentRows ? presentRows.count : 0;

  const leaveRows = await db.prepare(`
    SELECT lr.* FROM leave_requests lr
    JOIN leave_types lt ON lt.id = lr.leave_type_id
    WHERE lr.employee_id = ? AND lr.status = 'validated' AND lt.is_paid = 1
      AND (lr.start_date LIKE ? OR lr.end_date LIKE ?)
  `).all(employeeId, monthPattern, monthPattern);

  let approvedPaidLeaveDays = 0;
  leaveRows.forEach(lr => {
    approvedPaidLeaveDays += lr.days_count;
  });

  let payableDays = presentDays + approvedPaidLeaveDays;
  if (presentDays === 0 && approvedPaidLeaveDays === 0) {
    payableDays = 0;
  }
  payableDays = Math.min(totalWorkingDays, payableDays);

  return {
    totalWorkingDays,
    presentDays,
    approvedPaidLeaveDays,
    payableDays
  };
}

async function getPayrollOverview(req, res) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const companyId = req.user.company_id;

    const employees = await db.prepare(`
      SELECT 
        e.id as employee_id, e.first_name, e.last_name, e.job_position, e.department, e.profile_picture,
        u.login_id,
        ss.monthly_wage, ss.yearly_wage, ss.working_days_per_week,
        ps.id as payslip_id, ps.payable_days, ps.gross_salary, ps.total_deductions, ps.net_salary, ps.status as payslip_status
      FROM employees e
      JOIN users u ON u.id = e.user_id
      LEFT JOIN salary_structures ss ON ss.employee_id = e.id
      LEFT JOIN payslips ps ON ps.employee_id = e.id AND ps.month = ? AND ps.year = ?
      WHERE u.company_id = ? AND u.is_active = 1
      ORDER BY e.first_name ASC
    `).all(month, year, companyId);

    const data = [];
    for (const emp of employees) {
      const wage = emp.monthly_wage || 50000;
      const breakdown = calculateSalaryBreakdown(wage);
      const computed = await computePayableDays(emp.employee_id, month, year);

      data.push({
        employee_id: emp.employee_id,
        name: `${emp.first_name} ${emp.last_name}`,
        login_id: emp.login_id,
        job_position: emp.job_position,
        department: emp.department,
        profile_picture: emp.profile_picture,
        monthly_wage: wage,
        yearly_wage: emp.yearly_wage || (wage * 12),
        payable_days: emp.payable_days !== null && emp.payable_days !== undefined ? emp.payable_days : computed.payableDays,
        total_working_days: computed.totalWorkingDays,
        gross_salary: emp.gross_salary || breakdown.monthly_wage,
        deductions: emp.total_deductions || breakdown.total_deductions,
        net_salary: emp.net_salary || breakdown.net_salary,
        payslip_id: emp.payslip_id || null,
        payslip_status: emp.payslip_status || 'not_generated'
      });
    }

    res.json({
      success: true,
      month,
      year,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Get Payroll Overview Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll overview.' });
  }
}

async function getEmployeePayroll(req, res) {
  try {
    const employeeId = req.params.employeeId || req.user.employee_id;

    const salaryStructure = await db.prepare(`SELECT * FROM salary_structures WHERE employee_id = ?`).get(employeeId);
    const wage = salaryStructure ? salaryStructure.monthly_wage : 50000;
    const breakdown = calculateSalaryBreakdown(wage, salaryStructure || {});

    const payslips = await db.prepare(`
      SELECT * FROM payslips WHERE employee_id = ? ORDER BY year DESC, month DESC
    `).all(employeeId);

    res.json({
      success: true,
      salary_structure: {
        ...salaryStructure,
        ...breakdown
      },
      payslips
    });
  } catch (error) {
    console.error('Get Employee Payroll Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee payroll.' });
  }
}

async function generatePayslip(req, res) {
  try {
    const { employee_id, month, year, custom_payable_days } = req.body;

    if (!employee_id || !month || !year) {
      return res.status(400).json({ success: false, message: 'Employee ID, month, and year are required.' });
    }

    const structure = await db.prepare(`SELECT * FROM salary_structures WHERE employee_id = ?`).get(employee_id);
    const wage = structure ? structure.monthly_wage : 50000;

    let payableDays;
    let totalWorkingDays;

    if (custom_payable_days !== undefined && custom_payable_days !== null) {
      payableDays = Number(custom_payable_days);
      const daysInMonth = new Date(year, month, 0).getDate();
      let twd = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        if (d.getDay() !== 0 && d.getDay() !== 6) twd++;
      }
      totalWorkingDays = twd;
    } else {
      const computed = await computePayableDays(employee_id, month, year);
      payableDays = computed.payableDays;
      totalWorkingDays = computed.totalWorkingDays;
      if (payableDays === 0) payableDays = totalWorkingDays;
    }

    const result = calculatePayslipFromAttendance(wage, payableDays, totalWorkingDays, structure || {});
    const payslipId = uuidv4();

    const existing = await db.prepare(`SELECT id FROM payslips WHERE employee_id = ? AND month = ? AND year = ?`).get(employee_id, month, year);

    if (existing) {
      await db.prepare(`
        UPDATE payslips SET
          monthly_wage = ?,
          payable_days = ?,
          total_working_days = ?,
          basic = ?,
          hra = ?,
          standard_allowance = ?,
          performance_bonus = ?,
          lta = ?,
          fixed_allowance = ?,
          gross_salary = ?,
          pf_employee = ?,
          pf_employer = ?,
          professional_tax = ?,
          total_deductions = ?,
          net_salary = ?,
          status = 'generated'
        WHERE id = ?
      `).run(
        wage, payableDays, totalWorkingDays,
        result.basic_amount, result.hra_amount, result.standard_allowance_amount,
        result.performance_bonus_amount, result.lta_amount, result.fixed_allowance_amount,
        result.prorated_wage, result.pf_employee_amount, result.pf_employer_amount,
        result.professional_tax, result.total_deductions, result.net_salary,
        existing.id
      );
    } else {
      await db.prepare(`
        INSERT INTO payslips (
          id, employee_id, month, year, monthly_wage, payable_days, total_working_days,
          basic, hra, standard_allowance, performance_bonus, lta, fixed_allowance,
          gross_salary, pf_employee, pf_employer, professional_tax, total_deductions, net_salary, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated')
      `).run(
        payslipId, employee_id, month, year, wage, payableDays, totalWorkingDays,
        result.basic_amount, result.hra_amount, result.standard_allowance_amount,
        result.performance_bonus_amount, result.lta_amount, result.fixed_allowance_amount,
        result.prorated_wage, result.pf_employee_amount, result.pf_employer_amount,
        result.professional_tax, result.total_deductions, result.net_salary
      );
    }

    const emp = await db.prepare(`SELECT user_id FROM employees WHERE id = ?`).get(employee_id);
    if (emp) {
      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (?, ?, 'Payslip Generated', ?, 'payroll')
      `).run(uuidv4(), emp.user_id, `Your payslip for ${month}/${year} has been generated. Net Salary: ₹${result.net_salary}`);
    }

    res.json({
      success: true,
      message: 'Payslip generated successfully!',
      payslipId: existing ? existing.id : payslipId,
      data: result
    });
  } catch (error) {
    console.error('Generate Payslip Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate payslip.' });
  }
}

async function downloadPayslipPDF(req, res) {
  try {
    const { id } = req.params;

    const payslip = await db.prepare(`
      SELECT ps.*, 
             e.first_name, e.last_name, e.job_position, e.department,
             u.login_id,
             bd.pan_no, bd.bank_name, bd.account_number
      FROM payslips ps
      JOIN employees e ON e.id = ps.employee_id
      JOIN users u ON u.id = e.user_id
      LEFT JOIN bank_details bd ON bd.employee_id = e.id
      WHERE ps.id = ?
    `).get(id);

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found.' });
    }

    const pdfBuffer = await generatePayslipPDF({
      ...payslip,
      period: `${payslip.month.toString().padStart(2, '0')}/${payslip.year}`
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${payslip.login_id}-${payslip.month}-${payslip.year}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download Payslip PDF Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payslip PDF.' });
  }
}

module.exports = {
  getPayrollOverview,
  getEmployeePayroll,
  generatePayslip,
  downloadPayslipPDF
};
