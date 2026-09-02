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

// Operations may set versions, store URLs and the update message. The shutdown
// kill switch travels on this same body but blacks out every client, so the
// controller rejects that one field for anyone below super — see
// adminVersion.controller.updateVersionConfig.
router.put(
  '/',
  requireRole(ADMIN_ROLES.OPERATIONS),
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
