const { httpError } = require('../utils/httpError');
const User = require('../models/User.model');
const Post = require('../models/Post.model');
const Comment = require('../models/Comment.model');
const Like = require('../models/Like.model');
const Share = require('../models/Share.model');
const Message = require('../models/Message.model');
const Notification = require('../models/Notification.model');
const Community = require('../models/Community.model');
const CommunityMember = require('../models/CommunityMember.model');
const CommunityPost = require('../models/CommunityPost.model');
const VerificationRequest = require('../models/VerificationRequest.model');
const Follow = require('../models/Follow.model');
const Wallet = require('../models/Wallet.model');

const BOOST_PLAN_DETAILS = {
  BASIC_BOOST: { price: 299, days: 1, label: 'Standard Boost' },
  PRO_BOOST: { price: 799, days: 3, label: 'Pro Boost' },
  ULTRA_BOOST: { price: 1499, days: 7, label: 'Ultra Boost' },
};

const getMe = async (userId) => User.findById(userId).select('-password -refreshTokens');

// Fields a user is permitted to change on their own profile.
// Anything outside this list (walletBalance, isVerified, status, boostedUntil,
// verifiedUntil, refreshTokens, ...) is dropped before it reaches the database.
const SELF_EDITABLE_FIELDS = [
  'name',
  'username',
  'email',
  'phone',
  'avatar',
  'bio',
  'roles',
  'industries',
  'language',
  'experience',
  'location',
  'portfolio',
  'accountType',
  'privacy',
];

const pickSelfEditable = (payload = {}) =>
  SELF_EDITABLE_FIELDS.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) acc[key] = payload[key];
    return acc;
  }, {});

const updateMe = async (userId, rawPayload) => {
  // Strip privileged fields. The validate middleware runs Joi with
  // { allowUnknown: true }, so unknown keys survive validation and would
  // otherwise be written straight through by findByIdAndUpdate.
  const payload = pickSelfEditable(rawPayload);
  // Check for duplicate email if email is being updated
  if (payload.email) {
    const existingUser = await User.findOne({
      email: payload.email.toLowerCase(),
      _id: { $ne: userId }
    });
    if (existingUser) {
      const err = new Error('Email already in use');
      err.status = 409;
      throw err;
    }
  }

  // Check for duplicate phone if phone is being updated
  if (payload.phone) {
    const existingUser = await User.findOne({
      phone: payload.phone,
      _id: { $ne: userId }
    });
    if (existingUser) {
      const err = new Error('Phone number already in use');
      err.status = 409;
      throw err;
    }
  }

  // Handle empty username (don't update if empty string)
  if (payload.username === '') {
    delete payload.username;
  }

  // Check for duplicate username if username is being updated
  if (payload.username) {
    const existingUser = await User.findOne({
      username: payload.username.trim(),
      _id: { $ne: userId }
    });
    if (existingUser) {
      const err = new Error('Username already in use');
      err.status = 409;
      throw err;
    }
  }

  // Normalize email to lowercase
  if (payload.email) {
    payload.email = payload.email.toLowerCase().trim();
  }

  if (payload.privacy) {
    const currentUser = await User.findById(userId).select('privacy');
    if (currentUser) {
      payload.privacy = {
        ...(currentUser.privacy ? currentUser.privacy.toObject() : {}),
        ...payload.privacy,
      };
    }
  }

  return User.findByIdAndUpdate(userId, payload, { new: true }).select(
    '-password -refreshTokens'
  );
};

const getById = async (id, viewerId = null) => {
  const user = await User.findById(id).select('-password -refreshTokens').lean();

  if (!user) {
    return null;
  }

  // Mutual block check
  if (viewerId) {
    // 1. Check if viewer is blocked by the target user
    const targetUser = await User.findById(id).select('blockedUsers');
    if (targetUser && targetUser.blockedUsers && targetUser.blockedUsers.includes(viewerId)) {
      return null; // Target has blocked the viewer
    }
  }

  // If viewer is the owner, return all data
  if (viewerId && viewerId.toString() === id.toString()) {
    return user;
  }

  // Check if account is private
  const isPrivateAccount = user.accountType === 'private';

  // If private account, check if viewer is following
  if (isPrivateAccount && viewerId) {
    const isFollowing = await Follow.findOne({
      follower: viewerId,
      following: id,
      status: 'accepted',
    });

    // If not following, return limited data (but include stats like Instagram/Twitter)
    if (!isFollowing) {
      return {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        accountType: user.accountType,
        isVerified: user.isVerified,
        // Always show stats (like Instagram, Twitter, etc.)
        stats: user.stats || {
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
        },
        // Don't return: bio, roles, industries, location, experience, etc.
      };
    }
  }

  // Public account or viewer is following private account - return full data
  return user;
};

