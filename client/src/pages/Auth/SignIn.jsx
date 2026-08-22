import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const SignIn = () => {
  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdOrEmail.trim() || !password) {
      setError('Please provide both Login ID / Email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(loginIdOrEmail.trim(), password);
      navigate('/employees');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userType) => {
    if (userType === 'admin') {
      setLoginIdOrEmail('ZOADMI20220001');
      setPassword('admin123');
    } else if (userType === 'employee') {
      setLoginIdOrEmail('ZOJODO20220001');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-1 ring-purple-400/30">
            DF
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dayflow</h1>
            <p className="text-xs text-gray-400">"Every workday, perfectly aligned."</p>
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-white">
          Sign in to your HRMS Portal
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-[#161b22] py-8 px-6 sm:px-10 border border-[#30363d] rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Login ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={loginIdOrEmail}
                  onChange={(e) => setLoginIdOrEmail(e.target.value)}
                  placeholder="e.g. ZOJODO20220001 or name@company.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Signing In...' : 'SIGN IN'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#30363d]">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-purple-400" />
              <span>Demo Quick Fill:</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="px-2.5 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-purple-300 border border-[#30363d] rounded-md transition-all text-left truncate"
              >
                Admin (ZOADMI)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('employee')}
                className="px-2.5 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-sky-300 border border-[#30363d] rounded-md transition-all text-left truncate"
              >
                Employee (ZOJODO)
              </button>
            </div>
          </div>

          {/* Initial Company Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Setting up a new organization?{' '}
              <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2">
                Sign Up Company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
