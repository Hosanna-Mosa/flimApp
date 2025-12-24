const express = require('express');
const followController = require('../controllers/follow.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// Follow/Unfollow
router.post('/users/:id/follow', auth, followController.followUser);
router.delete('/users/:id/follow', auth, followController.unfollowUser);

// Follow requests (for private accounts)
router.get('/follow-requests', auth, followController.getPendingRequests);
router.post('/follow-requests/:userId/accept', auth, followController.acceptFollowRequest);
router.post('/follow-requests/:userId/reject', auth, followController.rejectFollowRequest);

// Get followers/following
router.get('/users/:id/followers', followController.getFollowers); // Public
router.get('/users/:id/following', followController.getFollowing); // Public

// Check follow status
router.get('/users/:id/following-status', auth, followController.isFollowing);

// Get mutual followers
router.get('/users/:id/mutual-followers', auth, followController.getMutualFollowers);

module.exports = router;
