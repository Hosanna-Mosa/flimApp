const express = require('express');
const messageController = require('../controllers/message.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', auth, messageController.getConversations);
router.get('/unread-count', auth, messageController.getUnreadCount);
router.get('/:userId', auth, messageController.getConversation);
router.post('/:userId/read', auth, messageController.markAsRead);
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router;

