const express = require('express');
const router = express.Router();
const adminVersionController = require('../controllers/adminVersion.controller');
const adminAuthMiddleware = require('../middlewares/adminAuth.middleware');
const validate = require('../middlewares/validate.middleware');
const Joi = require('joi');

// All version routes require admin authentication
router.use(adminAuthMiddleware);

router.get('/', adminVersionController.getVersionConfig);
router.put(
  '/',
  validate(
    Joi.object({
      body: Joi.object({
        ios: Joi.object({
          latestVersion: Joi.string().required(),
          minimumVersion: Joi.string().required(),
          storeUrl: Joi.string().uri().required(),
        }).optional(),
        android: Joi.object({
          latestVersion: Joi.string().required(),
          minimumVersion: Joi.string().required(),
          storeUrl: Joi.string().uri().required(),
        }).optional(),
        title: Joi.string().allow('', null).optional(),
        message: Joi.string().allow('', null).optional(),
      }).required(),
    })
  ),
  adminVersionController.updateVersionConfig
);

module.exports = router;
