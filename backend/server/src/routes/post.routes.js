const express = require('express');
const Joi = require('joi');
const postController = require('../controllers/post.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.post(
  '/',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        type: Joi.string().valid('video', 'audio', 'image', 'script').required(),
        mediaUrl: Joi.string().uri().optional(),
        filePath: Joi.string().optional(),
        thumbnailUrl: Joi.string().uri().optional(),
        caption: Joi.string().max(1000),
        industries: Joi.array().items(Joi.string()),
        roles: Joi.array().items(Joi.string()),
      }).required(),
    })
  ),
  postController.createPost
);

router.get('/feed', auth, postController.getFeed);
router.get('/trending', auth, postController.getTrending);
router.get('/user/:id', auth, postController.getUserPosts);
router.delete('/:id', auth, postController.deletePost);

module.exports = router;

