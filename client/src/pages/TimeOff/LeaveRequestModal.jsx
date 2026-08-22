import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LeaveRequestModal = ({ isOpen, onClose, onSuccess, leaveTypes = [] }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    days_count: 1.0,
    reason: '',
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set default leave type
  useEffect(() => {
    if (leaveTypes.length > 0 && !formData.leave_type_id) {
      setFormData(prev => ({ ...prev, leave_type_id: leaveTypes[0].id }));
    }
  }, [leaveTypes]);

  // Auto calculate days count when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const s = new Date(formData.start_date);
      const e = new Date(formData.end_date);
      if (e >= s) {
        const diffTime = Math.abs(e - s);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, days_count: days }));
      }
    }
  }, [formData.start_date, formData.end_date]);

  const selectedType = leaveTypes.find(t => t.id === formData.leave_type_id);
  const requiresAttachment = selectedType?.requires_attachment || selectedType?.name?.toLowerCase().includes('sick');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requiresAttachment && !attachmentFile) {
      setError('Medical certificate / attachment is required for Sick Leave.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = new FormData();
      data.append('leave_type_id', formData.leave_type_id);
      data.append('start_date', formData.start_date);
      data.append('end_date', formData.end_date);
      data.append('days_count', formData.days_count);
      data.append('reason', formData.reason || 'Time off request');
      if (attachmentFile) {
        data.append('attachment', attachmentFile);
      }

      const res = await leaveService.submitRequest(data);
      if (res.data.success) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit time off request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header matching Wireframe 7 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#1b222c]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Time off Type Request
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body matching Wireframe 7 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Employee (Pre-filled, read-only) */}
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-400 font-semibold uppercase text-[11px]">Employee</span>
            <span className="font-bold text-sky-400 text-sm">
              [{user?.first_name} {user?.last_name}]
            </span>
          </div>

          {/* Time Off Type Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-gray-400 font-semibold uppercase text-[11px]">
              Time off Type
            </label>
            <select
              value={formData.leave_type_id}
              onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
              className="input-field text-xs text-sky-400 font-semibold"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id} className="text-white">
                  [{t.name}] {t.is_paid ? '(Paid)' : '(Unpaid)'}
                </option>
              ))}
            </select>
          </div>

          {/* Validity Period: Date Range */}
          <div className="space-y-1.5">
            <label className="block text-gray-400 font-semibold uppercase text-[11px]">
              Validity Period
            </label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-[10px] text-gray-500 block mb-1">From Date</span>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field text-xs text-sky-400"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block mb-1">To Date</span>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field text-xs text-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Allocation (Days) */}
          <div className="flex items-center justify-between py-2 border-y border-[#21262d]">
            <span className="text-gray-400 font-semibold uppercase text-[11px]">Allocation</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.days_count}
                onChange={(e) => setFormData({ ...formData, days_count: e.target.value })}
                className="w-20 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-right font-mono font-bold text-sky-400 text-xs"
              />
              <span className="text-gray-300 font-semibold">Days</span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-gray-400 font-semibold uppercase text-[11px]">
              Reason / Remarks
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Medical appointment, family event..."
              className="input-field text-xs"
            />
          </div>

          {/* Attachment Upload (Required for Sick Leave) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-gray-400 font-semibold uppercase text-[11px]">
                Attachment
              </label>
              {requiresAttachment && (
                <span className="text-[10px] text-amber-400 font-medium">
                  (Required for sick leave certificate)
                </span>
              )}
            </div>
            <label className={`flex items-center justify-center gap-2 p-3 border border-dashed rounded-xl cursor-pointer transition-colors ${
              requiresAttachment && !attachmentFile
                ? 'border-amber-500/50 bg-amber-950/20 text-amber-300'
                : 'border-[#30363d] hover:border-purple-500 text-gray-400 hover:text-white bg-[#0d1117]'
            }`}>
              <Upload size={15} />
              <span className="truncate">
                {attachmentFile ? attachmentFile.name : 'Upload Medical Slip / Document'}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={(e) => setAttachmentFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          {/* Footer Buttons matching Wireframe 7 */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#30363d]">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-2 text-xs font-semibold uppercase tracking-wider"
            >
              Discard
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LeaveRequestModal;
