const express = require('express');
const Joi = require('joi');
const communityController = require('../controllers/community.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.post(
  '/',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        type: Joi.string().valid('industry', 'role', 'project').required(),
        industry: Joi.string().optional(),
        role: Joi.string().optional(),
      }).required(),
    })
  ),
  communityController.create
);

router.get('/', auth, communityController.list);
router.get('/:id', auth, communityController.getById);
router.post('/:id/join', auth, communityController.join);
router.post('/:id/leave', auth, communityController.leave);

module.exports = router;

