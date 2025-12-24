const Message = require('../models/Message.model');

const createMessage = async ({ senderId, recipientId, content }) =>
  Message.create({ sender: senderId, recipient: recipientId, content });

const getConversation = async (userId, peerId) =>
  Message.find({
    $or: [
      { sender: userId, recipient: peerId },
      { sender: peerId, recipient: userId },
    ],
  }).sort({ createdAt: 1 });

module.exports = { createMessage, getConversation };

