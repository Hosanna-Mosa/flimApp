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

module.exports = { getConversation };

