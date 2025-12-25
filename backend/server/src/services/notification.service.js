const Notification = require('../models/Notification.model');
const { getIo } = require('../utils/socketStore');

const listNotifications = async (userId) =>
  Notification.find({ user: userId }).sort({ createdAt: -1 });

const markRead = async (userId, id) =>
  Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });

const createNotification = async ({ user, title, body, type, metadata }) => {
  const notification = await Notification.create({
    user,
    title,
    body,
    type,
    metadata,
  });

  const io = getIo();
  if (io) {
    io.to(user.toString()).emit('new_notification', notification);
  }

  return notification;
};

const markAllAsRead = async (userId) =>
  Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

module.exports = {registerPushToken , listNotifications, markRead, createNotification, markAllAsRead };


