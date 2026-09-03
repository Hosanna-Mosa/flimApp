const express = require('express');
const router = express.Router();
const adminStatsController = require('../controllers/adminStats.controller');
const adminAuthMiddleware = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

router.use(adminAuthMiddleware);

router.get('/boost', requireRole(ADMIN_ROLES.OPERATIONS), adminStatsController.getBoostStats);
router.get('/wallet', requireRole(ADMIN_ROLES.OPERATIONS), adminStatsController.getWalletStats);

module.exports = router;
