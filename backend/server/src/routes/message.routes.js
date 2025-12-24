const express = require('express');
const messageController = require('../controllers/message.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/:userId', auth, messageController.getConversation);

module.exports = router;

