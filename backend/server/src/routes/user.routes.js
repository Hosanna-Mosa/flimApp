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
        name: Joi.string(),
        email: Joi.string().email().lowercase(),
        phone: Joi.string(),
        avatar: Joi.string(),
        bio: Joi.string().max(500),
        roles: Joi.array().items(Joi.string()),
        industries: Joi.array().items(Joi.string()),
        experience: Joi.number(),
        location: Joi.string(),
        portfolio: Joi.array().items(
          Joi.object({
            title: Joi.string(),
            type: Joi.string(),
            url: Joi.string(),
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

