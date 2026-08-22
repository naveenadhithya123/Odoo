import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Download, Calendar, CheckCircle2, FileText, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PayrollView = () => {
  const { user, isAdmin } = useAuth();
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [overview, setOverview] = useState([]);
  const [myPayroll, setMyPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const res = await payrollService.getOverview({ month, year });
        if (res.data.success) {
          setOverview(res.data.data);
        }
      } else {
        const res = await payrollService.getMyPayroll();
        if (res.data.success) {
          setMyPayroll(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year, isAdmin]);

  const handleGeneratePayslip = async (employeeId, payableDays) => {
    try {
      setGeneratingId(employeeId);
      const res = await payrollService.generatePayslip({
        employee_id: employeeId,
        month,
        year,
        custom_payable_days: payableDays
      });
      if (res.data.success) {
        setSuccessMsg(`Payslip generated successfully!`);
        confetti({ particleCount: 40, spread: 60 });
        fetchPayroll();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Generate failed:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadPDF = (payslipId) => {
    if (!payslipId) return;
    const url = payrollService.getPdfUrl(payslipId);
    window.open(url, '_blank');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <DollarSign size={22} className="text-emerald-400" />
              <span>Payroll Management</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Automated salary computation based on verified attendance logs and approved leaves.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-xl p-2 shadow-sm">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ADMIN VIEW */}
        {isAdmin ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-[#1b222c] border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Calendar size={16} className="text-purple-400" />
                <span>Payroll Summary for {monthNames[month - 1]} {year}</span>
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {overview.length} Employees
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#161b22] text-gray-400 uppercase tracking-wider border-b border-[#30363d]">
                    <th className="py-3.5 px-6">Employee</th>
                    <th className="py-3.5 px-6 text-right">Defined Wage</th>
                    <th className="py-3.5 px-6 text-center">Payable Days</th>
                    <th className="py-3.5 px-6 text-right">Gross Pay</th>
                    <th className="py-3.5 px-6 text-right">Deductions (PF+Tax)</th>
                    <th className="py-3.5 px-6 text-right font-bold text-white">Net Salary</th>
                    <th className="py-3.5 px-6 text-right">Payslip Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d] text-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Calculating payroll records...
                      </td>
                    </tr>
                  ) : overview.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    overview.map((emp) => (
                      <tr key={emp.employee_id} className="hover:bg-[#1b222c] transition-colors">
                        <td className="py-3.5 px-6 font-bold text-white flex items-center gap-3">
                          {emp.profile_picture ? (
                            <img src={emp.profile_picture} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-[#30363d]" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-900 text-white font-bold text-xs flex items-center justify-center">
                              {emp.name[0]}
                            </div>
                          )}
                          <div>
                            <span>{emp.name}</span>
                            <span className="block text-[10px] text-gray-400 font-mono">{emp.login_id} • {emp.department}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-gray-300">
                          ₹{Number(emp.monthly_wage).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-6 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                            {emp.payable_days} / {emp.total_working_days}d
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-gray-300">
                          ₹{Number(emp.gross_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono text-rose-400">
                          -₹{Number(emp.deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono font-bold text-emerald-400 text-sm">
                          ₹{Number(emp.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleGeneratePayslip(emp.employee_id, emp.payable_days)}
                              disabled={generatingId === emp.employee_id}
                              className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold transition-all shadow-sm disabled:opacity-50"
                            >
                              {generatingId === emp.employee_id ? 'Generating...' : emp.payslip_id ? 'Recalculate' : 'Generate'}
                            </button>
                            {emp.payslip_id && (
                              <button
                                onClick={() => handleDownloadPDF(emp.payslip_id)}
                                className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-emerald-400 border border-[#30363d]"
                                title="Download PDF Payslip"
                              >
                                <Download size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* EMPLOYEE VIEW */
          <div className="space-y-6">
            {/* My Salary Structure Banner */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">
                My Salary Structure (Read-Only)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Monthly Wage</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    ₹{Number(myPayroll?.salary_structure?.monthly_wage || 50000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Yearly Wage</span>
                  <span className="text-xl font-bold font-mono text-white">
                    ₹{Number(myPayroll?.salary_structure?.yearly_wage || 600000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Estimated Net Pay</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    ₹{Number(myPayroll?.salary_structure?.net_salary || 46800).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Payslips */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 bg-[#1b222c] border-b border-[#30363d]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  My Downloadable Payslips
                </h3>
              </div>

              <div className="divide-y divide-[#21262d]">
                {myPayroll?.payslips?.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No payslips generated yet for your account.
                  </div>
                ) : (
                  myPayroll?.payslips?.map((ps) => (
                    <div key={ps.id} className="p-4 flex items-center justify-between hover:bg-[#1b222c] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            Payslip — {monthNames[ps.month - 1]} {ps.year}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            Payable Days: {ps.payable_days}/{ps.total_working_days} • Net Salary: ₹{Number(ps.net_salary).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadPDF(ps.id)}
                        className="flex items-center gap-1.5 btn-primary text-xs px-3.5 py-1.5"
                      >
                        <Download size={14} />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PayrollView;
