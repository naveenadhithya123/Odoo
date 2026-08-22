const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/signin', authController.signIn);
router.post('/signup-company', upload.single('logo'), authController.signUpCompany);
router.get('/me', authenticateToken, authController.getMe);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
