const mongoose = require('mongoose');
const Message = require('../models/Message.model');
const { encryptMessage, decryptMessage } = require('../utils/messageCrypto');

const createMessage = async ({ senderId, recipientId, content }) => {
  const message = await Message.create({
    sender: senderId,
    recipient: recipientId,
    content: encryptMessage(content),
    isRead: false
  });

  // Return decrypted content to callers without mutating DB storage.
  if (message && message.content) {
    message.content = decryptMessage(message.content);
  }

  return message;
};

const getConversation = async (userId, peerId) => {
  // Convert to ObjectId to ensure proper matching
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;
  const peerObjectId = mongoose.Types.ObjectId.isValid(peerId) 
    ? new mongoose.Types.ObjectId(peerId) 
    : peerId;
  
  console.log(`[MessageService] getConversation: userId=${userObjectId}, peerId=${peerObjectId}`);
  
  const messages = await Message.find({
    $or: [
      { sender: userObjectId, recipient: peerObjectId },
      { sender: peerObjectId, recipient: userObjectId },
    ],
  })
    .populate('sender', 'name avatar isVerified')
    .populate('recipient', 'name avatar isVerified')
    .sort({ createdAt: 1 });
  
  console.log(`[MessageService] Found ${messages.length} messages`);

  for (const message of messages) {
    if (message && message.content) {
      message.content = decryptMessage(message.content);
    }
  }

  return messages;
};

const deleteMessage = async (messageId, userId) =>
  Message.findOneAndDelete({ _id: messageId, sender: userId });

const getConversations = async (userId, searchQuery = '') => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
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
        peer: { name: 1, avatar: 1, _id: 1, isVerified: 1 },
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
  console.log(`[MessageService] Marking Read: Recipient(Me)=${userId}, Sender(Them)=${senderId}`);
  const result = await Message.updateMany(
    { recipient: userId, sender: senderId, isRead: { $ne: true } },
    { isRead: true, readAt: new Date(), status: 'read' }
  );
  console.log(`[MessageService] Mark Read Result: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
  return result;
};

const markMessageAsDelivered = async (messageId) => {
  return Message.findByIdAndUpdate(
    messageId,
    { status: 'delivered' },
    { new: true }
  );
};

const countMessagesBetween = async (user1, user2) => {
  try {
    console.log(`[MessageService] Counting messages between: '${user1}' and '${user2}'`);
    const u1 = new mongoose.Types.ObjectId(user1);
    const u2 = new mongoose.Types.ObjectId(user2);

    const count = await Message.countDocuments({
      $or: [
        { sender: u1, recipient: u2 },
        { sender: u2, recipient: u1 },
      ],
    });
    console.log(`[MessageService] Count Result: ${count}`);
    return count;
  } catch (e) {
    console.error('[MessageService] countMessagesBetween Error:', e);
    return 0; // This fallback to 0 is DANGEROUS if it's an error, as it triggers notification!
  }
};

module.exports = {
  createMessage,
  getConversation,
  deleteMessage,
  getConversations,
  getUnreadCount,
  markConversationAsRead,
  countMessagesBetween,
  markMessageAsDelivered
};

