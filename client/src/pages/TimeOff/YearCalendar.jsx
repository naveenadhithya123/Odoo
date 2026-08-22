import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, PartyPopper } from 'lucide-react';

export const YearCalendar = ({ year = 2026, dayMap = {}, holidays = [], onPrevYear, onNextYear }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Helper to get days matrix for a month
  const getDaysInMonth = (monthIndex, yr) => {
    const firstDay = new Date(yr, monthIndex, 1).getDay();
    const totalDays = new Date(yr, monthIndex + 1, 0).getDate();

    const matrix = [];
    let currentWeek = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        matrix.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      matrix.push(currentWeek);
    }

    return matrix;
  };

  const getDayStatus = (monthIndex, day) => {
    if (!day) return null;
    const mStr = (monthIndex + 1).toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;

    // Check holiday first
    const isHoliday = holidays.some(h => h.date === dateStr);

    const leave = dayMap[dateStr];
    return {
      status: leave ? leave.status : null,
      isHoliday,
      info: leave
    };
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      
      {/* 12-Month Calendar Grid (3 columns on xl) */}
      <div className="xl:col-span-3 bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
          <div className="flex items-center gap-2.5">
            <CalendarIcon size={18} className="text-purple-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Full-Year Time Off Calendar — {year}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrevYear}
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-gray-300 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono font-bold text-xs text-white px-2">
              {year}
            </span>
            <button
              onClick={onNextYear}
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-gray-300 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 12 Mini Calendars in 3x4 Grid (Wireframe 7) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {months.map((monthName, mIdx) => {
            const weeks = getDaysInMonth(mIdx, year);
            return (
              <div key={monthName} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-2">
                <div className="text-center font-bold text-xs text-gray-200 border-b border-[#21262d] pb-1">
                  {monthName} {year}
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-gray-500">
                  {daysOfWeek.map((d, i) => (
                    <span key={i} className={i === 0 || i === 6 ? 'text-rose-400/70' : ''}>{d}</span>
                  ))}
                </div>

                {/* Day cells */}
                <div className="space-y-1">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-cols-7 text-center text-[10px] gap-0.5">
                      {week.map((day, dIdx) => {
                        if (!day) {
                          return <span key={dIdx} className="p-1"></span>;
                        }

                        const dayData = getDayStatus(mIdx, day);
                        let cellClass = 'text-gray-300 hover:bg-[#21262d]';

                        if (dayData?.status === 'validated') {
                          cellClass = 'bg-emerald-600 text-white font-bold rounded shadow-sm';
                        } else if (dayData?.status === 'to_approve') {
                          cellClass = 'bg-amber-500 text-black font-bold rounded shadow-sm';
                        } else if (dayData?.status === 'refused') {
                          cellClass = 'bg-rose-600 text-white font-bold rounded shadow-sm';
                        } else if (dayData?.isHoliday) {
                          cellClass = 'bg-purple-900/80 text-purple-300 font-semibold rounded border border-purple-700/60';
                        }

                        return (
                          <span
                            key={dIdx}
                            className={`p-1 rounded cursor-pointer transition-colors ${cellClass}`}
                            title={
                              dayData?.isHoliday
                                ? 'Public Holiday'
                                : dayData?.status
                                ? `Leave (${dayData.status})`
                                : `${day} ${monthName}`
                            }
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Right Column: Legend & Public Holidays Panel (Wireframe 7) */}
      <div className="space-y-6">
        
        {/* Legend Box */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-[#30363d] pb-2">
            Legend
          </h4>
          <div className="space-y-2.5 text-xs text-gray-300">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded bg-emerald-600 flex-shrink-0 shadow-sm"></span>
              <span className="font-medium text-emerald-400">🟩 Validated</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded bg-amber-500 flex-shrink-0 shadow-sm"></span>
              <span className="font-medium text-amber-400">🟨 To Approve</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded bg-rose-600 flex-shrink-0 shadow-sm"></span>
              <span className="font-medium text-rose-400">🟥 Refused</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded bg-purple-900 border border-purple-600 flex-shrink-0"></span>
              <span className="font-medium text-purple-300">Public Holiday</span>
            </div>
          </div>
        </div>

        {/* Public Holidays List */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <PartyPopper size={14} className="text-purple-400" />
              <span>Public Holidays</span>
            </h4>
            <span className="text-[10px] text-gray-400 font-mono">{holidays.length} Days</span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#21262d] max-h-80 overflow-y-auto pr-1">
            {holidays.map((h) => (
              <div key={h.date} className="pt-2 flex items-start justify-between gap-2">
                <span className="text-gray-200 font-medium">{h.name}</span>
                <span className="text-[11px] font-mono text-purple-400 flex-shrink-0 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  {h.date}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default YearCalendar;
