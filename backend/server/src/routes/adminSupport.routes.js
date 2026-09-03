const express = require('express');
const router = express.Router();
const adminSupportController = require('../controllers/adminSupport.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const { ADMIN_ROLES } = require('../constants/adminRoles');

router.use(adminAuth);

// The support desk is operations work. Document reviewers do not see it.
const OPS = requireRole(ADMIN_ROLES.OPERATIONS);

router.get('/', OPS, adminSupportController.getTickets);
router.get('/stats', OPS, adminSupportController.getSupportStats);
router.get('/:id', OPS, adminSupportController.getTicketById);
router.post('/:id/reply', OPS, adminSupportController.replyToTicket);
router.put('/:id/status', OPS, adminSupportController.updateTicketStatus);

module.exports = router;
