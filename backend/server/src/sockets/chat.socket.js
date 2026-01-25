const jwt = require('jsonwebtoken');
const messageService = require('../services/message.service');
const queueService = require('../services/queue.service');
const logger = require('../config/logger');
const notificationService = require('../services/notification.service');
const User = require('../models/User.model');

const registerChatHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.sub;
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log('[CHAT SOCKET] Connection:', socket.id);
    console.log('[CHAT SOCKET] userId:', socket.userId);

    // Existing middleware sets socket.userId and joins room automatically,
    // but we add this listener per user request for debug logging flow.
    socket.on('join', (userId) => {
      console.log('[CHAT SOCKET] join event:', userId);
      socket.join(userId.toString());
      console.log('[SOCKET] User joined room:', userId);
    });

    // Auto-join from middleware (keeping logic, just logging)
    if (socket.userId) {
        socket.join(socket.userId);
        console.log('[SOCKET] User joined room (auto):', socket.userId);
    }

    socket.on('send_message', async (data) => {
      console.log('[CHAT SOCKET] send_message RECEIVED:', data);
      const { to, content } = data;

      try {
        if (!to || !content) {
          console.log('[SOCKET] Missing to or content');
          return;
        }

        const recipientId = to.trim();

        const message = await messageService.createMessage({
          senderId: socket.userId,
          recipientId: recipientId,
          content,
        });
        
        // Populate sender and recipient before emitting (same as REST API)
        await message.populate('sender', 'name avatar isVerified');
        await message.populate('recipient', 'name avatar isVerified');
        
        console.log('[SOCKET][MESSAGE] Message created in database');
        console.log('[SOCKET][MESSAGE] Message ID:', message._id);
        console.log('[SOCKET][MESSAGE] Checking recipient online status...');

        const roomClients = io.sockets.adapter.rooms.get(recipientId);
        const clientCount = roomClients ? roomClients.size : 0;
        
        console.log('[SOCKET][MESSAGE] Recipient ID:', recipientId);
        console.log('[SOCKET][MESSAGE] Connected clients:', clientCount);
        
        if (clientCount === 0) {
           console.log('[SOCKET][MESSAGE] ⚠️  Recipient is OFFLINE - triggering push notification');
           const sender = await User.findById(socket.userId).select('name');
           const title = sender ? sender.name : 'New Message';
           console.log('[SOCKET][MESSAGE] Sender name:', title);
           console.log('[SOCKET][MESSAGE] Message content:', content);
           console.log('[SOCKET][MESSAGE] Calling sendPushNotifications...');
           notificationService.sendPushNotifications(recipientId, title, content, { type: 'chat', senderId: socket.userId });
        } else {
           console.log('[SOCKET][MESSAGE] ✅ Recipient is ONLINE - push notification NOT needed');
        }

        // Emit to recipient
        io.to(recipientId).emit('receive_message', message);
        // Emit to sender for confirmation
        socket.emit('message_sent', message);
        console.log('[SOCKET][MESSAGE] ✅ Emitted message_sent to sender, receive_message to recipient');
      } catch (error) {
        console.error('[SOCKET][MESSAGE] ❌ Error in send_message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('[SOCKET] Disconnected:', socket.id);
    });

    socket.on('mark_delivered', async ({ messageId, senderId }) => {
      try {
        if (!messageId) return;
        console.log(`[Socket Debug] Mark Delivered: Msg=${messageId}, Sender=${senderId}`);

        // Update DB
        await messageService.markMessageAsDelivered(messageId);

        // Notify Sender (if online)
        io.to(senderId).emit('message_status_update', {
          messageId,
          status: 'delivered',
        });
      } catch (err) {
        console.error('[Socket Debug] mark_delivered error:', err);
      }
    });
  });
};

module.exports = registerChatHandlers;
