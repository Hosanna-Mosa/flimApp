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
    const conversations = await messageService.getConversations(req.user.id);
    return success(res, conversations);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getConversation, deleteMessage, getConversations };

