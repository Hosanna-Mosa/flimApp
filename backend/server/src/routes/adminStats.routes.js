const express = require('express');
const router = express.Router();
const adminStatsController = require('../controllers/adminStats.controller');
const adminAuthMiddleware = require('../middlewares/adminAuth.middleware');

// All routes here should be protected and admin only
router.use(adminAuthMiddleware);

router.get('/boost', adminStatsController.getBoostStats);
router.get('/wallet', adminStatsController.getWalletStats);

module.exports = router;
