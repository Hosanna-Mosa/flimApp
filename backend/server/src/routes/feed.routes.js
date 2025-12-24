const express = require('express');
const feedController = require('../controllers/feed.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// Get personalized feed
router.get('/', auth, feedController.getPersonalizedFeed);

// Get trending feed
router.get('/trending', auth, feedController.getTrendingFeed);

// Get industry feed
router.get('/industry/:industry', feedController.getIndustryFeed); // Public

// Get user's posts (profile feed)
router.get('/users/:id/posts', feedController.getUserFeed); // Public with optional auth

// Invalidate feed cache
router.post('/invalidate', auth, feedController.invalidateFeed);

module.exports = router;
