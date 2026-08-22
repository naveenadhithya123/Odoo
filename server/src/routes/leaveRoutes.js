const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/balances', authenticateToken, leaveController.getLeaveBalances);
router.get('/balances/:employeeId', authenticateToken, leaveController.getLeaveBalances);
router.get('/requests', authenticateToken, leaveController.getLeaveRequests);
router.post('/request', authenticateToken, upload.single('attachment'), leaveController.submitLeaveRequest);
router.put('/requests/:id/approve', authenticateToken, requireAdminOrHR, leaveController.approveLeaveRequest);
router.put('/requests/:id/reject', authenticateToken, requireAdminOrHR, leaveController.rejectLeaveRequest);
router.get('/calendar-year', authenticateToken, leaveController.getYearCalendar);
router.get('/calendar-year/:employeeId', authenticateToken, leaveController.getYearCalendar);
router.get('/holidays', authenticateToken, leaveController.getPublicHolidays);

module.exports = router;
