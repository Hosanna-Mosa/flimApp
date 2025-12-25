const notificationService = require('../services/notification.service');
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

module.exports = { list, markRead, markAllAsRead };

