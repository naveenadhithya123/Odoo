import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/api';
import { ArrowRight, LogOut, CheckCircle2, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SystrayWidget = ({ onAttendanceChange }) => {
  const [status, setStatus] = useState({
    isCheckedIn: false,
    isCheckedOut: false,
    statusDot: 'red', // 'red' or 'green'
    checkInTime: null,
    sinceText: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await attendanceService.getSystrayStatus();
      if (res.data.success) {
        setStatus({
          isCheckedIn: res.data.isCheckedIn,
          isCheckedOut: res.data.isCheckedOut,
          statusDot: res.data.statusDot || (res.data.isCheckedIn ? 'green' : 'red'),
          checkInTime: res.data.checkInTime,
          sinceText: res.data.sinceText,
        });
      }
    } catch (err) {
      console.error('Systray Status fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 30s
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await attendanceService.checkIn();
      if (res.data.success) {
        setStatus({
          isCheckedIn: true,
          isCheckedOut: false,
          statusDot: 'green',
          checkInTime: res.data.checkInTime,
          sinceText: res.data.sinceText,
        });

        // Trigger confetti celebration
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.2, x: 0.9 }
        });

        if (onAttendanceChange) onAttendanceChange();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await attendanceService.checkOut();
      if (res.data.success) {
        setStatus({
          isCheckedIn: false,
          isCheckedOut: true,
          statusDot: 'green',
          checkInTime: status.checkInTime,
          sinceText: `Checked Out (${res.data.workHours} hrs)`,
        });
        if (onAttendanceChange) onAttendanceChange();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-3 bg-[#161b22]/90 border border-[#30363d] rounded-lg px-3 py-1.5 shadow-sm">
        {/* Status Dot */}
        <div className="flex items-center gap-2">
          {status.statusDot === 'green' ? (
            <span className="relative flex h-3 w-3" title="Checked In">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="relative flex h-3 w-3" title="Not Checked In">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          )}

          {/* Since Text */}
          {status.isCheckedIn && status.sinceText && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              {status.sinceText}
            </span>
          )}

          {status.isCheckedOut && (
            <span className="text-xs font-mono text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/50">
              {status.sinceText}
            </span>
          )}
        </div>

        {/* Check In / Check Out Action Button */}
        {!status.isCheckedIn && !status.isCheckedOut && (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span>Check IN</span>
            <ArrowRight size={14} />
          </button>
        )}

        {status.isCheckedIn && (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 px-3 py-1.5 rounded transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span>Check Out</span>
            <ArrowRight size={14} />
          </button>
        )}

        {status.isCheckedOut && (
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium px-2 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded">
            <CheckCircle2 size={13} />
            <span>Shift Completed</span>
          </div>
        )}
      </div>

      {error && (
        <span className="text-[11px] text-rose-400 mt-1 mr-1">{error}</span>
      )}
    </div>
  );
};

export default SystrayWidget;
