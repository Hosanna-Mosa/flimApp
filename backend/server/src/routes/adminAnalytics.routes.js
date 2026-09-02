const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalytics.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

router.use(adminAuth);

// Growth and engagement are operations reading. Revenue stays on the payments
// screen, which is super only, so nothing here exposes what the platform earns
// beyond counts of who paid.
const OPS = requireRole(ADMIN_ROLES.OPERATIONS);

router.get('/overview', OPS, adminAnalyticsController.getOverview);
router.get('/growth', OPS, adminAnalyticsController.getGrowth);
router.get('/funnel', OPS, adminAnalyticsController.getFunnel);
router.get('/retention', OPS, adminAnalyticsController.getRetention);
router.get('/events', OPS, adminAnalyticsController.getEvents);

module.exports = router;
