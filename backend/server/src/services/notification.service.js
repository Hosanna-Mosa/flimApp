const { Expo } = require('expo-server-sdk');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const { getIo } = require('../utils/socketStore');

const expo = new Expo({
  useFcmV1: true
});

const registerPushToken = async (userId, token) => {
  console.log('[PUSH][SERVICE] Validating Expo push token...');
  console.log('[PUSH][SERVICE] Token format:', token);
  
  if (!Expo.isExpoPushToken(token) && !token.startsWith("ExponentPushToken")) {
    console.error('[PUSH][SERVICE] ❌ Invalid Expo push token format:', token);
    throw new Error('Invalid Expo push token');
  }
  
  console.log('[PUSH][SERVICE] ✅ Token format valid');
  console.log('[PUSH][SERVICE] Looking up user:', userId);

  const user = await User.findById(userId);
  if (!user) {
    console.error('[PUSH][SERVICE] ❌ User not found:', userId);
    throw new Error('User not found');
  }
  
  console.log('[PUSH][SERVICE] ✅ User found');
  console.log('[PUSH][SERVICE] Existing tokens count:', user.pushTokens?.length || 0);

  // // Add token if not exists
  // if (!user.pushTokens.includes(token)) {
  //   user.pushTokens.push(token);
  //   await user.save();
  //   console.log('[PUSH][SERVICE] ✅ New token added and saved to database');
  //   console.log('[PUSH][SERVICE] Total tokens for user:', user.pushTokens.length);
  // } else {
  //   console.log('[PUSH][SERVICE] ℹ️  Token already exists - no update needed');
  // }

  // Replace all previous tokens with the current device token
  user.pushTokens = [token];
  await user.save();

  console.log('[PUSH][SERVICE] ✅ Token registered for this device only');
  console.log('[PUSH][SERVICE] Total tokens for user:', user.pushTokens.length);
  
  return { success: true };
};

const sendPushNotifications = async (userId, title, body, data = {}) => {
  const timestamp = new Date().toISOString();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[PUSH][SEND] 🚀 Sending push notification at ${timestamp}`);
  console.log('[PUSH][SEND] Target user ID:', userId);
  console.log('[PUSH][SEND] Title:', title);
  console.log('[PUSH][SEND] Body:', body);
  console.log('[PUSH][SEND] Data:', JSON.stringify(data));
  
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('[PUSH][SEND] ❌ User not found:', userId);
      return;
    }
    
    if (!user.pushTokens || user.pushTokens.length === 0) {
      console.warn('[PUSH][SEND] ⚠️  No push tokens registered for user:', userId);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    
    console.log('[PUSH][SEND] Found', user.pushTokens.length, 'token(s) for user');

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
      console.log('[PUSH][SEND] Message prepared for token:', token);
    }
    
    if (messages.length === 0) {
      console.error('[PUSH][SEND] ❌ No valid messages to send');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    
    console.log('[PUSH][SEND] Total messages to send:', messages.length);
    console.log('[PUSH][SEND] Message payload:', JSON.stringify(messages[0], null, 2));

    const chunks = expo.chunkPushNotifications(messages);
    console.log('[PUSH][SEND] Messages chunked into', chunks.length, 'batch(es)');
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[PUSH][SEND] Sending chunk ${i + 1}/${chunks.length} (${chunk.length} message(s))...`);
      
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(`[PUSH][SEND] ✅ Chunk ${i + 1} sent successfully`);
        console.log('[PUSH][SEND] Expo API Response:', JSON.stringify(ticketChunk, null, 2));
        
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
            console.log(`[PUSH][SEND] ✅ Ticket ${idx} accepted - ID:`, ticket.id);
          }
        });

        // Execute cleanup if valid/invalid tokens were found
        if (invalidTokens.length > 0) {
          try {
            console.log(`[PUSH][CLEANUP] 🗑️ Removing ${invalidTokens.length} invalid token(s) from user ${userId}...`);
            await User.updateOne(
              { _id: userId },
              { $pull: { pushTokens: { $in: invalidTokens } } }
            );
            console.log('[PUSH][CLEANUP] ✅ Cleanup complete');
          } catch (cleanupError) {
            console.error('[PUSH][CLEANUP] ❌ Failed to remove tokens:', cleanupError);
          }
        }
      } catch (error) {
        console.error(`[PUSH][SEND] ❌ Error sending chunk ${i + 1}:`, error.message);
        console.error('[PUSH][SEND] Error stack:', error.stack);
      }
    }
    
    console.log('[PUSH][SEND] ✅ Push notification sending complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('[PUSH][SEND] ❌ Fatal error in sendPushNotifications:', error.message);
    console.error('[PUSH][SEND] Error stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
};

const listNotifications = async (userId) =>
  Notification.find({ user: userId })
    .populate('actor', 'name avatar') // Populate actor info if you have reference
    .sort({ createdAt: -1 });

const markRead = async (userId, id) =>
  Notification.findOneAndUpdate({ _id: id, user: userId }, { isRead: true }, { new: true });

const createNotification = async ({ user, actor, title, body, type, metadata }) => {
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

const markAllAsRead = async (userId) =>
  Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

module.exports = {registerPushToken , sendPushNotifications ,listNotifications, markRead, createNotification, markAllAsRead };



