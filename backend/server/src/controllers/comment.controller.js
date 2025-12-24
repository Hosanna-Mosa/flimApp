const commentService = require('../services/comment.service');
const { success, error } = require('../utils/response');

/**
 * Comment Controller - Handles comment operations
 */

/**
 * Add a comment to a post
 * POST /api/posts/:id/comments
 * Body: { content, parentCommentId? }
 */
const addComment = async (req, res, next) => {
  try {
    const { content, parentCommentId } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }
    
    const result = await commentService.addComment({
      userId: req.user.id,
      postId: req.params.id,
      content,
      parentCommentId,
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return success(res, result, 201);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get comments for a post (paginated)
 * GET /api/posts/:id/comments?page=0&limit=20&sortBy=recent
 */
const getPostComments = async (req, res, next) => {
  try {
    const { page = 0, limit = 20, sortBy = 'recent' } = req.query;
    const result = await commentService.getPostComments(
      req.params.id,
      parseInt(page),
      parseInt(limit),
      sortBy
    );
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get replies for a comment (paginated)
 * GET /api/comments/:id/replies?page=0&limit=10
 */
const getCommentReplies = async (req, res, next) => {
  try {
    const { page = 0, limit = 10 } = req.query;
    const result = await commentService.getCommentReplies(
      req.params.id,
      parseInt(page),
      parseInt(limit)
    );
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Edit a comment
 * PUT /api/comments/:id
 * Body: { content }
 */
const editComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }
    
    const result = await commentService.editComment(
      req.params.id,
      req.user.id,
      content
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete a comment
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res, next) => {
  try {
    const result = await commentService.deleteComment(req.params.id, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Like a comment
 * POST /api/comments/:id/like
 */
const likeComment = async (req, res, next) => {
  try {
    const result = await commentService.likeComment(req.params.id, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get user's comments (paginated)
 * GET /api/users/:id/comments?page=0&limit=20
 */
const getUserComments = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await commentService.getUserComments(
      req.params.id,
      parseInt(page),
      parseInt(limit)
    );
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addComment,
  getPostComments,
  getCommentReplies,
  editComment,
  deleteComment,
  likeComment,
  getUserComments,
};
