const Post = require('../models/Post.model');
const User = require('../models/User.model');
const feedService = require('./feed.service');
const MediaService = require('./media.service');

/**
 * Create a new post
 * @param {string} authorId - User ID
 * @param {Object} payload - Post data
 * @returns {Promise<Post>} Created post
 */
const createPost = async (authorId, payload) => {
  // Extract fields from payload root or payload.media (robustness)
  const { type, caption, industries, roles, mediaUrl, thumbnail } = payload;
  
  // Helper to get from root or media object
  const getField = (key) => payload[key] || payload.media?.[key];

  const duration = getField('duration');
  const format = getField('format');
  const size = getField('size');
  const width = getField('width');
  const height = getField('height');
  const pages = getField('pages');
  const publicId = getField('publicId') || MediaService.extractPublicId(mediaUrl);

  // Validate media metadata
  if (mediaUrl) {
    MediaService.validateMediaMetadata({ url: mediaUrl, format, size }, type);
  }

  // Generate thumbnail for videos if not provided
  let thumbnailUrl = thumbnail;
  if (type === 'video' && !thumbnailUrl && mediaUrl) {
    thumbnailUrl = MediaService.generateVideoThumbnail(mediaUrl);
  }

  // Create post with new media structure
  const post = await Post.create({
    author: authorId,
    type,
    media: {
      url: mediaUrl,
      thumbnail: thumbnailUrl,
      duration,
      format,
      size,
      width,
      height,
      pages,
      publicId,
    },
    // Backward compatibility
    mediaUrl,
    thumbnailUrl,
    caption,
    industries: industries || [],
    roles: roles || [],
  });

  // Calculate initial score
  post.calculateScore();
  await post.save();

  // Increment user post count
  await User.findByIdAndUpdate(authorId, { $inc: { 'stats.postsCount': 1 } });

  return post;
};

/**
 * Delete a post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Post>} Deleted post
 */
const deletePost = async (postId, userId) => {
  const post = await Post.findOne({ _id: postId, author: userId });
  
  if (!post) {
    throw new Error('Post not found or unauthorized');
  }

  // Delete media from Cloudinary
  if (post.media?.publicId) {
    try {
      const resourceType = post.type === 'video' ? 'video' : post.type === 'audio' ? 'video' : 'image';
      await MediaService.deleteMedia(post.media.publicId, resourceType);
    } catch (error) {
      console.error('Error deleting media from Cloudinary:', error);
      // Continue with post deletion even if Cloudinary deletion fails
    }
  }

  await Post.findByIdAndDelete(postId);

  // Decrement user post count
  await User.findByIdAndUpdate(userId, { $inc: { 'stats.postsCount': -1 } });

  return post;
};

/**
 * Get user's posts
 * @param {string} userId - User ID
 * @returns {Promise<Post[]>} User's posts
 */
const getUserPosts = async (userId) => {
  return Post.find({ author: userId, isActive: true })
    .sort({ createdAt: -1 })
    .populate('author', 'name avatar isVerified roles');
};

/**
 * Get trending posts
 * @returns {Promise<Post[]>} Trending posts
 */
const getTrending = async () => feedService.getTrending();

/**
 * Get personalized feed
 * @param {Object} user - User object
 * @returns {Promise<Post[]>} Feed posts
 */
const getFeed = async (user) => feedService.getPersonalizedFeed(user);

/**
 * Get post by ID
 * @param {string} postId - Post ID
 * @param {string} userId - Current user ID (optional)
 * @returns {Promise<Post>} Post with isLiked status
 */
const getPostById = async (postId, userId = null) => {
  const post = await Post.findById(postId)
    .populate('author', 'name avatar isVerified roles bio stats')
    .lean();
  
  if (!post) {
    return null;
  }
  
  // Check if user has liked this post
  if (userId) {
    const Like = require('../models/Like.model');
    const like = await Like.findOne({ 
      user: userId, 
      post: postId
      // Note: Like model doesn't have isActive field
    });
    post.isLiked = !!like;
    console.log(`[PostService] getPostById - userId: ${userId}, postId: ${postId}, isLiked: ${post.isLiked}, likeFound: ${!!like}`);
  } else {
    post.isLiked = false;
    console.log(`[PostService] getPostById - No userId provided, setting isLiked to false`);
  }
  
  return post;
};

/**
 * Update post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} updates - Update data
 * @returns {Promise<Post>} Updated post
 */
const updatePost = async (postId, userId, updates) => {
  const post = await Post.findOne({ _id: postId, author: userId });
  
  if (!post) {
    throw new Error('Post not found or unauthorized');
  }

  // Only allow updating caption, industries, roles, visibility
  const allowedUpdates = ['caption', 'industries', 'roles', 'visibility'];
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      post[key] = updates[key];
    }
  });

  await post.save();
  return post;
};

module.exports = { 
  createPost, 
  deletePost, 
  getUserPosts, 
  getTrending, 
  getFeed, 
  getPostById,
  updatePost 
};
