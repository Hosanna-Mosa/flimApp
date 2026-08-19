const { Expo } = require('expo-server-sdk');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const { getIo } = require('../utils/socketStore');

const expo = new Expo({
  useFcmV1: true
});

const registerPushToken = async (userId, token) => {
  
  if (!Expo.isExpoPushToken(token) && !token.startsWith("ExponentPushToken")) {
    console.error('[PUSH][SERVICE] ❌ Invalid Expo push token format:', token);
    throw new Error('Invalid Expo push token');
  }
  

  const user = await User.findById(userId);
  if (!user) {
    console.error('[PUSH][SERVICE] ❌ User not found:', userId);
    throw new Error('User not found');
  }
  

  // Replace all previous tokens with the current device token
  user.pushTokens = [token];
  await user.save();

  
  return { success: true };
};

const sendPushNotifications = async (userId, title, body, data = {}) => {
  const timestamp = new Date().toISOString();
  
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('[PUSH][SEND] ❌ User not found:', userId);
      return;
    }
    
    if (!user.pushTokens || user.pushTokens.length === 0) {
      console.warn('[PUSH][SEND] ⚠️  No push tokens registered for user:', userId);
      return;
    }
    

    const messages = [];
    for (const token of user.pushTokens) {
      if (!Expo.isExpoPushToken(token) && !token.startsWith("ExponentPushToken")) {
        console.error('[PUSH][SEND] ❌ Invalid token format (skipping):', token);
        continue;
      }
      
      const message = {
        to: token,
        sound: 'default',
        title,
        body,
        priority: 'high',
        channelId: 'default',
        data,
      };
      
      messages.push(message);
    }
    
    if (messages.length === 0) {
      console.error('[PUSH][SEND] ❌ No valid messages to send');
      return;
    }
    

    const chunks = expo.chunkPushNotifications(messages);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        
        // Check for errors in tickets
        // Check for tickets and handle cleanup
        const invalidTokens = [];
        
        ticketChunk.forEach((ticket, idx) => {
          const token = chunk[idx].to; // Map ticket back to original token

          if (ticket.status === 'error') {
            console.error(`[PUSH][SEND] ❌ Ticket ${idx} error:`, ticket.message);
            console.error('[PUSH][SEND] Error details:', JSON.stringify(ticket.details));
            
            // AUTOMATIC CLEANUP: Remove token if invalid
            if (ticket.details && (ticket.details.error === 'DeviceNotRegistered' || ticket.details.error === 'InvalidCredentials')) {
              console.warn(`[PUSH][CLEANUP] ⚠️ Flagging invalid token for removal: ${token} (Reason: ${ticket.details.error})`);
              invalidTokens.push(token);
            }
          } else if (ticket.status === 'ok') {
          }
        });

        // Execute cleanup if valid/invalid tokens were found
        if (invalidTokens.length > 0) {
          try {
            await User.updateOne(
              { _id: userId },
              { $pull: { pushTokens: { $in: invalidTokens } } }
            );
          } catch (cleanupError) {
            console.error('[PUSH][CLEANUP] ❌ Failed to remove tokens:', cleanupError);
          }
        }
      } catch (error) {
        console.error(`[PUSH][SEND] ❌ Error sending chunk ${i + 1}:`, error.message);
        console.error('[PUSH][SEND] Error stack:', error.stack);
      }
    }
    
  } catch (error) {
    console.error('[PUSH][SEND] ❌ Fatal error in sendPushNotifications:', error.message);
    console.error('[PUSH][SEND] Error stack:', error.stack);
  }
};

const listNotifications = async (userId) =>
  Notification.find({ user: userId })
    .populate('actor', 'name avatar') // Populate actor info if you have reference
    .sort({ createdAt: -1 });

const markRead = async (userId, id) =>
  Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });

const createNotification = async ({ user, actor, title, body, type, metadata }) => {
  // For certain types like follow requests, we want only ONE active notification
  // to avoid duplicates if the user Rapid Clicks or toggles follow.
  if (type === 'follow_request' || type === 'follow') {
    await Notification.deleteMany({
      user,
      actor,
      type: { $in: ['follow_request', 'follow'] }
    });
  }

  const notification = await Notification.create({
    user,
    actor,
    title,
    body,
    type,
    metadata,
  });

  const io = getIo();
  if (io) {
    io.to(user.toString()).emit('new_notification', notification);
  }

  // Send Push Notification
  // Trigger async push notification without awaiting to prevent blocking response
  sendPushNotifications(user, title, body, { type, ...metadata });

  return notification;
};

const deleteNotification = async (query) => {
  return Notification.deleteMany(query);
};

const markAllAsRead = async (userId) =>
  Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

module.exports = {registerPushToken, sendPushNotifications, listNotifications, markRead, createNotification, deleteNotification, markAllAsRead };



