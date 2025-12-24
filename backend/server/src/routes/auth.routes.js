const express = require('express');
const Joi = require('joi');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.post(
  '/login',
  validate(
    Joi.object({
      body: Joi.object({ identifier: Joi.string().required() }).required(),
    })
  ),
  authController.login
);

router.post(
  '/verify-otp',
  validate(
    Joi.object({
      body: Joi.object({
        identifier: Joi.string().required(),
        otp: Joi.string().required(),
      }).required(),
    })
  ),
  authController.verifyOtp
);

router.post(
  '/register',
  validate(
    Joi.object({
      body: Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        password: Joi.string().min(6).required(),
        roles: Joi.array().items(Joi.string()).required(),
        industries: Joi.array().items(Joi.string()).required(),
      }).required(),
    })
  ),
  authController.register
);

router.post(
  '/login-password',
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

module.exports = router;

