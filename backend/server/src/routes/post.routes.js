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
        mediaUrl: Joi.string().uri().required(),
        thumbnail: Joi.string().uri().optional(),
        duration: Joi.number().optional(),
        format: Joi.string().optional(),
        size: Joi.number().optional(),
        width: Joi.number().optional(),
        height: Joi.number().optional(),
        caption: Joi.string().max(1000).allow('').optional(),
        industries: Joi.array().items(Joi.string()).optional(),
        roles: Joi.array().items(Joi.string()).optional(),
      }).required(),
    })
  ),
  postController.createPost
);

router.get('/feed', auth, postController.getFeed);
router.get('/trending', auth, postController.getTrending);
router.get('/user/:id', auth, postController.getUserPosts);
router.get('/:id', auth, postController.getPost);
router.put(
  '/:id',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        caption: Joi.string().max(1000).allow('').optional(),
        industries: Joi.array().items(Joi.string()).optional(),
        roles: Joi.array().items(Joi.string()).optional(),
        visibility: Joi.string().valid('public', 'followers', 'private').optional(),
      }).required(),
    })
  ),
  postController.updatePost
);
router.delete('/:id', auth, postController.deletePost);

module.exports = router;

