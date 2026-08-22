const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticateToken, employeeController.getAllEmployees);
router.get('/:id', authenticateToken, employeeController.getEmployeeById);
router.post('/create', authenticateToken, requireAdminOrHR, upload.single('profile_picture'), employeeController.createEmployee);
router.put('/:id', authenticateToken, upload.single('profile_picture'), employeeController.updateEmployee);
router.put('/:id/salary', authenticateToken, requireAdminOrHR, employeeController.updateSalaryStructure);

// Skills & Certifications
router.post('/:id/skills', authenticateToken, employeeController.addSkill);
router.delete('/skills/:skillId', authenticateToken, employeeController.deleteSkill);
router.post('/:id/certifications', authenticateToken, employeeController.addCertification);
router.delete('/certifications/:certId', authenticateToken, employeeController.deleteCertification);

module.exports = router;
