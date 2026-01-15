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
        name: Joi.string().optional().allow('', null),
        email: Joi.string().email().lowercase().optional().allow('', null),
        phone: Joi.string().optional().allow('', null),
        avatar: Joi.string().optional().allow('', null),
        bio: Joi.string().max(500).optional().allow('', null),
        roles: Joi.array().items(Joi.string()).optional(),
        industries: Joi.array().items(Joi.string()).optional(),
        experience: Joi.number().optional().allow(null),
        location: Joi.string().optional().allow('', null),
        portfolio: Joi.array().items(
          Joi.object({
            title: Joi.string(),
            type: Joi.string(),
            url: Joi.string(),
          })
        ).optional(),
        accountType: Joi.string().valid('public', 'private', 'business').optional(),
      }).min(1), // At least one field must be provided
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

