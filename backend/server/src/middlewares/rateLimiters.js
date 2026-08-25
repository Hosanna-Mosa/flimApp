const rateLimit = require('express-rate-limit');

/**
 * Shared rate limiters for sensitive, unauthenticated endpoints.
 *
 * The global limiter in app.js (1000 req / 15 min) is far too permissive for
 * credential-handling routes: it allows ~1000 password or OTP guesses per IP
 * per window. These tighter limiters sit in front of those routes.
 */

// Credential verification: admin login, password login, availability checks.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
});

// OTP verification: guarded separately so a stolen phone number cannot be
// brute-forced through the 6-digit code space.
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP verification attempts. Please request a new code.',
  },
});

module.exports = { credentialLimiter, otpVerifyLimiter };
