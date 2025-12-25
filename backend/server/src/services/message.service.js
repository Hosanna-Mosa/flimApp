const mongoose = require('mongoose');
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

const deleteMessage = async (messageId, userId) =>
  Message.findOneAndDelete({ _id: messageId, sender: userId });

const getConversations = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return Message.aggregate([
    {
      $match: {
        $or: [{ sender: userObjectId }, { recipient: userObjectId }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userObjectId] },
            '$recipient',
            '$sender',
          ],
        },
        lastMessage: { $first: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'peer',
      },
    },
    { $unwind: '$peer' },
    {
      $project: {
        peer: { name: 1, avatar: 1, _id: 1, isVerified: 1 },
        lastMessage: { content: 1, createdAt: 1, sender: 1, recipient: 1 },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);
};

module.exports = { createMessage, getConversation, deleteMessage, getConversations };

