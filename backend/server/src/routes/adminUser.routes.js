const express = require('express');
const adminUserController = require('../controllers/adminUser.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

const router = express.Router();

router.use(adminAuth);

// Verification admins reach user records through the verification queue only,
// so the general user directory is Operations and above.
router.get('/', requireRole(ADMIN_ROLES.OPERATIONS), adminUserController.getAllUsers);
router.get('/:id', requireRole(ADMIN_ROLES.OPERATIONS), adminUserController.getUserById);

// Moving money. Super admin only, and audited.
router.put('/:id/wallet', requireRole(), adminUserController.updateWallet);

router.put('/:id/suspend', requireRole(ADMIN_ROLES.OPERATIONS), adminUserController.suspendUser);
router.put('/:id/unsuspend', requireRole(ADMIN_ROLES.OPERATIONS), adminUserController.unsuspendUser);

module.exports = router;
