import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/api';
import { Plus, Search, Check, X, Calendar, FileText, Download, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

export const TimeOffAdminView = ({ onOpenNewModal, balances }) => {
  const [activeSubTab, setActiveSubTab] = useState('timeoff'); // 'timeoff' or 'allocation'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    requestId: null,
    action: 'approve', // 'approve' or 'reject'
    comment: ''
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getRequests({ search });
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search]);

  const handleOpenAction = (requestId, action) => {
    setCommentModal({
      isOpen: true,
      requestId,
      action,
      comment: action === 'approve' ? 'Approved' : 'Rejected'
    });
  };

  const handleConfirmAction = async () => {
    try {
      if (commentModal.action === 'approve') {
        await leaveService.approve(commentModal.requestId, { comment: commentModal.comment });
        confetti({ particleCount: 40, spread: 60 });
      } else {
        await leaveService.reject(commentModal.requestId, { comment: commentModal.comment });
      }
      setCommentModal({ isOpen: false, requestId: null, action: 'approve', comment: '' });
      fetchRequests();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-Tabs: Time Off | Allocation (Wireframe 6) */}
      <div className="flex items-center gap-2 border-b border-[#30363d] pb-px">
        <button
          onClick={() => setActiveSubTab('timeoff')}
          className={`px-5 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'timeoff'
              ? 'bg-[#5c2438]/60 text-rose-300 border-t-2 border-x border-[#30363d] border-t-rose-500 shadow'
              : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          Time Off
        </button>

        <button
          onClick={() => setActiveSubTab('allocation')}
          className={`px-5 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSubTab === 'allocation'
              ? 'bg-[#5c2438]/60 text-rose-300 border-t-2 border-x border-[#30363d] border-t-rose-500 shadow'
              : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          Allocation
        </button>
      </div>

      {/* Control Bar: NEW Button (Purple) + Searchbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
        <button
          onClick={onOpenNewModal}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 self-start"
        >
          <Plus size={16} />
          <span>NEW</span>
        </button>

        <div className="relative flex-1 sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or leave type..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Balance Summary Cards & Note Card (Wireframe 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Balance Cards (2 columns on lg) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-md flex flex-col justify-between">
            <h3 className="text-sm font-bold text-sky-400">
              Paid time Off
            </h3>
            <div className="mt-3">
              <span className="text-2xl font-black text-white font-mono">
                {balances?.paid_days_available || 24}
              </span>
              <span className="text-xs text-gray-400 ml-2">Days Available</span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-md flex flex-col justify-between">
            <h3 className="text-sm font-bold text-sky-400">
              Sick time off
            </h3>
            <div className="mt-3">
              <span className="text-2xl font-black text-white font-mono">
                {balances?.sick_days_available || 7}
              </span>
              <span className="text-xs text-gray-400 ml-2">Days Available</span>
            </div>
          </div>

        </div>

        {/* Note Card (Wireframe 6) */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-md flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-500"></div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
            Note
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            Employees can view only their own time off records, while Admins and HR Officers can view time off records & approve/reject them for all employees.
          </p>
        </div>

      </div>

      {/* Requests Table (Name | Start Date | End Date | Time off Type | Status | [Reject] [Approve]) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-3.5 bg-[#1b222c] border-b border-[#30363d] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Time Off Requests & Approvals
          </h3>
          <span className="text-xs text-purple-400 font-mono">
            {requests.length} Requests total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161b22] text-gray-400 uppercase tracking-wider border-b border-[#30363d]">
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Start Date</th>
                <th className="py-3 px-6">End Date</th>
                <th className="py-3 px-6">Time off Type</th>
                <th className="py-3 px-6">Attachment</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d] text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Loading time off requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No time off requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1b222c] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white flex items-center gap-3">
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
                    <td className="py-3.5 px-6 font-mono text-gray-300">{r.start_date}</td>
                    <td className="py-3.5 px-6 font-mono text-gray-300">{r.end_date}</td>
                    <td className="py-3.5 px-6 font-semibold text-sky-400">
                      {r.leave_type_name} ({r.days_count}d)
                    </td>
                    <td className="py-3.5 px-6">
                      {r.attachment_url ? (
                        <a
                          href={r.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 underline"
                        >
                          <FileText size={13} />
                          <span>View Doc</span>
                        </a>
                      ) : (
                        <span className="text-gray-500 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        r.status === 'validated'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : r.status === 'to_approve'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {r.status === 'validated' ? 'Validated' : r.status === 'to_approve' ? 'To Approve' : 'Refused'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {r.status === 'to_approve' ? (
                        /* Reject (red) & Approve (green) buttons matching Wireframe 6 */
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAction(r.id, 'reject')}
                            className="p-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm active:scale-95"
                            title="Reject Request"
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenAction(r.id, 'approve')}
                            className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-95"
                            title="Approve Request"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-mono">
                          {r.approver_comment || 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Approve/Reject Comment Modal */}
      {commentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#161b22] border border-[#30363d] w-full max-w-sm rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white capitalize">
              {commentModal.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Approver Comment / Remarks</label>
              <textarea
                rows={3}
                value={commentModal.comment}
                onChange={(e) => setCommentModal({ ...commentModal, comment: e.target.value })}
                className="input-field text-xs"
                placeholder="Optional notes for employee..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCommentModal({ isOpen: false, requestId: null, action: 'approve', comment: '' })}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`text-xs px-4 py-1.5 font-bold uppercase rounded text-white ${
                  commentModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {commentModal.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TimeOffAdminView;
