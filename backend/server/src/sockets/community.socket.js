const logger = require('../config/logger');
const CommunityMember = require('../models/CommunityMember.model');

/**
 * Verify the socket's user is actually a member of the community before
 * letting them into its room. Without this check any authenticated user could
 * join `community_<id>` / `group_<id>` and receive every realtime message
 * broadcast to a private community they were never admitted to.
 */
const isCommunityMember = async (userId, communityId) => {
  if (!userId || !communityId) return false;
  try {
    const membership = await CommunityMember.findOne({
      user: userId,
      community: communityId,
    });
    return Boolean(membership);
  } catch (err) {
    logger.warn(`Community membership check failed: ${err.message}`);
    return false;
  }
};

const registerCommunityHandlers = (io) => {
  io.on('connection', (socket) => {

    // Join a community room to receive updates
    socket.on('join_community', async (communityId) => {
      if (!communityId) return;
      if (!(await isCommunityMember(socket.userId, communityId))) {
        logger.warn(
          `Socket ${socket.userId} denied join for community_${communityId}`
        );
        return socket.emit('community_error', { message: 'Not a member of this community' });
      }
      socket.join(`community_${communityId}`);
      logger.info(`Socket ${socket.userId} joined community_${communityId}`);
    });

    socket.on('leave_community', (communityId) => {
      if (!communityId) return;
      socket.leave(`community_${communityId}`);
    });

    // Join a specific group room
    socket.on('join_group', async ({ groupId, communityId } = {}) => {
      if (!groupId || !communityId) return;
      if (!(await isCommunityMember(socket.userId, communityId))) {
        logger.warn(`Socket ${socket.userId} denied join for group_${groupId}`);
        return socket.emit('community_error', { message: 'Not a member of this community' });
      }
      socket.join(`group_${groupId}`);
      logger.info(`Socket ${socket.userId} joined group_${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      const id = typeof groupId === 'object' && groupId ? groupId.groupId : groupId;
      if (!id) return;
      socket.leave(`group_${id}`);
    });
  });
};

module.exports = registerCommunityHandlers;
