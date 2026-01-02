const User = require('../models/User.model');
const Post = require('../models/Post.model');
const feedService = require('../services/feed.service');
const { success } = require('../utils/response');

/**
 * Toggle Save Post
 * POST /posts/:postId/save
 */
const toggleSavePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error('Post not found');
      err.status = 404;
      throw err;
    }

    const user = await User.findById(userId);
    const isSaved = user.savedPosts.includes(postId);

    let updatedUser;
    if (isSaved) {
      // Unsave
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { savedPosts: postId } },
        { new: true }
      );
    } else {
      // Save
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { savedPosts: postId } },
        { new: true }
      );
    }

    return success(res, { 
      saved: !isSaved,
      savedPostsCount: updatedUser.savedPosts.length 
    }, 200, isSaved ? 'Post unsaved' : 'Post saved');
  } catch (err) {
    next(err);
  }
};

/**
 * Get Saved Posts
 * GET /users/me/saved
 */
const getSavedPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(userId)
      .populate({
        path: 'savedPosts',
        options: {
          sort: { createdAt: -1 },
          skip: page * limit,
          limit: limit
        },
        populate: {
          path: 'author',
          select: 'name avatar isVerified roles'
        }
      });

    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    // Filter out any null posts in case a saved post was deleted
    let posts = user.savedPosts.filter(post => post !== null).map(p => p.toObject ? p.toObject() : p);

    // Enrich with isLiked, isSaved, etc.
    posts = await feedService.enrichPosts(posts, userId);

    return success(res, {
      data: posts,
      page,
      limit
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  toggleSavePost,
  getSavedPosts
};
