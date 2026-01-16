const express = require('express');
const notificationController = require('../controllers/notification.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', auth, notificationController.list);
router.post('/read-all', auth, notificationController.markAllAsRead);
router.post('/:id/read', auth, notificationController.markRead);
router.post('/register-token', auth, notificationController.registerToken);
router.get('/count', auth, notificationController.getUnreadCount);

module.exports = router;

