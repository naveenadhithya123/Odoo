import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../services/api';
import TimeOffAdminView from './TimeOffAdminView';
import TimeOffEmployeeView from './TimeOffEmployeeView';
import LeaveRequestModal from './LeaveRequestModal';
import { CalendarDays, Users, User } from 'lucide-react';

export const TimeOffPage = () => {
  const { user, isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState(isAdmin ? 'admin' : 'employee');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [balances, setBalances] = useState({ paid_days_available: 24, sick_days_available: 7 });
  const [leaveTypes, setLeaveTypes] = useState([]);

  const fetchBalancesAndTypes = async () => {
    try {
      const res = await leaveService.getBalances(user?.employee_id);
      if (res.data.success) {
        setBalances(res.data.summary);
        setLeaveTypes(res.data.balances.map(b => ({
          id: b.leave_type_id,
          name: b.leave_type_name,
          is_paid: b.is_paid,
          requires_attachment: b.requires_attachment
        })));
      }
    } catch (err) {
      console.error('Failed to load leave balances:', err);
    }
  };

  useEffect(() => {
    if (user?.employee_id) {
      fetchBalancesAndTypes();
    }
  }, [user?.employee_id]);

  return (
    <div className="min-h-screen bg-[#0d1117] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Title & Admin Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <CalendarDays size={22} className="text-purple-400" />
              <span>Time Off (Leave) Module</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage paid time off, sick leaves, approval workflows, and holiday calendar.
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
                <span>Approvals & Overview</span>
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
                <span>My Calendar & Leaves</span>
              </button>
            </div>
          )}
        </div>

        {/* Render View */}
        {viewMode === 'admin' && isAdmin ? (
          <TimeOffAdminView
            onOpenNewModal={() => setIsRequestModalOpen(true)}
            balances={balances}
          />
        ) : (
          <TimeOffEmployeeView
            onOpenNewModal={() => setIsRequestModalOpen(true)}
            balances={balances}
            leaveTypes={leaveTypes}
          />
        )}

      </div>

      {/* Time Off Type Request Modal */}
      {isRequestModalOpen && (
        <LeaveRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={fetchBalancesAndTypes}
          leaveTypes={leaveTypes}
        />
      )}
    </div>
  );
};

export default TimeOffPage;
