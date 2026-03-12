const express = require('express');
const Joi = require('joi');
const userController = require('../controllers/user.controller');
const savedPostController = require('../controllers/savedPost.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.get('/me', auth, userController.getMe);
router.get('/me/saved', auth, savedPostController.getSavedPosts);

router.put(
  '/me',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        name: Joi.string().allow('', null),
        username: Joi.string()
          .allow('', null)
          .empty('')
          .pattern(/^[a-zA-Z0-9._]+$/)
          .min(3)
          .max(30)
          .messages({
            'string.pattern.base': 'Username can only contain letters, numbers, underscores, and periods',
            'string.min': 'Username must be at least 3 characters long',
          }),
        email: Joi.string().email().lowercase().allow('', null),
        phone: Joi.string().allow('', null),
        avatar: Joi.string().allow('', null),
        bio: Joi.string().max(500).allow('', null),
        roles: Joi.array().items(Joi.string()),
        industries: Joi.array().items(Joi.string()),
        experience: Joi.number(),
        location: Joi.string().allow('', null),
        portfolio: Joi.array().items(
          Joi.object({
            title: Joi.string().allow('', null),
            type: Joi.string().allow('', null),
            url: Joi.string().allow('', null),
          })
        ),
        accountType: Joi.string().valid('public', 'private', 'business'),
      }),
    })
  ),
  userController.updateMe
);

router.get('/:id', auth, userController.getById);

router.get(
  '/',
  auth,
  validate(
    Joi.object({
      query: Joi.object({
        q: Joi.string().allow(''),
        roles: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
        industries: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
      }).unknown(true),
    })
  ),
  userController.search
);

module.exports = router;

