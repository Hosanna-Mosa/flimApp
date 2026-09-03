const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/adminReport.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

router.use(adminAuth);

// The report queue is operations work. Document reviewers do not see it.
const OPS = requireRole(ADMIN_ROLES.OPERATIONS);

router.get('/', OPS, adminReportController.getReports);
router.get('/stats', OPS, adminReportController.getReportStats);
router.get('/:id', OPS, adminReportController.getReportById);
router.put('/:id/acknowledge', OPS, adminReportController.acknowledgeReport);
router.post('/:id/resolve', OPS, adminReportController.resolveReport);
router.post('/:id/escalate', OPS, adminReportController.escalateReport);

module.exports = router;
