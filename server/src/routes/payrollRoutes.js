const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');

router.get('/overview', authenticateToken, requireAdminOrHR, payrollController.getPayrollOverview);
router.get('/my-payroll', authenticateToken, payrollController.getEmployeePayroll);
router.get('/employee/:employeeId', authenticateToken, payrollController.getEmployeePayroll);
router.post('/generate', authenticateToken, requireAdminOrHR, payrollController.generatePayslip);
router.get('/payslip/:id/pdf', authenticateToken, payrollController.downloadPayslipPDF);

module.exports = router;
