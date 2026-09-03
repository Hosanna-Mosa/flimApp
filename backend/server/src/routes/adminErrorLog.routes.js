const express = require('express');
const router = express.Router();
const adminErrorLogController = require('../controllers/adminErrorLog.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

router.use(adminAuth);

// Knowing what is broken is operations work — it is usually the answer to a
// support ticket. Stacks expose no user data, so this needs no higher bar.
const OPS = requireRole(ADMIN_ROLES.OPERATIONS);

router.get('/', OPS, adminErrorLogController.getErrors);
router.get('/stats', OPS, adminErrorLogController.getErrorStats);
router.get('/:id', OPS, adminErrorLogController.getErrorById);
router.put('/:id/resolve', OPS, adminErrorLogController.resolveError);

module.exports = router;
