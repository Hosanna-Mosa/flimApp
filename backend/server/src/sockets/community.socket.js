const logger = require('../config/logger');

const registerCommunityHandlers = (io) => {
  io.on('connection', (socket) => {
    
    // Join a community room to receive updates
    socket.on('join_community', (communityId) => {
      if (!communityId) return;
      socket.join(`community_${communityId}`);
      logger.info(`Socket ${socket.userId} joined community_${communityId}`);
    });

    socket.on('leave_community', (communityId) => {
      if (!communityId) return;
      socket.leave(`community_${communityId}`);
    });

    // Join a specific group room
    socket.on('join_group', (groupId) => {
      if (!groupId) return;
      socket.join(`group_${groupId}`);
      logger.info(`Socket ${socket.userId} joined group_${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      if (!groupId) return;
      socket.leave(`group_${groupId}`);
    });
  });
};

module.exports = registerCommunityHandlers;
