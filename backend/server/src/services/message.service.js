const mongoose = require('mongoose');
const Message = require('../models/Message.model');
const User = require('../models/User.model');
const { encryptMessage, decryptMessage } = require('../utils/messageCrypto');

const ensureMessagingAllowed = async (userId, peerId) => {
  const [user, peer] = await Promise.all([
    User.findById(userId).select('blockedUsers'),
    User.findById(peerId).select('blockedUsers'),
  ]);

  const blockedByUser = (user?.blockedUsers || []).some(
    (blockedId) => blockedId.toString() === peerId.toString()
  );
  const blockedByPeer = (peer?.blockedUsers || []).some(
    (blockedId) => blockedId.toString() === userId.toString()
  );

  if (blockedByUser || blockedByPeer) {
    const err = new Error('Messaging is not allowed because one user has blocked the other');
    err.status = 403;
    throw err;
  }
};

const createMessage = async ({ senderId, recipientId, content, media }) => {
  await ensureMessagingAllowed(senderId, recipientId);

  const text = content || '';
  if (!text.trim() && !media?.url) {
    const err = new Error('A message needs text, an attachment, or both');
    err.status = 400;
    throw err;
  }

  const message = await Message.create({
    sender: senderId,
    recipient: recipientId,
    // Only encrypt when there is something to encrypt: encrypting the empty
    // string of a photo-only message produces a ciphertext that decrypts back
    // to '' and makes every caption-less message look corrupted in the logs.
    content: text ? encryptMessage(text) : '',
    media: media?.url ? media : undefined,
    isRead: false
  });

  // Return decrypted content to callers without mutating DB storage.
  if (message && message.content) {
    message.content = decryptMessage(message.content);
  }

  return message;
};

const getConversation = async (userId, peerId) => {
  await ensureMessagingAllowed(userId, peerId);

  // Convert to ObjectId to ensure proper matching
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;
  const peerObjectId = mongoose.Types.ObjectId.isValid(peerId) 
    ? new mongoose.Types.ObjectId(peerId) 
    : peerId;
  
  
  const messages = await Message.find({
    $or: [
      { sender: userObjectId, recipient: peerObjectId },
      { sender: peerObjectId, recipient: userObjectId },
    ],
  })
    .populate('sender', 'name avatar isBadgeVerified')
    .populate('recipient', 'name avatar isBadgeVerified')
    .sort({ createdAt: 1 });
  

  for (const message of messages) {
    if (message && message.content) {
      message.content = decryptMessage(message.content);
    }
  }

  return messages;
};

const deleteMessage = async (messageId, userId) => {
  const message = await Message.findOneAndDelete({ _id: messageId, sender: userId });

  // Remove the file too. Cloudinary charges for stored bytes whether or not
  // anything still points at them, so a deleted message that leaves its media
  // behind is a bill with no way to find what it is for.
  if (message?.media?.publicId) {
    try {
      const MediaService = require('./media.service');
      await MediaService.deleteMedia(
        message.media.publicId,
        message.media.type === 'video' ? 'video' : 'image'
      );
    } catch (err) {
      // The message is already gone; failing the request now would tell the
      // user their delete failed when it did not.
      console.error('[Messages] Deleted message but could not remove its media:', err.message);
    }
  }

  return message;
};

const getConversations = async (userId, searchQuery = '') => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const currentUser = await User.findById(userId).select('blockedUsers');
  const blockedByMe = currentUser ? currentUser.blockedUsers || [] : [];
  const blockedMeResults = await User.find({ blockedUsers: userObjectId }).select('_id');
  const blockedMe = blockedMeResults.map((u) => u._id);
  const excludedPeerIds = [...new Set([...blockedByMe, ...blockedMe])];

  const conversations = await Message.aggregate([
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
    ...(excludedPeerIds.length > 0
      ? [{ $match: { _id: { $nin: excludedPeerIds } } }]
      : []),
    {
      $lookup: {
        from: 'messages',
        let: { peerId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$sender', '$$peerId'] },
                  { $eq: ['$recipient', userObjectId] },
                  { $ne: ['$isRead', true] },
                ],
              },
            },
          },
          { $count: 'count' },
        ],
        as: 'unreadInfo',
      },
    },
    {
      $project: {
        peer: { name: 1, avatar: 1, _id: 1, isBadgeVerified: 1 },
        lastMessage: { content: 1, createdAt: 1, sender: 1, recipient: 1 },
        unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadInfo.count', 0] }, 0] },
      },
    },
    {
      $match: searchQuery
        ? { 'peer.name': { $regex: searchQuery, $options: 'i' } }
        : {},
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);

  for (const convo of conversations) {
    if (convo?.lastMessage?.content) {
      convo.lastMessage.content = decryptMessage(convo.lastMessage.content);
    }
  }

  return conversations;
};

const getUnreadCount = async (userId) => {
  try {
    const uid = new mongoose.Types.ObjectId(userId);

    // Use $ne: true to count documents where isRead is false, null, or missing
    return await Message.countDocuments({ recipient: uid, isRead: { $ne: true } });
  } catch (e) {
    console.error('getUnreadCount Error:', e);
    return 0;
  }
};

const markConversationAsRead = async (userId, senderId) => {
  const result = await Message.updateMany(
    { recipient: userId, sender: senderId, isRead: { $ne: true } },
    { isRead: true, readAt: new Date(), status: 'read' }
  );
  return result;
};

const markMessageAsDelivered = async (messageId) => {
  return Message.findByIdAndUpdate(
    messageId,
    { status: 'delivered' },
    { new: true }
  );
};

module.exports = {
  createMessage,
  getConversation,
  deleteMessage,
  getConversations,
  getUnreadCount,
  markConversationAsRead,
  markMessageAsDelivered
};

