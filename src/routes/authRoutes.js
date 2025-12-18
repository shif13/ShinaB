// ============================================
// FILE: src/routes/authRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const { register, login, getMe, refreshToken, logout, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../middleware/validator');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', protect, getMe);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

module.exports = router;
