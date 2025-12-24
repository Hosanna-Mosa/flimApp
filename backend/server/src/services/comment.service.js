const Comment = require('../models/Comment.model');
const Post = require('../models/Post.model');
const User = require('../models/User.model');
const cacheService = require('./cache.service');
const queueService = require('./queue.service');
const logger = require('../config/logger');

/**
 * Comment Service - Handles all comment operations
 * Supports nested comments (replies)
 */
class CommentService {
  /**
   * Add a comment to a post
   * @param {Object} data - Comment data
   * @returns {Promise<Object>} Created comment
   */
  async addComment(data) {
    try {
      const { userId, postId, content, parentCommentId = null } = data;

      // Validate post exists
      const post = await Post.findById(postId).select('author privacy');
      if (!post) {
        return { success: false, message: 'Post not found' };
      }

      // Check if comments are allowed
      const postAuthor = await User.findById(post.author).select('privacy');
      if (postAuthor && !postAuthor.privacy.allowComments) {
        return { success: false, message: 'Comments are disabled for this post' };
      }

      // If it's a reply, validate parent comment
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
          return { success: false, message: 'Parent comment not found' };
        }
        if (parentComment.post.toString() !== postId) {
          return { success: false, message: 'Parent comment does not belong to this post' };
        }
      }

      // Create comment
      const comment = await Comment.create({
        user: userId,
        post: postId,
        content: content.trim(),
        parentComment: parentCommentId,
      });

      // Populate user data
      await comment.populate('user', 'name avatar isVerified roles');

      // Update cache - increment comment count
      await cacheService.incrementPostStat(postId, 'commentsCount', 1);

      // Update post engagement count in database
      await Post.findByIdAndUpdate(postId, {
        $inc: { 'engagement.commentsCount': 1 },
      });

