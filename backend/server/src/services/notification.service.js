const { Expo } = require('expo-server-sdk');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');

const expo = new Expo();

const registerPushToken = async (userId, token) => {
  if (!Expo.isExpoPushToken(token)) {
    console.error(`[Notification] Invalid Expo push token: ${token}`);
    throw new Error('Invalid Expo push token');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Add token if not exists
  if (!user.pushTokens.includes(token)) {
    user.pushTokens.push(token);
    await user.save();
    console.log(`[Notification] Registered push token for user ${userId}`);
  }
  
  return { success: true };
};

const sendPushNotifications = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`[Notification] No push tokens for user ${userId}`);
      return;
    }

    const messages = [];
    for (const token of user.pushTokens) {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`[Notification] Invalid push token for user ${userId}: ${token}`);
        continue;
      }
      
      messages.push({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('[Notification] Push tickets:', ticketChunk);
      } catch (error) {
        console.error('[Notification] Error sending push chunk:', error);
      }
    }
  } catch (error) {
    console.error('[Notification] Error sending push notifications:', error);
  }
};

const createNotification = async (recipientId, type, data, actorId = null) => {
  // Create DB entry
  const notification = await Notification.create({
    user: recipientId,
    type,
    data, // e.g., { postId: '...', message: '...' }
    actor: actorId,
    isRead: false
  });

  // Send Push Notification
  let title = 'New Notification';
  let body = 'You have a new update';

  // Customize message based on type
  if (type === 'like_post') {
    title = 'New Like';
    body = 'Someone liked your post';
  } else if (type === 'comment_post') {
    title = 'New Comment';
    body = 'Someone commented on your post';
  } else if (type === 'follow') {
    title = 'New Follower';
    body = 'Someone started following you';
  } else if (type === 'message') {
    title = 'New Message';
    body = 'You have a new message';
  }

  // Send async (don't await to block response)
  sendPushNotifications(recipientId, title, body, { type, ...data });

  return notification;
};

const listNotifications = async (userId) =>
  Notification.find({ user: userId })
    .populate('actor', 'name avatar') // Populate actor info if you have reference
    .sort({ createdAt: -1 });

const markRead = async (userId, id) =>
  Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });

module.exports = { 
  registerPushToken, 
  sendPushNotifications, 
  createNotification, 
  listNotifications, 
  markRead 
};

