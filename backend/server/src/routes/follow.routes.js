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
router.get('/users/:id/followers', auth, followController.getFollowers);
router.get('/users/:id/following', auth, followController.getFollowing);

// Check follow status
router.get('/users/:id/following-status', auth, followController.isFollowing);
router.get('/users/:id/follow-status', auth, followController.getFollowStatus);

// Get mutual followers
router.get('/users/:id/mutual-followers', auth, followController.getMutualFollowers);

module.exports = router;
