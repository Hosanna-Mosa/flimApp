const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/request', verificationController.submitRequest);
router.get('/status', verificationController.getStatus);

module.exports = router;
