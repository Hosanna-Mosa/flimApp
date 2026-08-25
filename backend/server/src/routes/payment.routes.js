const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/payment.controller');
const auth = require('../middlewares/auth.middleware');

// Razorpay posts its redirect callback as a normal HTML form, not JSON.
const formBody = express.urlencoded({ extended: true });

// --- App-facing (authenticated) ---
router.post('/session', auth, paymentController.createCheckoutSession);
router.get('/session/:token', auth, paymentController.getSessionStatus);

// --- Browser-facing (public; the session token is the credential) ---
router.get('/checkout/:token', paymentController.renderCheckout);
router.post('/checkout/:token/callback', formBody, paymentController.handleCallback);
router.get('/checkout/:token/callback', paymentController.handleCallback);
router.get('/checkout/:token/cancel', paymentController.handleCancel);

module.exports = router;
