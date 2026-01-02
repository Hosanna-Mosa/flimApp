const express = require('express');
const router = express.Router();
const adminVerificationController = require('../controllers/adminVerification.controller');
const adminAuthMiddleware = require('../middlewares/adminAuth.middleware');

// All verification routes require admin authentication
router.use(adminAuthMiddleware);

router.get('/requests', adminVerificationController.getRequests);
router.get('/requests/:id', adminVerificationController.getRequestById);
router.post('/:userId/approve', adminVerificationController.approve);
router.post('/:userId/reject', adminVerificationController.reject);
router.get('/logs', adminVerificationController.getLogs);

module.exports = router;
