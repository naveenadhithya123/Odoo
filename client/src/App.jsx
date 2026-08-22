import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
import EmployeeGrid from './pages/Employees/EmployeeGrid';
import EmployeeProfile from './pages/Employees/EmployeeProfile';
import AttendancePage from './pages/Attendance/AttendancePage';
import TimeOffPage from './pages/TimeOff/TimeOffPage';
import PayrollView from './pages/Payroll/PayrollView';
import ReportsAnalytics from './pages/Reports/ReportsAnalytics';

// Protected Route Wrapper
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col selection:bg-purple-600 selection:text-white">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

// Admin Only Route Wrapper
const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/employees" replace />;
  return children;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Navigate to="/employees" replace />
              </ProtectedLayout>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedLayout>
                <EmployeeGrid />
              </ProtectedLayout>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedLayout>
                <EmployeeProfile />
              </ProtectedLayout>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedLayout>
                <AttendancePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/timeoff"
            element={
              <ProtectedLayout>
                <TimeOffPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedLayout>
                <PayrollView />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedLayout>
                <AdminRoute>
                  <ReportsAnalytics />
                </AdminRoute>
              </ProtectedLayout>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
