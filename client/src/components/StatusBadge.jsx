import React from 'react';
import { Plane } from 'lucide-react';

/**
 * StatusBadge matching the exact approved wireframe specs:
 * 🟢 Green dot: Present in the office
 * ✈️ Airplane: On approved leave
 * 🟡 Yellow dot: Absent (not marked present, no approved leave)
 */
export const StatusBadge = ({ status, size = 'md', showLabel = false }) => {
  const isAirplane = status === 'on_leave' || status === 'leave' || status === 'On Leave';
  const isPresent = status === 'present' || status === 'Present' || status === 'Checked Out';
  const isAbsent = !isAirplane && !isPresent;

  const dotSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4.5 h-4.5',
  };

  const iconSizes = {
    sm: 12,
    md: 15,
    lg: 18,
  };

  if (isAirplane) {
    return (
      <div className="inline-flex items-center gap-1.5" title="On Leave">
        <span className="flex items-center justify-center p-1 rounded-full bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40">
          <Plane size={iconSizes[size] || 15} className="rotate-45" />
        </span>
        {showLabel && <span className="text-xs font-medium text-sky-400">On Leave</span>}
      </div>
    );
  }

  if (isPresent) {
    return (
      <div className="inline-flex items-center gap-1.5" title="Present in office">
        <span className={`relative flex ${dotSizes[size] || 'w-3.5 h-3.5'}`}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500 ring-2 ring-emerald-950"></span>
        </span>
        {showLabel && <span className="text-xs font-medium text-emerald-400">Present</span>}
      </div>
    );
  }

  // Absent default 🟡
  return (
    <div className="inline-flex items-center gap-1.5" title="Absent / Not checked in">
      <span className={`relative flex ${dotSizes[size] || 'w-3.5 h-3.5'}`}>
        <span className="relative inline-flex rounded-full h-full w-full bg-amber-400 ring-2 ring-amber-950"></span>
      </span>
      {showLabel && <span className="text-xs font-medium text-amber-400">Absent</span>}
    </div>
  );
};

export default StatusBadge;
