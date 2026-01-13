const express = require('express');
const otpController = require('../../controllers/auth/otp.controller');
const rateLimit = require('express-rate-limit');

const router = express.Router();

/**
 * Rate limiting for sending OTP to prevent abuse
 * Limits to 5 requests per 10 minutes
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 5, 
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Route: POST /auth/send-otp
router.post('/send-otp', otpLimiter, otpController.sendOtp);

// Route: POST /auth/verify-otp
router.post('/verify-otp', otpController.verifyOtp);

module.exports = router;
