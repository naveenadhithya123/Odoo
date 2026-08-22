const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');

router.get('/status', authenticateToken, attendanceController.getSystrayStatus);
router.post('/check-in', authenticateToken, attendanceController.checkIn);
router.post('/check-out', authenticateToken, attendanceController.checkOut);
router.get('/daily', authenticateToken, requireAdminOrHR, attendanceController.getDailyAttendance);
router.get('/monthly', authenticateToken, attendanceController.getMonthlyAttendance);
router.get('/monthly/:employeeId', authenticateToken, attendanceController.getMonthlyAttendance);

module.exports = router;
