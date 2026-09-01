const express = require('express');
const router = express.Router();
const adminAuditController = require('../controllers/adminAudit.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');

router.use(adminAuth);

// The full trail — including the reader's own actions — is super admin only.
router.get('/', requireRole(), adminAuditController.getAuditLogs);

module.exports = router;
