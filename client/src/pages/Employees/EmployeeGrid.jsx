import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import EmployeeModal from '../../components/EmployeeModal';
import { Plus, Search, Users, MapPin, Building, Mail, Sparkles, Filter } from 'lucide-react';

export const EmployeeGrid = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAll();
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.login_id && emp.login_id.toLowerCase().includes(search.toLowerCase())) ||
      (emp.job_position && emp.job_position.toLowerCase().includes(search.toLowerCase())) ||
      (emp.department && emp.department.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const handleCardClick = (empId) => {
    // Clicking any card opens that employee's profile in view-only mode (Admin can toggle into edit)
    navigate(`/employees/${empId}`);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Control Bar: NEW Button + Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
          
          {/* Left: NEW Button (Admin/HR only) */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <Plus size={16} />
                <span>NEW</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <Users size={16} className="text-purple-400" />
                <span>Directory</span>
              </div>
            )}

            {/* Department Filter Pills */}
            <div className="hidden lg:flex items-center gap-1.5 ml-2">
              <button
                onClick={() => setDepartmentFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  departmentFilter === 'all'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'text-gray-400 hover:text-white hover:bg-[#21262d]'
                }`}
              >
                All ({employees.length})
              </button>
              {departments.slice(0, 4).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    departmentFilter === dept
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : 'text-gray-400 hover:text-white hover:bg-[#21262d]'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Search Bar */}
          <div className="relative flex-1 sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, position or department..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-gray-400">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-300">Live Status Legend:</span>
            <div className="flex items-center gap-2">
              <span className="sr-only">Present:</span>
              <span>🟢 Present in office</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-bold">✈️</span>
              <span>Approved Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="sr-only">Absent:</span>
              <span>🟡 Absent</span>
            </div>
          </div>

          <span className="text-[11px] text-gray-500">
            Showing {filteredEmployees.length} of {employees.length} employees
          </span>
        </div>

        {/* 3-Cards Per Row Employee Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 animate-pulse h-48"></div>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-12 text-center">
            <Users size={40} className="mx-auto text-gray-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No employees found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search ? 'Try adjusting your search filters.' : 'Click NEW to register your first team member.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => handleCardClick(emp.id)}
                className="group relative bg-[#161b22] hover:bg-[#1b222c] border border-[#30363d] hover:border-purple-500/60 rounded-xl p-5 cursor-pointer transition-all duration-200 shadow-md hover:shadow-purple-500/10 hover:-translate-y-0.5"
              >
                {/* Top-Right Status Indicator Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <StatusBadge status={emp.statusIndicator} size="md" />
                </div>

                {/* Card Content */}
                <div className="flex items-start gap-4">
                  {/* Profile Picture */}
                  {emp.profile_picture ? (
                    <img
                      src={emp.profile_picture}
                      alt={emp.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#30363d] group-hover:border-purple-500 transition-colors flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-700 text-white font-bold text-lg flex items-center justify-center border-2 border-[#30363d] group-hover:border-purple-500 transition-colors flex-shrink-0">
                      {emp.first_name ? emp.first_name[0].toUpperCase() : 'E'}
                    </div>
                  )}

                  {/* Employee Details */}
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                      {emp.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5 font-medium">
                      {emp.job_position || 'Staff Member'}
                    </p>
                    <p className="text-[11px] text-purple-400/90 font-mono mt-1">
                      {emp.login_id}
                    </p>
                  </div>
                </div>

                {/* Bottom Meta */}
                <div className="mt-4 pt-3.5 border-t border-[#21262d] flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building size={13} className="text-gray-500 flex-shrink-0" />
                    <span className="truncate">{emp.department || 'General'}</span>
                  </div>

                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#21262d] text-gray-300 border border-[#30363d]">
                    {emp.location || 'Headquarters'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Admin Employee Creation Modal */}
      {isModalOpen && (
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchEmployees}
          managers={employees}
        />
      )}
    </div>
  );
};

export default EmployeeGrid;
