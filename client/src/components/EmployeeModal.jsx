import React, { useState, useEffect } from 'react';
import { employeeService } from '../services/api';
import { X, UserPlus, Sparkles, CheckCircle2, Copy, Check, Lock, Building, Mail, Phone, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export const EmployeeModal = ({ isOpen, onClose, onSuccess, managers = [] }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    job_position: 'Software Engineer',
    department: 'Engineering',
    manager_id: '',
    location: 'Gandhinagar Tech Park',
    date_of_joining: new Date().toISOString().split('T')[0],
    monthly_wage: 50000,
    account_number: '',
    bank_name: 'HDFC Bank',
    ifsc_code: 'HDFC0001234',
    pan_no: '',
    uan_no: '',
    emp_code: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Real-time preview of Login ID format: [OI][First 2 of First + First 2 of Last][Year][Serial]
  const previewId = () => {
    const f2 = (formData.first_name.trim().replace(/[^a-zA-Z]/g, '') + 'XX').slice(0, 2).toUpperCase();
    const l2 = (formData.last_name.trim().replace(/[^a-zA-Z]/g, '') + 'XX').slice(0, 2).toUpperCase();
    const year = new Date(formData.date_of_joining || new Date()).getFullYear();
    return `OI${f2}${l2}${year}000X`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await employeeService.create(formData);
      if (res.data.success) {
        setCreatedEmployee(res.data.employee);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 } });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#1b222c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Employee Record</h2>
              <p className="text-xs text-gray-400">System auto-generates Login ID & Temporary Password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {createdEmployee ? (
            /* Success State with Credentials */
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Employee Provisioned Successfully!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Share these auto-generated credentials with <strong>{createdEmployee.name}</strong>.
                </p>
              </div>

              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-left max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-[#161b22] rounded-lg border border-[#30363d]">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Generated Login ID</span>
                    <span className="text-sm font-mono font-bold text-purple-400">{createdEmployee.login_id}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdEmployee.login_id, 'id')}
                    className="p-1.5 rounded text-gray-400 hover:text-white bg-[#21262d] hover:bg-[#30363d]"
                    title="Copy Login ID"
                  >
                    {copiedId ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#161b22] rounded-lg border border-[#30363d]">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Temporary Password</span>
                    <span className="text-sm font-mono font-bold text-amber-400">{createdEmployee.temp_password}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdEmployee.temp_password, 'pass')}
                    className="p-1.5 rounded text-gray-400 hover:text-white bg-[#21262d] hover:bg-[#30363d]"
                    title="Copy Password"
                  >
                    {copiedPass ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button onClick={onClose} className="btn-primary px-6 py-2 text-sm font-semibold">
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Real-time Login ID Preview */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  <span className="text-xs text-gray-300">Auto-Generated ID Preview:</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800/60">
                  {previewId()}
                </span>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="e.g. John"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="e.g. Doe"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Email & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@company.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Department & Job Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Job Position
                  </label>
                  <input
                    type="text"
                    name="job_position"
                    value={formData.job_position}
                    onChange={handleChange}
                    placeholder="e.g. Lead Software Engineer"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Date of Joining & Monthly Wage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    name="date_of_joining"
                    value={formData.date_of_joining}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Monthly Wage (₹ / Month)
                  </label>
                  <input
                    type="number"
                    name="monthly_wage"
                    value={formData.monthly_wage}
                    onChange={handleChange}
                    placeholder="50000"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Location & Manager */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Headquarters"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Reporting Manager
                  </label>
                  <select
                    name="manager_id"
                    value={formData.manager_id}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">None (Top Level)</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.department})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary px-4 py-2 text-xs font-medium"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-5 py-2 text-xs font-semibold tracking-wide disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;
