const express = require('express');
const router = express.Router();
const adminAuditController = require('../controllers/adminAudit.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

router.use(adminAuth);

// Operations reads the full trail too. Seeing who did what is oversight, not
// privilege — and a moderator who cannot check their own past decisions ends up
// repeating them.
router.get('/', requireRole(ADMIN_ROLES.OPERATIONS), adminAuditController.getAuditLogs);

module.exports = router;
