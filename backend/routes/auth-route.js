const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    login,
    requestResetCode,
    verifyResetCode,
    resetPassword
} = require('../controllers/auth-controllers');

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30,
    message: 'Too many login attempts, please try again in 5 minutes.',
});

const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: 'Too many reset attempts, please try again later.',
});

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/request-reset', resetLimiter, requestResetCode);
router.post('/verify-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;