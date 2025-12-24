const jwt = require('jsonwebtoken');
const messageService = require('../services/message.service');
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
    logger.info(`Socket connected: ${socket.userId}`);

    socket.on('send_message', async ({ to, content }) => {
      if (!to || !content) return;
      const message = await messageService.createMessage({
        senderId: socket.userId,
        recipientId: to,
        content,
      });
      io.to(to).emit('receive_message', message);
      socket.emit('message_sent', message);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
    });
  });
};

module.exports = registerChatHandlers;

