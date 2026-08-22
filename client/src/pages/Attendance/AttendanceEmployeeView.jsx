import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, Clock, Award, ShieldAlert } from 'lucide-react';

export const AttendanceEmployeeView = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [records, setRecords] = useState([]);
  const [kpis, setKpis] = useState({
    present_days: 0,
    leaves_count: 0,
    total_working_days: 22,
  });
  const [loading, setLoading] = useState(true);

  const fetchMonthly = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getMonthly(user?.employee_id, currentMonth, currentYear);
      if (res.data.success) {
        setRecords(res.data.data);
        if (res.data.kpis) setKpis(res.data.kpis);
      }
    } catch (err) {
      console.error('Failed to fetch employee attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employee_id) {
      fetchMonthly();
    }
  }, [user?.employee_id, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      
      {/* Subnav & Controls matching Wireframe 8 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
        
        {/* Navigation buttons: ← →, Month dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-[#21262d] border border-[#30363d] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-[#30363d] text-gray-300 hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-[#30363d] text-gray-300 hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Summary KPI Tiles matching Wireframe 8 */}
        <div className="grid grid-cols-3 gap-3">
          
          <div className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
              Count of days present
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {kpis.present_days}
            </span>
          </div>

          <div className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
              Leaves count
            </span>
            <span className="text-base font-bold text-sky-400 font-mono">
              {kpis.leaves_count}
            </span>
          </div>

          <div className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
              Total working days
            </span>
            <span className="text-base font-bold text-purple-400 font-mono">
              {kpis.total_working_days}
            </span>
          </div>

        </div>

      </div>

      {/* Table Container */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl overflow-hidden">
        
        <div className="px-6 py-3.5 bg-[#1b222c] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {monthNames[currentMonth - 1]} {currentYear} Attendance Log
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-mono">
            {records.length} Recorded Shifts
          </span>
        </div>

        {/* Table: Date | Check In | Check Out | Work Hours | Extra hours */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161b22] text-gray-400 uppercase tracking-wider border-b border-[#30363d]">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Check In</th>
                <th className="py-3 px-6">Check Out</th>
                <th className="py-3 px-6 font-semibold">Work Hours</th>
                <th className="py-3 px-6 font-semibold">Extra hours</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d] text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Loading monthly records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No attendance logs recorded for this month
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1b222c] transition-colors">
                    <td className="py-3.5 px-6 font-mono font-medium text-white">{r.date}</td>
                    <td className="py-3.5 px-6 font-mono text-gray-300">{r.check_in || '—'}</td>
                    <td className="py-3.5 px-6 font-mono text-gray-300">{r.check_out || '—'}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-400">{r.work_hours || '00:00'}</td>
                    <td className="py-3.5 px-6 font-mono text-purple-400">{r.extra_hours || '00:00'}</td>
                    <td className="py-3.5 px-6 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        r.status === 'present'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : r.status === 'on_leave'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {r.status === 'present' ? 'Present' : r.status === 'on_leave' ? 'On Leave' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default AttendanceEmployeeView;
