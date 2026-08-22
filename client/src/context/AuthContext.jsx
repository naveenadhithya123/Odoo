import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, notificationService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dayflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dayflow_token'));
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUser = async () => {
    try {
      if (token) {
        const res = await authService.getMe();
        if (res.data.success) {
          setUser(res.data.user);
          setUnreadCount(res.data.unread_notifications || 0);
          localStorage.setItem('dayflow_user', JSON.stringify(res.data.user));
        }
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (loginIdOrEmail, password) => {
    const res = await authService.signIn({ loginIdOrEmail, password });
    if (res.data.success) {
      localStorage.setItem('dayflow_token', res.data.token);
      localStorage.setItem('dayflow_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const registerCompany = async (formData) => {
    const res = await authService.signUpCompany(formData);
    if (res.data.success) {
      localStorage.setItem('dayflow_token', res.data.token);
      localStorage.setItem('dayflow_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    setToken(null);
    setUser(null);
    window.location.href = '/signin';
  };

  const refreshUser = () => {
    return fetchUser();
  };

  const isAdmin = user && (user.role === 'admin' || user.role === 'hr');

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      isAdmin,
      unreadCount,
      setUnreadCount,
      login,
      registerCompany,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
