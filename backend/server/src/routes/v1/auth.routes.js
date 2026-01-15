const express = require('express');
const rateLimit = require('express-rate-limit');
const otpController = require('../../controllers/auth/otp.controller');

const router = express.Router();

/**
 * Rate limiting for sending OTP to prevent abuse
 * Limits to 5 requests per 10 minutes (per IP)
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,                 // limit each IP to 5 requests per windowMs
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 10 minutes',
  },
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
});

/**
 * Routes
 */

// POST /auth/send-otp
router.post('/send-otp', otpLimiter, otpController.sendOtp);

// POST /auth/verify-otp
router.post('/verify-otp', otpController.verifyOtp);

module.exports = router;
