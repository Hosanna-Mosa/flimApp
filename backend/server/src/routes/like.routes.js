const express = require('express');
const likeController = require('../controllers/like.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// Like/Unlike posts
router.post('/posts/:id/like', auth, likeController.likePost);
router.delete('/posts/:id/like', auth, likeController.unlikePost);

// Get post likes
router.get('/posts/:id/likes', likeController.getPostLikes); // Public

// Get user's liked posts
router.get('/users/:id/liked', likeController.getUserLikedPosts); // Public

// Check if user liked a post
router.get('/posts/:id/liked', auth, likeController.hasLiked);

module.exports = router;
