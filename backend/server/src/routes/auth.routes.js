const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const { credentialLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 authentication attempts per 15 minutes
  message: {
    message: 'Too many authentication attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  loginLimiter,
  validate(
    Joi.object({
      body: Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        roles: Joi.array().items(Joi.string()).required(),
        industries: Joi.array().items(Joi.string()).required(),
        language: Joi.string().allow('', null),
      }).required(),
    })
  ),
  authController.register
);

router.post(
  '/login-password',
  loginLimiter,
  validate(
    Joi.object({
      body: Joi.object({
        phone: Joi.string().required(),
        password: Joi.string().required(),
      }).required(),
    })
  ),
  authController.loginWithPassword
);

router.post(
  '/refresh',
  validate(
    Joi.object({
      body: Joi.object({ refreshToken: Joi.string().required() }).required(),
    })
  ),
  authController.refresh
);

router.post(
  '/logout',
  auth,
  validate(
    Joi.object({
      body: Joi.object({ refreshToken: Joi.string().required() }).required(),
    })
  ),
  authController.logout
);

router.post(
  '/verify-password',
  auth,
  validate(
    Joi.object({
      body: Joi.object({ password: Joi.string().required() }).required(),
    })
  ),
  authController.verifyPassword
);

router.post(
  '/change-password',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).required(),
      }).required(),
    })
  ),
  authController.changePassword
);

router.post(
  '/forgot-password',
  credentialLimiter,
  validate(
    Joi.object({
      body: Joi.object({
        email: Joi.string().email().required(),
      }).required(),
    })
  ),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  credentialLimiter,
  validate(
    Joi.object({
      body: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().length(6).required(),
        newPassword: Joi.string().min(6).required(),
      }).required(),
    })
  ),
  authController.resetPassword
);
router.post(
  '/check-availability',
  credentialLimiter,
  authController.checkAvailability
);

router.get(
  '/version-check',
  validate(
    Joi.object({
      query: Joi.object({
        platform: Joi.string().valid('ios', 'android').required(),
        version: Joi.string().required(),
      }).required(),
    })
  ),
  authController.versionCheck
);

module.exports = router;