      // If it's a reply, increment parent comment's reply count
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $inc: { repliesCount: 1 },
        });
      }

      // Update post score
      const updatedPost = await Post.findById(postId);
      if (updatedPost) {
        updatedPost.calculateScore();
        await updatedPost.save();
      }

      // Queue notification job (notify post author or parent comment author)
      const notifyUserId = parentCommentId 
        ? (await Comment.findById(parentCommentId)).user
        : post.author;

      if (notifyUserId.toString() !== userId) {
        await queueService.addNotificationJob({
          userId: notifyUserId,
          type: parentCommentId ? 'reply' : 'comment',
          actorId: userId,
          postId,
          commentId: comment._id,
        });
      }

      logger.info(`Comment added by user ${userId} on post ${postId}`);

      return {
        success: true,
        message: 'Comment added successfully',
        data: comment,
      };
    } catch (error) {
      logger.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get comments for a post (paginated)
   * @param {string} postId - Post ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} sortBy - Sort order ('recent' or 'popular')
   * @returns {Promise<Object>} Paginated comments
   */
  async getPostComments(postId, page = 0, limit = 20, sortBy = 'recent') {
    try {
      const skip = page * limit;

      // Get top-level comments only (no replies)
      const sortOptions = sortBy === 'popular' 
        ? { likesCount: -1, createdAt: -1 }
        : { createdAt: -1 };

      const comments = await Comment.find({
        post: postId,
        parentComment: null,
        isActive: true,
      })
        .populate('user', 'name avatar isVerified roles')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      // Get reply counts for each comment
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const repliesCount = await Comment.countDocuments({
            parentComment: comment._id,
            isActive: true,
          });
          return {
            ...comment,
            repliesCount,
          };
        })
      );

      const total = await Comment.countDocuments({
        post: postId,
        parentComment: null,
        isActive: true,
      });

      return {
        success: true,
        data: commentsWithReplies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting post comments:', error);
      throw new Error('Failed to get comments');
    }
  }

  /**
   * Get replies for a comment (paginated)
   * @param {string} commentId - Parent comment ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated replies
   */
  async getCommentReplies(commentId, page = 0, limit = 10) {
    try {
      const skip = page * limit;

      const replies = await Comment.find({
        parentComment: commentId,
        isActive: true,
      })
        .populate('user', 'name avatar isVerified roles')
        .sort({ createdAt: 1 }) // Oldest first for replies
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Comment.countDocuments({
        parentComment: commentId,
        isActive: true,
      });

      return {
        success: true,
        data: replies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting comment replies:', error);
      throw new Error('Failed to get replies');
    }
  }

  /**
   * Edit a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @param {string} content - New content
   * @returns {Promise<Object>} Updated comment
   */
  async editComment(commentId, userId, content) {
    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        return { success: false, message: 'Comment not found' };
      }

      // Check ownership
      if (comment.user.toString() !== userId) {
        return { success: false, message: 'Not authorized to edit this comment' };
      }

      // Update comment
      comment.content = content.trim();
      comment.isEdited = true;
      await comment.save();

      await comment.populate('user', 'name avatar isVerified roles');

      logger.info(`Comment ${commentId} edited by user ${userId}`);

      return {
        success: true,
        message: 'Comment updated successfully',
        data: comment,
      };
    } catch (error) {
      logger.error('Error editing comment:', error);
      throw new Error('Failed to edit comment');
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async deleteComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        return { success: false, message: 'Comment not found' };
      }

      // Check ownership or post ownership
      const post = await Post.findById(comment.post);
      const isOwner = comment.user.toString() === userId;
      const isPostOwner = post && post.author.toString() === userId;

      if (!isOwner && !isPostOwner) {
        return { success: false, message: 'Not authorized to delete this comment' };
      }

      // Soft delete instead of hard delete
      comment.isActive = false;
      await comment.save();

      // Update cache - decrement comment count
      await cacheService.incrementPostStat(comment.post, 'commentsCount', -1);

      // Update post engagement count
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { 'engagement.commentsCount': -1 },
      });

      // If it's a reply, decrement parent comment's reply count
      if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, {
          $inc: { repliesCount: -1 },
        });
      }

      // Decrement reply count for all child comments
      const repliesCount = await Comment.countDocuments({
        parentComment: commentId,
        isActive: true,
      });

      if (repliesCount > 0) {
        await Post.findByIdAndUpdate(comment.post, {
          $inc: { 'engagement.commentsCount': -repliesCount },
        });
      }

      // Update post score
      const updatedPost = await Post.findById(comment.post);
      if (updatedPost) {
        updatedPost.calculateScore();
        await updatedPost.save();
      }

      logger.info(`Comment ${commentId} deleted by user ${userId}`);

      return {
        success: true,
        message: 'Comment deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Like a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result
   */
  async likeComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        return { success: false, message: 'Comment not found' };
      }

      // For simplicity, we'll use a simple increment
      // In production, you might want a separate CommentLike model
      comment.likesCount += 1;
      await comment.save();

      logger.info(`Comment ${commentId} liked by user ${userId}`);

      return {
        success: true,
        message: 'Comment liked successfully',
        likesCount: comment.likesCount,
      };
    } catch (error) {
      logger.error('Error liking comment:', error);
      throw new Error('Failed to like comment');
    }
  }

  /**
   * Get user's comments (paginated)
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated comments
   */
  async getUserComments(userId, page = 0, limit = 20) {
    try {
      const skip = page * limit;

      const comments = await Comment.find({
        user: userId,
        isActive: true,
      })
        .populate('post', 'caption mediaUrl thumbnailUrl type author')
        .populate({
          path: 'post',
          populate: {
            path: 'author',
            select: 'name avatar isVerified',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Comment.countDocuments({
        user: userId,
        isActive: true,
      });

      return {
        success: true,
        data: comments.filter(c => c.post), // Filter out comments on deleted posts
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting user comments:', error);
      throw new Error('Failed to get user comments');
    }
  }

  /**
   * Get comment count for a post
   * @param {string} postId - Post ID
   * @returns {Promise<number>} Comment count
   */
  async getPostCommentCount(postId) {
    try {
      // Try cache first
      const cachedStats = await cacheService.getPostStats(postId);
      if (cachedStats && cachedStats.commentsCount !== undefined) {
        return cachedStats.commentsCount;
      }

      // Fallback to database
      const count = await Comment.countDocuments({
        post: postId,
        isActive: true,
      });

      return count;
    } catch (error) {
      logger.error('Error getting comment count:', error);
      return 0;
    }
  }
}

module.exports = new CommentService();
