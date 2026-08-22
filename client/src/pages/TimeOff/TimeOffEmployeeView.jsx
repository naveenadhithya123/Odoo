import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import YearCalendar from './YearCalendar';
import { Plus, Calendar, FileText, Clock } from 'lucide-react';

export const TimeOffEmployeeView = ({ onOpenNewModal, balances, leaveTypes }) => {
  const { user } = useAuth();
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarData, setCalendarData] = useState({ dayMap: {}, holidays: [] });
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarAndRequests = async () => {
    try {
      setLoading(true);
      const [calRes, reqRes] = await Promise.all([
        leaveService.getYearCalendar(user?.employee_id, calendarYear),
        leaveService.getRequests()
      ]);

      if (calRes.data.success) {
        setCalendarData({
          dayMap: calRes.data.dayMap || {},
          holidays: calRes.data.holidays || []
        });
      }

      if (reqRes.data.success) {
        setMyRequests(reqRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load leave calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employee_id) {
      fetchCalendarAndRequests();
    }
  }, [user?.employee_id, calendarYear]);

  return (
    <div className="space-y-6">
      
      {/* Top Header Tab & NEW Button (Wireframe 7) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Time Off Tab Banner */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 rounded-lg bg-[#5c2438]/70 text-rose-300 border border-rose-800/80 text-xs font-bold uppercase tracking-wider">
            Time Off
          </div>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Plus size={16} />
            <span>NEW</span>
          </button>
        </div>

        {/* Balance Cards Summary (Wireframe 7) */}
        <div className="flex items-center gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2 text-right">
            <span className="text-xs font-bold text-sky-400 block">Paid time Off</span>
            <span className="text-sm font-bold text-white font-mono">{balances?.paid_days_available || 24} Days Available</span>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-2 text-right">
            <span className="text-xs font-bold text-sky-400 block">Sick time off</span>
            <span className="text-sm font-bold text-white font-mono">{balances?.sick_days_available || 7} Days Available</span>
          </div>
        </div>

      </div>

      {/* Full-Year Calendar View with Legend & Holidays (Wireframe 7) */}
      <YearCalendar
        year={calendarYear}
        dayMap={calendarData.dayMap}
        holidays={calendarData.holidays}
        onPrevYear={() => setCalendarYear(prev => prev - 1)}
        onNextYear={() => setCalendarYear(prev => prev + 1)}
      />

      {/* My Submitted Leave Requests List */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-[#1b222c] border-b border-[#30363d] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Clock size={16} className="text-purple-400" />
            <span>My Time Off History</span>
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {myRequests.length} Submissions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161b22] text-gray-400 uppercase tracking-wider border-b border-[#30363d]">
                <th className="py-3 px-6">Leave Type</th>
                <th className="py-3 px-6">From</th>
                <th className="py-3 px-6">To</th>
                <th className="py-3 px-6">Allocation</th>
                <th className="py-3 px-6">Attachment</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Manager Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d] text-gray-200">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No leave requests submitted yet. Click NEW to apply.
                  </td>
                </tr>
              ) : (
                myRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1b222c]">
                    <td className="py-3 px-6 font-bold text-sky-400">{r.leave_type_name}</td>
                    <td className="py-3 px-6 font-mono text-gray-300">{r.start_date}</td>
                    <td className="py-3 px-6 font-mono text-gray-300">{r.end_date}</td>
                    <td className="py-3 px-6 font-mono font-bold text-white">{r.days_count} Days</td>
                    <td className="py-3 px-6">
                      {r.attachment_url ? (
                        <a href={r.attachment_url} target="_blank" rel="noreferrer" className="text-purple-400 underline">
                          Attachment
                        </a>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        r.status === 'validated'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : r.status === 'to_approve'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {r.status === 'validated' ? 'Validated' : r.status === 'to_approve' ? 'To Approve' : 'Refused'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-gray-400">
                      {r.approver_comment || '—'}
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

export default TimeOffEmployeeView;