const search = async ({ q, roles, industries }, currentUserId) => {

  // If no search query and no filters, return empty
  if (!q && (!roles || roles.length === 0) && (!industries || industries.length === 0)) {
    return [];
  }

  // Get IDs of users who have blocked current user OR are blocked by current user
  const currentUser = await User.findById(currentUserId).select('blockedUsers');
  const blockedByMe = currentUser ? currentUser.blockedUsers || [] : [];
  
  // Find users who have blocked current user
  const blockedMeResults = await User.find({ blockedUsers: currentUserId }).select('_id');
  const blockedMe = blockedMeResults.map(u => u._id);

  const excludeIds = [...new Set([...blockedByMe, ...blockedMe, currentUserId])];

  let query = {
    _id: { $nin: excludeIds } // Exclude blocked users and current user
  };
  let hasFilters = false;

  // Build filter query for roles and industries (these are AND conditions)
  if (roles) {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    if (rolesArray.length > 0) {
      query.roles = { $in: rolesArray };
      hasFilters = true;
    }
  }

  if (industries) {
    const industriesArray = Array.isArray(industries) ? industries : [industries];
    if (industriesArray.length > 0) {
      query.industries = { $in: industriesArray };
      hasFilters = true;
    }
  }

  // If there's a text query, add OR search across multiple fields
  if (q) {
    // If we have filters, we need to combine them with the text search
    // Filters are AND, text search is OR within the filtered results
    const textSearchConditions = [
      { name: { $regex: q, $options: 'i' } },
      { username: { $regex: q, $options: 'i' } },
      { roles: { $regex: q, $options: 'i' } },
      { industries: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
    ];

    if (hasFilters) {
      // Combine filters (AND) with text search (OR)
      query = {
        ...query,
        $or: textSearchConditions
      };
    } else {
      // Only text search, no filters
      query.$or = textSearchConditions;
    }
  }

  const results = await User.find(query).select('name username avatar roles industries location bio isVerified isOnline');

  // Score and sort results by relevance
  if (results.length > 0) {
    const searchLower = q ? q.toLowerCase() : '';

    const scoredResults = results.map(user => {
      let score = 0;
      const userObj = user.toObject();

      // If text query exists, apply text-based scoring
      if (q && searchLower) {
        // Priority 1: Name match (highest score)
        if (userObj.name && userObj.name.toLowerCase().includes(searchLower)) {
          // Exact match gets highest score
          if (userObj.name.toLowerCase() === searchLower) {
            score += 1000;
          }
          // Starts with query gets high score
          else if (userObj.name.toLowerCase().startsWith(searchLower)) {
            score += 500;
          }
          // Contains query gets medium score
          else {
            score += 300;
          }
        }

        // Priority 2: Roles match
        if (userObj.roles && Array.isArray(userObj.roles)) {
          userObj.roles.forEach(role => {
            if (role.toLowerCase().includes(searchLower)) {
              score += 200;
            }
          });
        }

        // Priority 3: Industries match
        if (userObj.industries && Array.isArray(userObj.industries)) {
          userObj.industries.forEach(industry => {
            if (industry.toLowerCase().includes(searchLower)) {
              score += 100;
            }
          });
        }

        // Priority 4: Bio match (lowest score)
        if (userObj.bio && userObj.bio.toLowerCase().includes(searchLower)) {
          score += 50;
        }
      }

      // Boost score for users matching the selected filters
      // This ensures filtered users appear prominently even without text query
      if (roles) {
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        if (userObj.roles && Array.isArray(userObj.roles)) {
          rolesArray.forEach(filterRole => {
            if (userObj.roles.some(r => r.toLowerCase() === filterRole.toLowerCase())) {
              score += 150; // Boost for exact filter match
            }
          });
        }
      }

      if (industries) {
        const industriesArray = Array.isArray(industries) ? industries : [industries];
        if (userObj.industries && Array.isArray(userObj.industries)) {
          industriesArray.forEach(filterIndustry => {
            if (userObj.industries.some(i => i.toLowerCase() === filterIndustry.toLowerCase())) {
              score += 75; // Boost for exact filter match
            }
          });
        }
      }

      return { ...userObj, _relevanceScore: score };
    });

    // Sort by relevance score (highest first)
    scoredResults.sort((a, b) => b._relevanceScore - a._relevanceScore);


    return scoredResults;
  }

  return results;
};

const boostProfile = async (userId, planId) => {
  const plan = BOOST_PLAN_DETAILS[planId];
  if (!plan) throw httpError(400, 'Invalid boost plan selected');

  // 1. Atomic balance deduction to prevent race conditions
  const updatedUser = await User.findOneAndUpdate(
    { 
      _id: userId, 
      walletBalance: { $gte: plan.price } 
    },
    { 
      $inc: { walletBalance: -plan.price }
    },
    { new: true }
  );

  if (!updatedUser) {
    // If update failed, check if it was due to balance or missing user
    const checkUser = await User.findById(userId);
    if (!checkUser) throw httpError(404, 'User not found');
    
    const err = new Error('Insufficient wallet balance. Please add funds to your vault.');
    err.status = 402;
    throw err;
  }

  // 2. Calculate expiration (EXTEND if already active)
  const now = new Date();
  const baseDate = (updatedUser.boostedUntil && updatedUser.boostedUntil > now)
    ? updatedUser.boostedUntil
    : now;

  const newBoostedUntil = new Date(baseDate.getTime());
  newBoostedUntil.setDate(newBoostedUntil.getDate() + plan.days);

  updatedUser.isBoosted = true;
  updatedUser.boostedUntil = newBoostedUntil;
  updatedUser.isBoostExpiringNotified = false;
  
  // 3. Sync with Wallet model and record transaction
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = new Wallet({ user: userId, balance: updatedUser.walletBalance });
  } else {
    wallet.balance = updatedUser.walletBalance;
  }

  wallet.transactions.push({
    type: 'debit',
    amount: plan.price,
    description: `Profile Boost: ${plan.label} (${plan.days} days)${baseDate > now ? ' - Extension' : ''}`,
    reference: `boost_${Date.now()}`
  });

  await Promise.all([
    updatedUser.save(),
    wallet.save()
  ]);

  return updatedUser;
};


