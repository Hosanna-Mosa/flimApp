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

    // Existing middleware sets socket.userId and joins room automatically,
    // but we add this listener per user request for debug logging flow.
    socket.on('join', (userId) => {
      socket.join(userId.toString());
    });

    // Auto-join from middleware (keeping logic, just logging)
    if (socket.userId) {
        socket.join(socket.userId);
    }

    socket.on('send_message', async (data) => {
      const { to, content } = data;

      try {
        if (!to || !content) {
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
        

        const roomClients = io.sockets.adapter.rooms.get(recipientId);
        const clientCount = roomClients ? roomClients.size : 0;
        
        
        if (clientCount === 0) {
           const sender = await User.findById(socket.userId).select('name');
           const title = sender ? sender.name : 'New Message';
           notificationService.sendPushNotifications(recipientId, title, content, { type: 'chat', senderId: socket.userId });
        } else {
        }

        // Emit to recipient
        io.to(recipientId).emit('receive_message', message);
        // Emit to sender for confirmation
        socket.emit('message_sent', message);
      } catch (error) {
        console.error('[SOCKET][MESSAGE] ❌ Error in send_message:', error);
        socket.emit('message_error', {
          message: error?.message || 'Failed to send message',
        });
      }
    });

    socket.on('disconnect', () => {
    });

    socket.on('mark_delivered', async ({ messageId, senderId }) => {
      try {
        if (!messageId) return;

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
