const express = require('express');
const router = express.Router();
const adminVerificationController = require('../controllers/adminVerification.controller');
const adminAuthMiddleware = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

// All verification routes require admin authentication
router.use(adminAuthMiddleware);

const REVIEWERS = [ADMIN_ROLES.VERIFICATION, ADMIN_ROLES.OPERATIONS];

router.get('/requests', requireRole(...REVIEWERS), adminVerificationController.getRequests);
router.get('/requests/:id', requireRole(...REVIEWERS), adminVerificationController.getRequestById);
router.post('/:userId/approve', requireRole(...REVIEWERS), adminVerificationController.approve);
router.post('/:userId/reject', requireRole(...REVIEWERS), adminVerificationController.reject);
router.get('/logs', requireRole(...REVIEWERS), adminVerificationController.getLogs);

// Subscriptions are paid records, so document reviewers do not see them.
router.get('/subscriptions', requireRole(ADMIN_ROLES.OPERATIONS), adminVerificationController.getSubscriptions);

// Destroying a paid subscription record is super admin only, and audited.
router.delete('/subscriptions/:id', requireRole(), adminVerificationController.deleteSubscription);

module.exports = router;
