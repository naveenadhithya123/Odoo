import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

const getDownloadFilename = (response, fallbackName) => {
  const disposition = response.headers.get('content-disposition');
  const match = disposition && disposition.match(/filename="?([^"]+)"?/i);
  return match ? match[1] : fallbackName;
};

export const downloadProtectedFile = async (url, fallbackName) => {
  const token = localStorage.getItem('dayflow_token');
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = `Download failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      message = errorData.message || message;
    } catch {
      // Keep the generic status message when the server does not return JSON.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = getDownloadFilename(response, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dayflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.startsWith('/signin') && !window.location.pathname.startsWith('/signup')) {
        localStorage.removeItem('dayflow_token');
        localStorage.removeItem('dayflow_user');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  signIn: (data) => api.post('/auth/signin', data),
  signUpCompany: (formData) => api.post('/auth/signup-company', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Employee Services
export const employeeService = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (formData) => api.post('/employees/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/employees/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateSalary: (id, data) => api.put(`/employees/${id}/salary`, data),
  addSkill: (id, data) => api.post(`/employees/${id}/skills`, data),
  deleteSkill: (skillId) => api.delete(`/employees/skills/${skillId}`),
  addCertification: (id, data) => api.post(`/employees/${id}/certifications`, data),
  deleteCertification: (certId) => api.delete(`/employees/certifications/${certId}`),
};

// Attendance Services
export const attendanceService = {
  getSystrayStatus: () => api.get('/attendance/status'),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  getDaily: (date, search) => api.get('/attendance/daily', { params: { date, search } }),
  getMonthly: (employeeId, month, year) => {
    const url = employeeId ? `/attendance/monthly/${employeeId}` : '/attendance/monthly';
    return api.get(url, { params: { month, year } });
  },
};

// Time Off / Leave Services
export const leaveService = {
  getBalances: (employeeId) => {
    const url = employeeId ? `/leaves/balances/${employeeId}` : '/leaves/balances';
    return api.get(url);
  },
  getRequests: (params) => api.get('/leaves/requests', { params }),
  submitRequest: (formData) => api.post('/leaves/request', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approve: (id, data) => api.put(`/leaves/requests/${id}/approve`, data),
  reject: (id, data) => api.put(`/leaves/requests/${id}/reject`, data),
  getYearCalendar: (employeeId, year) => {
    const url = employeeId ? `/leaves/calendar-year/${employeeId}` : '/leaves/calendar-year';
    return api.get(url, { params: { year } });
  },
  getHolidays: () => api.get('/leaves/holidays'),
};

// Payroll Services
export const payrollService = {
  getOverview: (params) => api.get('/payroll/overview', { params }),
  getMyPayroll: () => api.get('/payroll/my-payroll'),
  getEmployeePayroll: (employeeId) => api.get(`/payroll/employee/${employeeId}`),
  generatePayslip: (data) => api.post('/payroll/generate', data),
  getPdfUrl: (id) => `/api/payroll/payslip/${id}/pdf`,
};

// Report & Notification Services
export const reportService = {
  getOverview: () => api.get('/reports/overview'),
  getAttendanceCsvUrl: (month, year) => `/api/reports/export/attendance?month=${month}&year=${year}`,
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export default api;
