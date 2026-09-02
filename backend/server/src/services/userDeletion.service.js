const mongoose = require('mongoose');

const User = require('../models/User.model');
const Post = require('../models/Post.model');
const Comment = require('../models/Comment.model');
const Like = require('../models/Like.model');
const Share = require('../models/Share.model');
const Follow = require('../models/Follow.model');
const Message = require('../models/Message.model');
const Notification = require('../models/Notification.model');
const Wallet = require('../models/Wallet.model');
const Subscription = require('../models/Subscription.model');
const PaymentSession = require('../models/PaymentSession.model');
const Support = require('../models/Support.model');
const Report = require('../models/report.model');
const VerificationRequest = require('../models/VerificationRequest.model');
const VerificationLog = require('../models/VerificationLog.model');
const Community = require('../models/Community.model');
const CommunityMember = require('../models/CommunityMember.model');
const CommunityPost = require('../models/CommunityPost.model');
const MediaService = require('./media.service');
const logger = require('../config/logger');

/**
 * Permanently remove a user and everything belonging to them.
 *
 * There is no undo. The account is read once before anything is destroyed so
 * the audit entry can still say who this was, because after this runs there is
 * nothing left to look the name up from.
 *
 * Two categories are handled differently:
 *
 *   Owned    — posts, comments, likes, wallet, tickets. Deleted outright.
 *   Referenced — a community they founded, a notification naming them as the
 *                actor, another user's block list. The row belongs to someone
 *                else, so only the reference is removed; deleting the row would
 *                destroy a third party's data.
 *
 * Missing either category leaves the job half done: skip the first and personal
 * data survives, skip the second and the app is left with references pointing
 * at an account that no longer exists, which is how feeds start crashing.
 */
const deleteUserCompletely = async (userId, { deleteMedia = true } = {}) => {
  const id = new mongoose.Types.ObjectId(String(userId));

  const user = await User.findById(id).lean();
  if (!user) return null;

  const snapshot = {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    username: user.username,
    createdAt: user.createdAt,
  };

  const removed = {};
  const record = (key, result) => {
    removed[key] = result?.deletedCount ?? result?.modifiedCount ?? 0;
  };

  // ---- Cloudinary first -------------------------------------------------
  // Before the posts that name the assets are gone. A failure here must not
  // stop the deletion: the user asked to be removed from the platform, and
  // leaving their account in place because an image would not delete is the
  // wrong trade. Orphaned assets are reported back instead.
  let mediaDeleted = 0;
  let mediaFailed = 0;
  if (deleteMedia) {
    const assets = await Post.find({ author: id })
      .select('media.publicId type')
      .lean();
    for (const post of assets) {
      const publicId = post?.media?.publicId;
      if (!publicId) continue;
      try {
        await MediaService.deleteMedia(publicId, post.type === 'video' ? 'video' : 'image');
        mediaDeleted += 1;
      } catch {
        mediaFailed += 1;
      }
    }
  }

  // ---- Content owned by the user ---------------------------------------
  const postIds = (await Post.find({ author: id }).select('_id').lean()).map((p) => p._id);

  record('posts', await Post.deleteMany({ author: id }));
  // Other people's comments and likes on those posts go too, otherwise they
  // hang off a post that no longer exists.
  record('commentsOnTheirPosts', await Comment.deleteMany({ post: { $in: postIds } }));
  record('comments', await Comment.deleteMany({ user: id }));
  record('likes', await Like.deleteMany({ $or: [{ user: id }, { post: { $in: postIds } }] }));
  record('shares', await Share.deleteMany({ $or: [{ user: id }, { post: { $in: postIds } }] }));
  record('follows', await Follow.deleteMany({ $or: [{ follower: id }, { following: id }] }));
  record('messages', await Message.deleteMany({ $or: [{ sender: id }, { recipient: id }] }));
  record('notifications', await Notification.deleteMany({ $or: [{ user: id }, { actor: id }] }));

  // ---- Money and records ------------------------------------------------
  record('wallet', await Wallet.deleteMany({ user: id }));
  record('subscriptions', await Subscription.deleteMany({ user: id }));
  record('paymentSessions', await PaymentSession.deleteMany({ user: id }));

  // ---- Support, moderation, verification --------------------------------
  record('supportTickets', await Support.deleteMany({ userId: id }));
  record('reportsFiled', await Report.deleteMany({ reporterId: id }));
  record('reportsAgainstThem', await Report.deleteMany({ targetId: id, type: 'user' }));
  record('reportsOnTheirPosts', await Report.deleteMany({ targetId: { $in: postIds } }));
  record('verificationRequests', await VerificationRequest.deleteMany({ user: id }));
  record('verificationLogs', await VerificationLog.deleteMany({ userId: id }));

  // ---- Communities ------------------------------------------------------
  record('communityMemberships', await CommunityMember.deleteMany({ user: id }));
  record('communityPosts', await CommunityPost.deleteMany({ author: id }));

  // Communities they founded survive — other people are in them. Only the
  // dangling references are cleared.
  record(
    'communityRolesCleared',
    await Community.updateMany(
      { $or: [{ admins: id }, { moderators: id }, { members: id }, { pendingRequests: id }] },
      { $pull: { admins: id, moderators: id, members: id, pendingRequests: id } }
    )
  );
  record(
    'communityPostRefsCleared',
    await CommunityPost.updateMany(
      { $or: [{ likes: id }, { pinnedBy: id }, { deletedBy: id }] },
      { $pull: { likes: id }, $unset: { pinnedBy: '', deletedBy: '' } }
    )
  );
  record(
    'communityBanRefsCleared',
    await CommunityMember.updateMany({ bannedBy: id }, { $unset: { bannedBy: '' } })
  );

  // ---- References held by other users -----------------------------------
  record(
    'blockListsCleared',
    await User.updateMany({ blockedUsers: id }, { $pull: { blockedUsers: id } })
  );

  // ---- Finally the account ----------------------------------------------
  await User.deleteOne({ _id: id });

  const orphanedCommunities = await Community.countDocuments({ createdBy: id });

  logger.info(
    `[UserDeletion] Removed ${snapshot.email} (${snapshot._id}); ` +
      `${Object.values(removed).reduce((a, b) => a + b, 0)} related records`
  );

  return {
    user: snapshot,
    removed,
    media: { deleted: mediaDeleted, failed: mediaFailed },
    /** Communities they founded, now without a valid creator. */
    orphanedCommunities,
  };
};

module.exports = { deleteUserCompletely };
