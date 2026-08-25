const express = require('express');
const Joi = require('joi');
const commentController = require('../controllers/comment.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Add comment to post
router.post(
  '/posts/:id/comments',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        content: Joi.string().max(500).required(),
        parentCommentId: Joi.string().optional(),
      }).required(),
    })
  ),
  commentController.addComment
);

// Get comments for post
router.get('/posts/:id/comments', auth, commentController.getPostComments);

// Get replies for comment
router.get('/comments/:id/replies', auth, commentController.getCommentReplies);

// Edit comment
router.put(
  '/comments/:id',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        content: Joi.string().max(500).required(),
      }).required(),
    })
  ),
  commentController.editComment
);

// Delete comment
router.delete('/comments/:id', auth, commentController.deleteComment);

// Like comment
router.post('/comments/:id/like', auth, commentController.likeComment);

// Get user's comments
router.get('/users/:id/comments', auth, commentController.getUserComments);

module.exports = router;
