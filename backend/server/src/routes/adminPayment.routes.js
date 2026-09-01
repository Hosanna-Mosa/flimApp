const express = require('express');
const router = express.Router();
const adminPaymentController = require('../controllers/adminPayment.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

router.use(adminAuth);

// Revenue reporting is super admin only.
// The single exception is lookup: operations has to be able to answer "did my
// payment go through?" on a support ticket without seeing what the platform earns.
router.get('/lookup', requireRole(ADMIN_ROLES.OPERATIONS), adminPaymentController.lookupPayment);

router.get('/', requireRole(), adminPaymentController.getPayments);
router.get('/summary', requireRole(), adminPaymentController.getPaymentSummary);
router.get('/exceptions', requireRole(), adminPaymentController.getPaymentExceptions);
router.get('/export', requireRole(), adminPaymentController.exportPayments);

module.exports = router;
