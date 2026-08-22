import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SystrayWidget from './SystrayWidget';
import NotificationModal from './NotificationModal';
import { Bell, User, LogOut, ShieldCheck, ChevronDown, Layers, Clock, CalendarDays, DollarSign, BarChart3 } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin, unreadCount, setUnreadCount } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMyProfile = () => {
    setProfileDropdownOpen(false);
    if (user?.employee_id) {
      navigate(`/employees/${user.employee_id}?mode=edit`);
    }
  };

  const navTabs = [
    { name: 'Employees', path: '/employees', icon: Layers },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Time Off', path: '/timeoff', icon: CalendarDays },
  ];

  if (isAdmin) {
    navTabs.push({ name: 'Payroll', path: '/payroll', icon: DollarSign });
    navTabs.push({ name: 'Reports', path: '/reports', icon: BarChart3 });
  }

  return (
    <header className="sticky top-0 z-40 bg-[#161b22] border-b border-[#30363d] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Company Logo & Main Navigation Tabs */}
          <div className="flex items-center gap-8">
            <div 
              onClick={() => navigate('/employees')} 
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
                {user?.company_code || 'DF'}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-purple-400 transition-colors">
                  {user?.company_name || 'Dayflow HRMS'}
                </span>
                <span className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">
                  HRMS Portal
                </span>
              </div>
            </div>

            {/* Top Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {navTabs.map((tab) => {
                const isActive = location.pathname.startsWith(tab.path);
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.name}
                    to={tab.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#1f293d] text-white border-b-2 border-purple-500 shadow-inner'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#21262d]'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-purple-400' : 'text-gray-500'} />
                    <span>{tab.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right: Systray Widget + Notifications + User Avatar Dropdown */}
          <div className="flex items-center gap-4">
            
            {/* Systray Check In / Check Out */}
            <div className="hidden sm:block">
              <SystrayWidget />
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors focus:outline-none"
                title="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <NotificationModal 
                  onClose={() => setNotificationOpen(false)} 
                  onCountUpdate={(newCount) => setUnreadCount(newCount)}
                />
              )}
            </div>

            {/* User Profile Avatar with dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:ring-2 hover:ring-purple-500/50 transition-all focus:outline-none"
              >
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.first_name}
                    className="w-8 h-8 rounded-full object-cover border border-[#30363d]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#161b22] border border-[#30363d] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-[#30363d]">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-purple-400 font-mono mt-0.5">
                      {user?.login_id}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800/60 uppercase tracking-wider">
                        {user?.role}
                      </span>
                      <span className="text-xs text-gray-400 truncate">
                        {user?.department || 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={handleMyProfile}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#21262d] hover:text-white transition-colors text-left"
                    >
                      <User size={16} className="text-purple-400" />
                      <span>My Profile</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/reports');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#21262d] hover:text-white transition-colors text-left"
                      >
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span>Admin Console</span>
                      </button>
                    )}

                    <div className="border-t border-[#30363d] my-1"></div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