/**
 * Permanently deletes a user and the content that belongs to them.
 *
 * There is no transaction here (the deployment is a standalone mongod), so the
 * order matters: counters on OTHER users' documents are corrected first, then
 * the owned rows are removed, and the user document goes last. If a later step
 * fails, the account still exists and the operation can be retried safely —
 * every step is idempotent.
 */
const deleteAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  // --- Follow graph: fix the other side's counters before dropping the edges.
  const [following, followers] = await Promise.all([
    Follow.find({ follower: userId }).select('following').lean(),
    Follow.find({ following: userId }).select('follower').lean(),
  ]);

  if (following.length) {
    await User.updateMany(
      { _id: { $in: following.map((f) => f.following) } },
      { $inc: { 'stats.followersCount': -1 } }
    );
  }
  if (followers.length) {
    await User.updateMany(
      { _id: { $in: followers.map((f) => f.follower) } },
      { $inc: { 'stats.followingCount': -1 } }
    );
  }
  await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });

  // --- Engagement this user left on OTHER people's posts: decrement, then delete.
  const [likes, comments, shares] = await Promise.all([
    Like.find({ user: userId }).select('post').lean(),
    Comment.find({ user: userId }).select('post parentComment').lean(),
    Share.find({ user: userId }).select('post').lean(),
  ]);

  for (const like of likes) {
    await Post.updateOne({ _id: like.post }, { $inc: { 'engagement.likesCount': -1 } });
  }
  for (const comment of comments) {
    await Post.updateOne({ _id: comment.post }, { $inc: { 'engagement.commentsCount': -1 } });
    if (comment.parentComment) {
      await Comment.updateOne({ _id: comment.parentComment }, { $inc: { repliesCount: -1 } });
    }
  }
  for (const share of shares) {
    await Post.updateOne({ _id: share.post }, { $inc: { 'engagement.sharesCount': -1 } });
  }

  await Promise.all([
    Like.deleteMany({ user: userId }),
    Comment.deleteMany({ user: userId }),
    Share.deleteMany({ user: userId }),
  ]);

  // --- The user's own posts, plus everything hanging off them.
  const ownPosts = await Post.find({ author: userId }).select('_id').lean();
  const ownPostIds = ownPosts.map((p) => p._id);
  if (ownPostIds.length) {
    await Promise.all([
      Like.deleteMany({ post: { $in: ownPostIds } }),
      Comment.deleteMany({ post: { $in: ownPostIds } }),
      Share.deleteMany({ post: { $in: ownPostIds } }),
    ]);
    await Post.deleteMany({ _id: { $in: ownPostIds } });
  }

  // --- Community memberships: keep memberCount honest.
  const memberships = await CommunityMember.find({ user: userId }).select('community').lean();
  if (memberships.length) {
    await Community.updateMany(
      { _id: { $in: memberships.map((m) => m.community) } },
      { $inc: { memberCount: -1 } }
    );
    await CommunityMember.deleteMany({ user: userId });
  }

  // --- Everything else keyed to this user.
  await Promise.all([
    CommunityPost.deleteMany({ author: userId }),
    Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
    Notification.deleteMany({ $or: [{ user: userId }, { actor: userId }] }),
    VerificationRequest.deleteMany({ user: userId }),
    Wallet.deleteMany({ user: userId }),
  ]);

  // Blocked-user references held by other accounts.
  await User.updateMany({ blockedUsers: userId }, { $pull: { blockedUsers: userId } });

  await User.deleteOne({ _id: userId });

  return { deleted: true };
};

module.exports = { getMe, updateMe, getById, search, boostProfile, deleteAccount };

