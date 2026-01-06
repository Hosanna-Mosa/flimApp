const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/create-order', auth, subscriptionController.createOrder);
router.post('/verify-payment', auth, subscriptionController.verifyPayment);

module.exports = router;
