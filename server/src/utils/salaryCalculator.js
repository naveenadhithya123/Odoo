/**
 * Calculates all salary components, PF, and Tax based on Monthly Wage and percentages.
 * 
 * Rules:
 * - Basic Salary = % of Monthly Wage (default 50%)
 * - HRA = % of Basic Salary (default 50%)
 * - Standard Allowance = % of Basic Salary (default 16.67%)
 * - Performance Bonus = % of Basic Salary (default 8.33%)
 * - LTA = % of Basic Salary (default 8.33%)
 * - Fixed Allowance = Monthly Wage - Sum(Basic, HRA, Standard, Bonus, LTA)
 * - Employee PF = 12% of Basic Salary
 * - Employer PF = 12% of Basic Salary
 * - Professional Tax = ₹200.00
 */
function calculateSalaryBreakdown(wageInput, customPcts = {}) {
  const monthlyWage = Number(wageInput) || 0;
  const yearlyWage = Math.round(monthlyWage * 12 * 100) / 100;

  const basicPct = customPcts.basic_pct !== undefined ? Number(customPcts.basic_pct) : 50.00;
  const hraPct = customPcts.hra_pct !== undefined ? Number(customPcts.hra_pct) : 50.00;
  const standardPct = customPcts.standard_allowance_pct !== undefined ? Number(customPcts.standard_allowance_pct) : 16.67;
  const bonusPct = customPcts.performance_bonus_pct !== undefined ? Number(customPcts.performance_bonus_pct) : 8.33;
  const ltaPct = customPcts.lta_pct !== undefined ? Number(customPcts.lta_pct) : 8.33;
  const pfEmpPct = customPcts.pf_employee_pct !== undefined ? Number(customPcts.pf_employee_pct) : 12.00;
  const pfEmprPct = customPcts.pf_employer_pct !== undefined ? Number(customPcts.pf_employer_pct) : 12.00;
  const profTax = customPcts.professional_tax !== undefined ? Number(customPcts.professional_tax) : 200.00;

  // Basic = % of Wage
  const basicAmount = Math.round((monthlyWage * (basicPct / 100)) * 100) / 100;

  // Components as % of Basic
  const hraAmount = Math.round((basicAmount * (hraPct / 100)) * 100) / 100;
  const standardAmount = Math.round((basicAmount * (standardPct / 100)) * 100) / 100;
  const bonusAmount = Math.round((basicAmount * (bonusPct / 100)) * 100) / 100;
  const ltaAmount = Math.round((basicAmount * (ltaPct / 100)) * 100) / 100;

  const sumSubComponents = basicAmount + hraAmount + standardAmount + bonusAmount + ltaAmount;
  const fixedAllowanceAmount = Math.max(0, Math.round((monthlyWage - sumSubComponents) * 100) / 100);
  const fixedAllowancePct = monthlyWage > 0 ? Math.round(((fixedAllowanceAmount / monthlyWage) * 100) * 100) / 100 : 0;

  // PF on Basic
  const pfEmployeeAmount = Math.round((basicAmount * (pfEmpPct / 100)) * 100) / 100;
  const pfEmployerAmount = Math.round((basicAmount * (pfEmprPct / 100)) * 100) / 100;

  // Total deductions
  const totalDeductions = Math.round((pfEmployeeAmount + profTax) * 100) / 100;
  const netMonthlySalary = Math.round((monthlyWage - totalDeductions) * 100) / 100;

  return {
    monthly_wage: monthlyWage,
    yearly_wage: yearlyWage,
    basic_pct: basicPct,
    basic_amount: basicAmount,
    hra_pct: hraPct,
    hra_amount: hraAmount,
    standard_allowance_pct: standardPct,
    standard_allowance_amount: standardAmount,
    performance_bonus_pct: bonusPct,
    performance_bonus_amount: bonusAmount,
    lta_pct: ltaPct,
    lta_amount: ltaAmount,
    fixed_allowance_amount: fixedAllowanceAmount,
    fixed_allowance_pct: fixedAllowancePct,
    pf_employee_pct: pfEmpPct,
    pf_employee_amount: pfEmployeeAmount,
    pf_employer_pct: pfEmprPct,
    pf_employer_amount: pfEmployerAmount,
    professional_tax: profTax,
    total_deductions: totalDeductions,
    net_salary: netMonthlySalary
  };
}

/**
 * Calculates prorated payslip figures based on payable days vs working days.
 */
function calculatePayslipFromAttendance(monthlyWage, payableDays, totalWorkingDays, structure) {
  const ratio = totalWorkingDays > 0 ? Math.min(1, Math.max(0, payableDays / totalWorkingDays)) : 1;
  const proratedWage = Math.round((monthlyWage * ratio) * 100) / 100;

  const breakdown = calculateSalaryBreakdown(proratedWage, structure);

  return {
    monthly_wage: monthlyWage,
    payable_days: payableDays,
    total_working_days: totalWorkingDays,
    prorated_wage: proratedWage,
    ...breakdown
  };
}

module.exports = {
  calculateSalaryBreakdown,
  calculatePayslipFromAttendance
};
