const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuth.controller');
const adminAuthMiddleware = require('../middlewares/adminAuth.middleware');
const { credentialLimiter } = require('../middlewares/rateLimiters');

router.post('/login', credentialLimiter, adminAuthController.login);
router.post('/logout', adminAuthMiddleware, adminAuthController.logout);
router.get('/validate', adminAuthMiddleware, adminAuthController.validateToken);

module.exports = router;
