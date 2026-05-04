const express = require('express');
const moderationController = require('../controllers/moderation.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/report', auth, moderationController.reportContent);
router.post('/block', auth, moderationController.blockUser);
router.post('/unblock', auth, moderationController.unblockUser);
router.get('/users/me/blocked', auth, moderationController.getBlockedUsers);

module.exports = router;
