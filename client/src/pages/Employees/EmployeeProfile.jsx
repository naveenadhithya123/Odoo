import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { employeeService, authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import {
  User, Mail, Phone, Building, MapPin, Shield, Lock, Save, Edit3, Plus,
  Trash2, Award, CheckCircle2, AlertCircle, Sparkles, DollarSign, Calendar, ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const EmployeeProfile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('resume'); // 'resume', 'private', 'salary', 'security'
  const [isEditing, setIsEditing] = useState(searchParams.get('mode') === 'edit');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form states
  const [profileForm, setProfileForm] = useState({});
  const [salaryForm, setSalaryForm] = useState({
    monthly_wage: 50000,
    yearly_wage: 600000,
    working_days_per_week: 5,
    break_time_hours: 1,
    basic_pct: 50.00,
    hra_pct: 50.00,
    standard_allowance_pct: 16.67,
    performance_bonus_pct: 8.33,
    lta_pct: 8.33,
    pf_employee_pct: 12.00,
    pf_employer_pct: 12.00,
    professional_tax: 200.00
  });

  // Skills & Certifications modal / inputs
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await employeeService.getById(id);
      if (res.data.success) {
        const emp = res.data.data;
        setEmployee(emp);
        setProfileForm({
          first_name: emp.first_name || '',
          last_name: emp.last_name || '',
          job_position: emp.job_position || '',
          department: emp.department || '',
          location: emp.location || '',
          date_of_joining: emp.date_of_joining || '',
          mobile: emp.mobile || '',
          personal_email: emp.personal_email || emp.account_email || '',
          dob: emp.dob || '',
          gender: emp.gender || 'Male',
          marital_status: emp.marital_status || 'Single',
          nationality: emp.nationality || 'Indian',
          address: emp.address || '',
          resume_about: emp.resume_about || '',
          resume_love: emp.resume_love || '',
          resume_hobbies: emp.resume_hobbies || '',
          account_number: emp.bankDetails?.account_number || '',
          bank_name: emp.bankDetails?.bank_name || '',
          ifsc_code: emp.bankDetails?.ifsc_code || '',
          pan_no: emp.bankDetails?.pan_no || '',
          uan_no: emp.bankDetails?.uan_no || '',
          emp_code: emp.bankDetails?.emp_code || emp.login_id || ''
        });

        if (emp.salaryInfo) {
          setSalaryForm({
            monthly_wage: emp.salaryInfo.monthly_wage,
            yearly_wage: emp.salaryInfo.yearly_wage,
            working_days_per_week: emp.salaryInfo.working_days_per_week,
            break_time_hours: emp.salaryInfo.break_time_hours,
            basic_pct: emp.salaryInfo.basic_pct,
            hra_pct: emp.salaryInfo.hra_pct,
            standard_allowance_pct: emp.salaryInfo.standard_allowance_pct,
            performance_bonus_pct: emp.salaryInfo.performance_bonus_pct,
            lta_pct: emp.salaryInfo.lta_pct,
            pf_employee_pct: emp.salaryInfo.pf_employee_pct,
            pf_employer_pct: emp.salaryInfo.pf_employer_pct,
            professional_tax: emp.salaryInfo.professional_tax
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employee profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  // Real-time dynamic recalculation for Salary Components
  const calculateLiveSalary = (wage, form) => {
    const monthlyWage = Number(wage) || 0;
    const yearlyWage = Math.round(monthlyWage * 12 * 100) / 100;
    const basicPct = Number(form.basic_pct) || 50;
    const hraPct = Number(form.hra_pct) || 50;
    const standardPct = Number(form.standard_allowance_pct) || 16.67;
    const bonusPct = Number(form.performance_bonus_pct) || 8.33;
    const ltaPct = Number(form.lta_pct) || 8.33;
    const pfEmpPct = Number(form.pf_employee_pct) || 12;
    const pfEmprPct = Number(form.pf_employer_pct) || 12;
    const profTax = Number(form.professional_tax) || 200;

    const basicAmount = Math.round((monthlyWage * (basicPct / 100)) * 100) / 100;
    const hraAmount = Math.round((basicAmount * (hraPct / 100)) * 100) / 100;
    const standardAmount = Math.round((basicAmount * (standardPct / 100)) * 100) / 100;
    const bonusAmount = Math.round((basicAmount * (bonusPct / 100)) * 100) / 100;
    const ltaAmount = Math.round((basicAmount * (ltaPct / 100)) * 100) / 100;

    const subTotal = basicAmount + hraAmount + standardAmount + bonusAmount + ltaAmount;
    const fixedAllowanceAmount = Math.max(0, Math.round((monthlyWage - subTotal) * 100) / 100);
    const fixedAllowancePct = monthlyWage > 0 ? Math.round(((fixedAllowanceAmount / monthlyWage) * 100) * 100) / 100 : 0;

    const pfEmpAmount = Math.round((basicAmount * (pfEmpPct / 100)) * 100) / 100;
    const pfEmprAmount = Math.round((basicAmount * (pfEmprPct / 100)) * 100) / 100;
    const totalDeductions = Math.round((pfEmpAmount + profTax) * 100) / 100;
    const netSalary = Math.round((monthlyWage - totalDeductions) * 100) / 100;

    return {
      monthlyWage,
      yearlyWage,
      basicAmount,
      hraAmount,
      standardAmount,
      bonusAmount,
      ltaAmount,
      fixedAllowanceAmount,
      fixedAllowancePct,
      pfEmpAmount,
      pfEmprAmount,
      profTax,
      totalDeductions,
      netSalary
    };
  };

  const liveCalculated = calculateLiveSalary(salaryForm.monthly_wage, salaryForm);

  const handleProfileFormChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    if (name === 'monthly_wage') {
      const w = Number(value) || 0;
      setSalaryForm(prev => ({
        ...prev,
        monthly_wage: w,
        yearly_wage: w * 12
      }));
    } else if (name === 'yearly_wage') {
      const y = Number(value) || 0;
      setSalaryForm(prev => ({
        ...prev,
        yearly_wage: y,
        monthly_wage: Math.round(y / 12)
      }));
    } else {
      setSalaryForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await employeeService.update(id, profileForm);
      if (res.data.success) {
        setSuccessMessage('Profile saved successfully!');
        setIsEditing(false);
        fetchEmployeeData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSalary = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await employeeService.updateSalary(id, salaryForm);
      if (res.data.success) {
        setSuccessMessage('Salary structure updated!');
        fetchEmployeeData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update salary structure.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    try {
      await employeeService.addSkill(id, { name: newSkill.trim() });
      setNewSkill('');
      fetchEmployeeData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await employeeService.deleteSkill(skillId);
      fetchEmployeeData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCert = async () => {
    if (!newCert.trim()) return;
    try {
      await employeeService.addCertification(id, { name: newCert.trim() });
      setNewCert('');
      fetchEmployeeData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCert = async (certId) => {
    try {
      await employeeService.deleteCertification(certId);
      fetchEmployeeData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      setPasswordError(null);
      setPasswordSuccess(null);
      const res = await authService.changePassword(passwordForm);
      if (res.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-400">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-8">
        <div className="max-w-xl mx-auto bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-4">
          <AlertCircle size={40} className="text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Employee Record Unavailable</h2>
          <p className="text-xs text-gray-400">{error || 'Could not find the requested employee profile.'}</p>
          <button onClick={() => navigate('/employees')} className="btn-secondary text-xs">
            Return to Employees
          </button>
        </div>
      </div>
    );
  }

  const isSelf = employee.permissions?.isSelf;
  const canEdit = employee.permissions?.canEditAll || (isSelf && employee.permissions?.canEditLimited);
  const showSalaryTab = employee.permissions?.canViewSalary || isAdmin;

  return (
    <div className="min-h-screen bg-[#0d1117] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Back Link & Edit Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/employees')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Employees</span>
          </button>

          {canEdit && (
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchEmployeeData();
                    }}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-purple-300 border border-[#30363d] transition-all"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notification Toast */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 3.1 HEADER SECTION (Wireframe 3 & 4) */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            {/* Avatar Circle */}
            <div className="relative flex-shrink-0">
              {employee.profile_picture ? (
                <img
                  src={employee.profile_picture}
                  alt={employee.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-purple-500/50 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-900 via-purple-900 to-indigo-900 text-white font-black text-3xl flex items-center justify-center border-2 border-purple-500/40 shadow-lg">
                  {employee.first_name ? employee.first_name[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="absolute bottom-0 right-0">
                <StatusBadge status={employee.statusIndicator} size="md" />
              </div>
            </div>

            {/* Header Information Grid */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#30363d] pb-3">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <span>{employee.name}</span>
                    <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                      {employee.login_id}
                    </span>
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {employee.job_position} • {employee.department}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#21262d] text-gray-300 border border-[#30363d]">
                    {employee.company_name || 'Zooz'}
                  </span>
                </div>
              </div>

              {/* 2 Columns Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-semibold">Login ID</span>
                  <span className="text-white font-mono font-bold">{employee.login_id}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-semibold">Work Email</span>
                  <span className="text-white truncate block">{employee.account_email || employee.personal_email}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-semibold">Mobile</span>
                  <span className="text-white">{employee.mobile || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase text-[10px] font-semibold">Location</span>
                  <span className="text-white">{employee.location || 'Headquarters'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3.2 TABS NAVIGATION (Resume | Private Info | Salary Info | Security) */}
        <div className="flex items-center gap-2 border-b border-[#30363d] overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all ${
              activeTab === 'resume'
                ? 'bg-[#161b22] text-white border-t-2 border-x border-[#30363d] border-t-purple-500 shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#161b22]/50'
            }`}
          >
            Resume
          </button>

          <button
            onClick={() => setActiveTab('private')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all ${
              activeTab === 'private'
                ? 'bg-[#161b22] text-white border-t-2 border-x border-[#30363d] border-t-purple-500 shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#161b22]/50'
            }`}
          >
            Private Info
          </button>

          {showSalaryTab && (
            <button
              onClick={() => setActiveTab('salary')}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all ${
                activeTab === 'salary'
                  ? 'bg-[#161b22] text-white border-t-2 border-x border-[#30363d] border-t-purple-500 shadow'
                  : 'text-gray-400 hover:text-white hover:bg-[#161b22]/50'
              }`}
            >
              Salary Info (Admin)
            </button>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all ${
              activeTab === 'security'
                ? 'bg-[#161b22] text-white border-t-2 border-x border-[#30363d] border-t-purple-500 shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#161b22]/50'
            }`}
          >
            Security
          </button>
        </div>

        {/* TAB 1: RESUME TAB (Wireframe 3) */}
        {activeTab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
            
            {/* Left Column: About, What I love, Interests */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-6 shadow-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                  About
                </label>
                {isEditing ? (
                  <textarea
                    name="resume_about"
                    rows={4}
                    value={profileForm.resume_about}
                    onChange={handleProfileFormChange}
                    className="input-field leading-relaxed text-xs"
                    placeholder="Brief background and career summary..."
                  />
                ) : (
                  <p className="text-xs text-gray-300 leading-relaxed bg-[#0d1117]/60 p-4 rounded-xl border border-[#21262d]">
                    {employee.resume_about || 'No about info provided yet.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                  What I love about my job
                </label>
                {isEditing ? (
                  <textarea
                    name="resume_love"
                    rows={3}
                    value={profileForm.resume_love}
                    onChange={handleProfileFormChange}
                    className="input-field leading-relaxed text-xs"
                    placeholder="What inspires you at work..."
                  />
                ) : (
                  <p className="text-xs text-gray-300 leading-relaxed bg-[#0d1117]/60 p-4 rounded-xl border border-[#21262d]">
                    {employee.resume_love || 'No notes provided yet.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                  My interests and hobbies
                </label>
                {isEditing ? (
                  <textarea
                    name="resume_hobbies"
                    rows={3}
                    value={profileForm.resume_hobbies}
                    onChange={handleProfileFormChange}
                    className="input-field leading-relaxed text-xs"
                    placeholder="Personal passions and hobbies..."
                  />
                ) : (
                  <p className="text-xs text-gray-300 leading-relaxed bg-[#0d1117]/60 p-4 rounded-xl border border-[#21262d]">
                    {employee.resume_hobbies || 'No hobbies listed yet.'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Skills & Certification */}
            <div className="space-y-6">
              
              {/* Skills Card */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" />
                    <span>Skills</span>
                  </h3>
                  <span className="text-[10px] text-gray-500">{employee.skills?.length || 0} skills</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {employee.skills?.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#21262d] text-gray-200 text-xs border border-[#30363d] group hover:border-purple-500 transition-colors"
                    >
                      <span>{s.name}</span>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteSkill(s.id)}
                          className="text-gray-500 hover:text-rose-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add new skill..."
                      className="input-field text-xs py-1.5"
                    />
                    <button
                      onClick={handleAddSkill}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0"
                    >
                      <Plus size={14} />
                      <span>Add Skills</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Certifications Card */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Award size={16} className="text-purple-400" />
                    <span>Certification</span>
                  </h3>
                  <span className="text-[10px] text-gray-500">{employee.certifications?.length || 0} certs</span>
                </div>

                <div className="space-y-2">
                  {employee.certifications?.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#21262d] text-gray-200 text-xs border border-[#30363d]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Award size={14} className="text-amber-400 flex-shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteCert(c.id)}
                          className="text-gray-500 hover:text-rose-400 ml-2"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={newCert}
                      onChange={(e) => setNewCert(e.target.value)}
                      placeholder="Add new certification..."
                      className="input-field text-xs py-1.5"
                    />
                    <button
                      onClick={handleAddCert}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0"
                    >
                      <Plus size={14} />
                      <span>Add Cert</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PRIVATE INFO TAB (Wireframe 4) */}
        {activeTab === 'private' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
            
            {/* Left Column: Personal Information */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 border-b border-[#30363d] pb-2">
                Personal Information
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Date of Birth</label>
                  {isEditing && employee.permissions?.canEditAll ? (
                    <input
                      type="date"
                      name="dob"
                      value={profileForm.dob}
                      onChange={handleProfileFormChange}
                      className="input-field text-xs"
                    />
                  ) : (
                    <span className="text-white font-medium">{employee.dob || '—'}</span>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Residing Address</label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      rows={2}
                      value={profileForm.address}
                      onChange={handleProfileFormChange}
                      className="input-field text-xs"
                    />
                  ) : (
                    <span className="text-white font-medium">{employee.address || '—'}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1">Nationality</label>
                    <span className="text-white font-medium">{employee.nationality || 'Indian'}</span>
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Personal Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="personal_email"
                        value={profileForm.personal_email}
                        onChange={handleProfileFormChange}
                        className="input-field text-xs"
                      />
                    ) : (
                      <span className="text-white font-medium">{employee.personal_email || '—'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1">Gender</label>
                    {isEditing && employee.permissions?.canEditAll ? (
                      <select
                        name="gender"
                        value={profileForm.gender}
                        onChange={handleProfileFormChange}
                        className="input-field text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <span className="text-white font-medium">{employee.gender || '—'}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Marital Status</label>
                    {isEditing && employee.permissions?.canEditAll ? (
                      <select
                        name="marital_status"
                        value={profileForm.marital_status}
                        onChange={handleProfileFormChange}
                        className="input-field text-xs"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    ) : (
                      <span className="text-white font-medium">{employee.marital_status || 'Single'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Date of Joining</label>
                  <span className="text-white font-medium">{employee.date_of_joining}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Bank Details */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 border-b border-[#30363d] pb-2">
                Bank Details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Account Number</label>
                  {isEditing && employee.permissions?.canEditAll ? (
                    <input
                      type="text"
                      name="account_number"
                      value={profileForm.account_number}
                      onChange={handleProfileFormChange}
                      className="input-field text-xs font-mono"
                    />
                  ) : (
                    <span className="text-white font-mono font-medium">{employee.bankDetails?.account_number || '—'}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1">Bank Name</label>
                    {isEditing && employee.permissions?.canEditAll ? (
                      <input
                        type="text"
                        name="bank_name"
                        value={profileForm.bank_name}
                        onChange={handleProfileFormChange}
                        className="input-field text-xs"
                      />
                    ) : (
                      <span className="text-white font-medium">{employee.bankDetails?.bank_name || '—'}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">IFSC Code</label>
                    {isEditing && employee.permissions?.canEditAll ? (
                      <input
                        type="text"
                        name="ifsc_code"
                        value={profileForm.ifsc_code}
                        onChange={handleProfileFormChange}
                        className="input-field text-xs font-mono"
                      />
                    ) : (
                      <span className="text-white font-mono font-medium">{employee.bankDetails?.ifsc_code || '—'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 block mb-1">PAN No</label>
                    {isEditing && employee.permissions?.canEditAll ? (
                      <input
                        type="text"
                        name="pan_no"
                        value={profileForm.pan_no}
                        onChange={handleProfileFormChange}
                        className="input-field text-xs font-mono"
                      />
                    ) : (
                      <span className="text-white font-mono font-medium">{employee.bankDetails?.pan_no || '—'}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">UAN NO</label>
                    {isEditing && employee.permissions?.canEditAll ? (
                      <input
                        type="text"
                        name="uan_no"
                        value={profileForm.uan_no}
                        onChange={handleProfileFormChange}
                        className="input-field text-xs font-mono"
                      />
                    ) : (
                      <span className="text-white font-mono font-medium">{employee.bankDetails?.uan_no || '—'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Emp Code</label>
                  <span className="text-white font-mono font-medium">{employee.bankDetails?.emp_code || employee.login_id}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SALARY INFO TAB (Admin Only — Wireframe 3) */}
        {activeTab === 'salary' && showSalaryTab && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-6">
              
              {/* Header Wage inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
                    Month Wage (₹ / Month)
                  </label>
                  {isAdmin ? (
                    <input
                      type="number"
                      name="monthly_wage"
                      value={salaryForm.monthly_wage}
                      onChange={handleSalaryChange}
                      className="input-field text-sm font-bold text-emerald-400"
                    />
                  ) : (
                    <span className="text-base font-bold text-emerald-400">
                      ₹{Number(salaryForm.monthly_wage).toLocaleString('en-IN')} / Month
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
                    Yearly Wage (₹ / Yearly)
                  </label>
                  {isAdmin ? (
                    <input
                      type="number"
                      name="yearly_wage"
                      value={salaryForm.yearly_wage}
                      onChange={handleSalaryChange}
                      className="input-field text-sm font-bold text-emerald-400"
                    />
                  ) : (
                    <span className="text-base font-bold text-emerald-400">
                      ₹{Number(salaryForm.yearly_wage).toLocaleString('en-IN')} / Yearly
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
                    Working days / week
                  </label>
                  {isAdmin ? (
                    <input
                      type="number"
                      name="working_days_per_week"
                      value={salaryForm.working_days_per_week}
                      onChange={handleSalaryChange}
                      className="input-field text-sm"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">{salaryForm.working_days_per_week} Days</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
                    Break Time (/hrs)
                  </label>
                  {isAdmin ? (
                    <input
                      type="number"
                      step="0.5"
                      name="break_time_hours"
                      value={salaryForm.break_time_hours}
                      onChange={handleSalaryChange}
                      className="input-field text-sm"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white">{salaryForm.break_time_hours} hrs</span>
                  )}
                </div>
              </div>

              {/* Salary Components Table (Matching Wireframe 3 exactly) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Salary Components (Auto-Calculated)
                </h3>

                <div className="overflow-x-auto border border-[#30363d] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#21262d] text-gray-300 uppercase tracking-wider border-b border-[#30363d]">
                        <th className="py-3 px-4">Component</th>
                        <th className="py-3 px-4 text-right">Computed ₹ / month</th>
                        <th className="py-3 px-4 text-right">% of Base</th>
                        <th className="py-3 px-4">Notes / Logic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d] text-gray-300">
                      
                      {/* Basic Salary */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Basic Salary</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ₹{liveCalculated.basicAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400">
                          {isAdmin ? (
                            <input
                              type="number"
                              step="0.1"
                              name="basic_pct"
                              value={salaryForm.basic_pct}
                              onChange={handleSalaryChange}
                              className="w-16 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-mono text-xs text-purple-400"
                            />
                          ) : `${salaryForm.basic_pct}%`} %
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-400">
                          Define Basic salary from company cost compute it based on monthly Wages
                        </td>
                      </tr>

                      {/* House Rent Allowance (HRA) */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">House Rent Allowance (HRA)</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">
                          ₹{liveCalculated.hraAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400">
                          {isAdmin ? (
                            <input
                              type="number"
                              step="0.1"
                              name="hra_pct"
                              value={salaryForm.hra_pct}
                              onChange={handleSalaryChange}
                              className="w-16 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-mono text-xs text-purple-400"
                            />
                          ) : `${salaryForm.hra_pct}%`} %
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-400">
                          HRA provided to employees 50% of the basic salary
                        </td>
                      </tr>

                      {/* Standard Allowance */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Standard Allowance</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">
                          ₹{liveCalculated.standardAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400">
                          {isAdmin ? (
                            <input
                              type="number"
                              step="0.01"
                              name="standard_allowance_pct"
                              value={salaryForm.standard_allowance_pct}
                              onChange={handleSalaryChange}
                              className="w-16 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-mono text-xs text-purple-400"
                            />
                          ) : `${salaryForm.standard_allowance_pct}%`} %
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-400">
                          A standard allowance is a predetermined, fixed amount provided to employee
                        </td>
                      </tr>

                      {/* Performance Bonus */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Performance Bonus</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">
                          ₹{liveCalculated.bonusAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400">
                          {isAdmin ? (
                            <input
                              type="number"
                              step="0.01"
                              name="performance_bonus_pct"
                              value={salaryForm.performance_bonus_pct}
                              onChange={handleSalaryChange}
                              className="w-16 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-mono text-xs text-purple-400"
                            />
                          ) : `${salaryForm.performance_bonus_pct}%`} %
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-400">
                          Variable amount calculated as a % of the basic salary
                        </td>
                      </tr>

                      {/* Leave Travel Allowance */}
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Leave Travel Allowance (LTA)</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">
                          ₹{liveCalculated.ltaAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-purple-400">
                          {isAdmin ? (
                            <input
                              type="number"
                              step="0.01"
                              name="lta_pct"
                              value={salaryForm.lta_pct}
                              onChange={handleSalaryChange}
                              className="w-16 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5 text-right font-mono text-xs text-purple-400"
                            />
                          ) : `${salaryForm.lta_pct}%`} %
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-400">
                          LTA is paid to cover travel expenses (% of basic salary)
                        </td>
                      </tr>

                      {/* Fixed Allowance Remainder */}
                      <tr className="bg-[#1b222c]">
                        <td className="py-3 px-4 font-bold text-white">Fixed Allowance</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ₹{liveCalculated.fixedAllowanceAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-400">
                          {liveCalculated.fixedAllowancePct}% of Wage
                        </td>
                        <td className="py-3 px-4 text-[11px] text-purple-400">
                          Remainder = Wage − sum of all other components
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* Provident Fund (PF) & Tax Deductions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* PF Contribution */}
                <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Provident Fund (PF) Contribution
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-[#161b22]">
                      <span className="text-gray-300">Employee Contribution (12% Basic):</span>
                      <span className="font-mono font-bold text-white">₹{liveCalculated.pfEmpAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#161b22]">
                      <span className="text-gray-300">Employer Contribution (12% Basic):</span>
                      <span className="font-mono font-bold text-white">₹{liveCalculated.pfEmprAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Deductions */}
                <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Tax Deductions
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-[#161b22]">
                      <span className="text-gray-300">Professional Tax (/month):</span>
                      <span className="font-mono font-bold text-rose-400">₹{liveCalculated.profTax.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[#161b22] border border-emerald-900/50">
                      <span className="font-bold text-white">Net Take-Home Pay (/month):</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">₹{liveCalculated.netSalary.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Save Salary Structure Button for Admin */}
              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveSalary}
                    disabled={saving}
                    className="btn-primary text-xs px-5 py-2 flex items-center gap-2 font-semibold"
                  >
                    <Save size={14} />
                    <span>{saving ? 'Updating...' : 'Save Salary Structure'}</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 4: SECURITY TAB (Section 3.4) */}
        {activeTab === 'security' && (
          <div className="max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-sm font-bold text-white">Change Password</h3>
              <p className="text-xs text-gray-400 mt-0.5">Ensure your account uses a strong password.</p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
                  Old Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-xs"
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="btn-primary text-xs px-5 py-2 font-semibold">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmployeeProfile;
