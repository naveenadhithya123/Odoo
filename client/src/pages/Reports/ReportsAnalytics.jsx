import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/api';
import { BarChart3, Users, CheckCircle2, Plane, Clock, DollarSign, Download, Calendar } from 'lucide-react';

export const ReportsAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportMonth, setExportMonth] = useState(() => new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(() => new Date().getFullYear());

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await reportService.getOverview();
      if (res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    const url = reportService.getAttendanceCsvUrl(exportMonth, exportYear);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <BarChart3 size={22} className="text-purple-400" />
              <span>HR Analytics & Reports</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Organization overview, attendance metrics, leave utilization, and payroll expense.
            </p>
          </div>
        </div>

        {/* Top HR KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
              <Users size={24} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Total Headcount</span>
              <span className="text-2xl font-black text-white font-mono">{analytics?.stats?.totalEmployees || 0}</span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Present Today</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {analytics?.stats?.presentToday || 0} ({analytics?.stats?.attendanceRate || 0}%)
              </span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-950 text-sky-400 border border-sky-800">
              <Plane size={24} className="rotate-45" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">On Leave Today</span>
              <span className="text-2xl font-black text-sky-400 font-mono">{analytics?.stats?.onLeaveToday || 0}</span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
              <DollarSign size={24} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Monthly Payroll</span>
              <span className="text-xl font-bold text-white font-mono">
                ₹{Number(analytics?.stats?.totalMonthlyPayroll || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

        </div>

        {/* Middle Section: Department Distribution & Export Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Department Breakdown */}
          <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Department Distribution
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analytics?.departments?.map((dept) => (
                <div key={dept.department} className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-200">{dept.department || 'General'}</span>
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded border border-purple-800/60">
                    {dept.count} Members
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Report Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Download size={16} />
                <span>Export Attendance Report</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Download verified monthly shift logs, work hours, and overtime as a CSV spreadsheet.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(Number(e.target.value))}
                  className="input-field text-xs font-semibold"
                >
                  {[
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ].map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(Number(e.target.value))}
                  className="input-field text-xs font-semibold"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full btn-primary py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReportsAnalytics;
