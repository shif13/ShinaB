// ============================================
// FILE: src/routes/authRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, login, getMe, refreshToken, logout, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../middleware/validator');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', protect, getMe);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

// Facebook OAuth (optional)
// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), googleCallback);

module.exports = router;
