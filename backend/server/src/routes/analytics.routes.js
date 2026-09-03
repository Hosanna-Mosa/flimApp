const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const optionalAuth = require('../middlewares/optionalAuth.middleware');

const router = express.Router();

// Optional auth: the events worth having are often fired before sign-in, since
// that is where people drop out of onboarding.
router.post('/', optionalAuth, analyticsController.track);

module.exports = router;
