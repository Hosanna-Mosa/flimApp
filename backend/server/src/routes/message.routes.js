const express = require('express');
const messageController = require('../controllers/message.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', auth, messageController.getConversations);
router.get('/:userId', auth, messageController.getConversation);
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router;

