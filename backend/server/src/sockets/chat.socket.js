const jwt = require('jsonwebtoken');
const messageService = require('../services/message.service');
const queueService = require('../services/queue.service');
const logger = require('../config/logger');

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
    socket.join(socket.userId);
    logger.info(`[Socket Debug] Socket connected: ${socket.userId}, SocketID: ${socket.id}`);
    console.log(`[Socket Debug] User ${socket.userId} joined room ${socket.userId}`);

    socket.on('send_message', async ({ to, content }) => {
      try {
        console.log(`[Socket Debug] Raw send_message payload: to='${to}', content='${content}'`);

        if (!to || !content) {
          console.log('[Socket Debug] Missing to or content');
          return;
        }

        const recipientId = to.trim();

        const message = await messageService.createMessage({
          senderId: socket.userId,
          recipientId: recipientId,
          content,
        });

        // Message Persisted
        console.log(`[Socket Debug] Message Persisted: ID=${message._id}, Recipient=${message.recipient}`);
        // Notification logic removed as per user request (no notifications for messages)

        const roomClients = io.sockets.adapter.rooms.get(recipientId);
        const clientCount = roomClients ? roomClients.size : 0;
        console.log(`[Socket Debug] Emitting receive_message to room ${recipientId}. Active clients: ${clientCount}`);

        if (clientCount === 0) {
          console.log(`[Socket Warning] Recipient ${recipientId} is NOT connected to the socket room. They will NOT receive the real-time event.`);
        }

        io.to(recipientId).emit('receive_message', message);
        socket.emit('message_sent', message);
      } catch (error) {
        console.error('[Socket Debug] CRITICAL ERROR in send_message handler:', error);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
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
