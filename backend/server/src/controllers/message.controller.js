const messageService = require('../services/message.service');
const { success } = require('../utils/response');

const getConversation = async (req, res, next) => {
  try {
    const messages = await messageService.getConversation(req.user.id, req.params.userId);
    return success(res, messages);
  } catch (err) {
    return next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    await messageService.deleteMessage(req.params.id, req.user.id);
    return success(res, { message: 'Message deleted' });
  } catch (err) {
    return next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await messageService.getConversations(req.user.id, req.query.q);
    return success(res, conversations);
  } catch (err) {
    return next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await messageService.getUnreadCount(req.user.id);
    return success(res, { count });
  } catch (err) {
    return next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    console.log(`[MessageController] markAsRead called. User=${req.user.id}, TargetSender=${req.params.userId}`);
    // Current user is reading messages FROM req.params.userId (sender)
    await messageService.markConversationAsRead(req.user.id, req.params.userId);

    // Notify the SENDER that their messages have been read
    const io = req.app.get('io');
    if (io) {
      // We emit to the SENDER's room (senderId)
      // Status 'read' implies all previous messages are read
      io.to(req.params.userId).emit('message_status_update', {
        userId: req.user.id, // The person who read the message (Me)
        status: 'read'
      });
    }

    return success(res, { success: true });
  } catch (err) {
    console.error('[MessageController] markAsRead Error:', err);
    return next(err);
  }
};

module.exports = { getConversation, deleteMessage, getConversations, getUnreadCount, markAsRead };

