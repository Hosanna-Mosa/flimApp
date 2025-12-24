const Notification = require('../models/Notification.model');

const listNotifications = async (userId) =>
  Notification.find({ user: userId }).sort({ createdAt: -1 });

const markRead = async (userId, id) =>
  Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });

module.exports = { listNotifications, markRead };

