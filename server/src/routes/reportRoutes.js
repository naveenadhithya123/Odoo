const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');

router.get('/overview', authenticateToken, requireAdminOrHR, reportController.getAnalyticsOverview);
router.get('/export/attendance', authenticateToken, requireAdminOrHR, reportController.exportAttendanceCSV);

module.exports = router;
