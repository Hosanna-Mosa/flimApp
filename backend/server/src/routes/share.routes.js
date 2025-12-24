const express = require('express');
const Joi = require('joi');
const shareController = require('../controllers/share.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Share post
router.post(
  '/posts/:id/share',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        shareType: Joi.string().valid('repost', 'quote', 'external').optional(),
        caption: Joi.string().max(500).optional(),
        platform: Joi.string().valid('whatsapp', 'twitter', 'facebook', 'instagram', 'other').optional(),
      }).optional(),
    })
  ),
  shareController.sharePost
);

// Get post shares
router.get('/posts/:id/shares', shareController.getPostShares); // Public

// Get user's shares
router.get('/users/:id/shares', shareController.getUserShares); // Public

// Delete share
router.delete('/shares/:id', auth, shareController.deleteShare);

// Get share statistics
router.get('/posts/:id/share-stats', shareController.getShareStats); // Public

module.exports = router;
