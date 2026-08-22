import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AttendanceAdminView from './AttendanceAdminView';
import AttendanceEmployeeView from './AttendanceEmployeeView';
import { Users, User, Clock } from 'lucide-react';

export const AttendancePage = () => {
  const { isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState(isAdmin ? 'admin' : 'employee');

  return (
    <div className="min-h-screen bg-[#0d1117] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Title & Admin View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Clock size={22} className="text-purple-400" />
              <span>Attendance Module</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Track real-time shift logs, work hours, overtime, and monthly payable days.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center rounded-lg bg-[#161b22] border border-[#30363d] p-1 shadow-sm self-start">
              <button
                onClick={() => setViewMode('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'admin'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>All Employees (Day View)</span>
              </button>
              <button
                onClick={() => setViewMode('employee')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'employee'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User size={14} />
                <span>My Attendance (Monthly)</span>
              </button>
            </div>
          )}
        </div>

        {/* Render View */}
        {viewMode === 'admin' && isAdmin ? (
          <AttendanceAdminView />
        ) : (
          <AttendanceEmployeeView />
        )}

      </div>
    </div>
  );
};

export default AttendancePage;
