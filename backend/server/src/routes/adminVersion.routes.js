const express = require('express');
const router = express.Router();
const adminVersionController = require('../controllers/adminVersion.controller');
const adminAuthMiddleware = require('../middlewares/adminAuth.middleware');
const validate = require('../middlewares/validate.middleware');
const Joi = require('joi');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

// All version routes require admin authentication
router.use(adminAuthMiddleware);

// Every admin may read the current release config.
router.get(
  '/',
  requireRole(ADMIN_ROLES.VERIFICATION, ADMIN_ROLES.OPERATIONS),
  adminVersionController.getVersionConfig
);

// Writing it sets the minimum version and the shutdown kill switch, so it is
// super admin only, and audited.
router.put(
  '/',
  requireRole(),
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
        isShutdown: Joi.boolean().optional(),
        shutdownTitle: Joi.string().allow('', null).optional(),
        shutdownMessage: Joi.string().allow('', null).optional(),
      }).required(),
    })
  ),
  adminVersionController.updateVersionConfig
);

module.exports = router;
