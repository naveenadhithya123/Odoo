const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const employeeRoutes = require('./employeeRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const leaveRoutes = require('./leaveRoutes');
const payrollRoutes = require('./payrollRoutes');
const notificationRoutes = require('./notificationRoutes');
const reportRoutes = require('./reportRoutes');

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
