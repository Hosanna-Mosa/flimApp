const express = require('express');
const Joi = require('joi');
const postController = require('../controllers/post.controller');
const savedPostController = require('../controllers/savedPost.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.post(
  '/',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        type: Joi.string().valid('video', 'audio', 'image', 'script', 'text').required(),
        mediaUrl: Joi.string().allow('', null).optional(),
        thumbnail: Joi.string().allow('', null).optional(),
        duration: Joi.number().optional(),
        format: Joi.string().allow('', null).optional(),
        size: Joi.number().optional(),
        width: Joi.number().optional(),
        height: Joi.number().optional(),
        caption: Joi.string().max(1000).allow('').optional(),
        industries: Joi.array().items(Joi.string()).optional(),
        roles: Joi.array().items(Joi.string()).optional(),
        isDonation: Joi.boolean().optional(),
      }).required(),
    })
  ),
  postController.createPost
);

router.get('/feed', auth, postController.getFeed);
router.get('/trending', auth, postController.getTrending);
router.get('/donations', auth, postController.getDonations);
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
router.post('/:postId/save', auth, savedPostController.toggleSavePost);

module.exports = router;

