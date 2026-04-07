const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All wallet routes require authentication
router.use(authMiddleware);

router.get('/balance', walletController.getWallet);
router.post('/deposit/create', walletController.createOrder);
router.post('/deposit/verify', walletController.verifyPayment);
router.post('/withdraw', walletController.withdraw);

module.exports = router;
