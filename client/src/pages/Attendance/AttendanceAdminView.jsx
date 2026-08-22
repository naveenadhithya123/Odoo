import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/api';
import { ChevronLeft, ChevronRight, Calendar, Search, Clock, ArrowUpDown } from 'lucide-react';

export const AttendanceAdminView = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDailyAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getDaily(selectedDate, search);
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch daily attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyAttendance();
  }, [selectedDate, search]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Format date display (e.g. "22, October 2025")
  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return `${day}, ${month} ${year}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Subnav & Controls matching Wireframe 5 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
        
        {/* Navigation buttons: ← →, Date selector, Day toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-[#21262d] border border-[#30363d] p-0.5">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-md hover:bg-[#30363d] text-gray-300 hover:text-white transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-md hover:bg-[#30363d] text-gray-300 hover:text-white transition-colors"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <span className="px-3 py-1.5 rounded-lg bg-purple-950/70 text-purple-300 border border-purple-800/60 text-xs font-semibold uppercase tracking-wider">
            Day View
          </span>
        </div>

        {/* Searchbar */}
        <div className="relative flex-1 sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl overflow-hidden">
        
        {/* Active Selected Date Header */}
        <div className="px-6 py-3.5 bg-[#1b222c] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {formatDateHeader(selectedDate)}
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {records.length} Employees listed
          </span>
        </div>

        {/* Attendance List Table (Emp | Check In | Check Out | Work Hours | Extra hours) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161b22] text-gray-400 uppercase tracking-wider border-b border-[#30363d]">
                <th className="py-3 px-6">Emp</th>
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
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No attendance records for {selectedDate}
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.employee_id} className="hover:bg-[#1b222c] transition-colors">
                    <td className="py-3.5 px-6 font-medium text-white flex items-center gap-3">
                      {r.profile_picture ? (
                        <img src={r.profile_picture} alt={r.name} className="w-7 h-7 rounded-full object-cover border border-[#30363d]" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-purple-900 text-white font-bold text-[10px] flex items-center justify-center">
                          {r.name[0]}
                        </div>
                      )}
                      <div>
                        <span>{r.name}</span>
                        <span className="block text-[10px] text-gray-400 font-mono">{r.login_id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-gray-300">{r.check_in}</td>
                    <td className="py-3.5 px-6 font-mono text-gray-300">{r.check_out}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-emerald-400">{r.work_hours}</td>
                    <td className="py-3.5 px-6 font-mono text-purple-400">{r.extra_hours}</td>
                    <td className="py-3.5 px-6 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        r.status.includes('Present')
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : r.status.includes('Leave')
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {r.status}
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

export default AttendanceAdminView;
