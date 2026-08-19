const notificationService = require('../services/notification.service');
const Notification = require('../models/Notification.model');
const { success } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const notifications = await notificationService.listNotifications(req.user.id);
    return success(res, notifications);
  } catch (err) {
    return next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.user.id, req.params.id);
    return success(res, notification);
  } catch (err) {
    return next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    return next(err);
  }
};

const registerToken = async (req, res, next) => {
  const timestamp = new Date().toISOString();

  try {
    const { token } = req.body;

    if (!token) {
      console.error('[PUSH][REGISTER] ❌ Token missing in request body');
      throw new Error('Token is required');
    }


    const result = await notificationService.registerPushToken(req.user.id, token);


    return success(res, result);
  } catch (err) {
    console.error('[PUSH][REGISTER] ❌ Token registration failed');
    console.error('[PUSH][REGISTER] Error:', err.message);
    console.error('[PUSH][REGISTER] Stack:', err.stack);
    return next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, isRead: false });
    return success(res, { count });
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, markRead, registerToken, markAllAsRead, getUnreadCount };


