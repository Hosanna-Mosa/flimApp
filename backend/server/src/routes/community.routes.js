const express = require('express');
const Joi = require('joi');
const communityController = require('../controllers/community.controller');
const groupController = require('../controllers/communityGroup.controller');
const postController = require('../controllers/communityPost.controller');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// ============================================
// COMMUNITY ROUTES
// ============================================

/**
 * @route   POST /api/communities
 * @desc    Create a new community
 * @access  Private
 */
router.post(
  '/',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        name: Joi.string().required().trim().min(3).max(100),
        description: Joi.string().max(1000).allow(''),
        avatar: Joi.string().uri().allow(''),
        coverImage: Joi.string().uri().allow(''),
        type: Joi.string().valid('industry', 'role', 'project', 'general').required(),
        industry: Joi.string().when('type', { is: 'industry', then: Joi.required() }),
        role: Joi.string().when('type', { is: 'role', then: Joi.required() }),
        privacy: Joi.string().valid('public', 'private', 'invite-only').default('public'),
        tags: Joi.array().items(Joi.string()).default([])
      }).required()
    })
  ),
  communityController.create
);

/**
 * @route   GET /api/communities
 * @desc    List all communities with filters
 * @access  Private
 */
router.get('/', auth, communityController.list);

/**
 * @route   GET /api/communities/my
 * @desc    Get user's communities
 * @access  Private
 */
router.get('/my', auth, communityController.getMyCommunities);

/**
 * @route   GET /api/communities/:id
 * @desc    Get community by ID
 * @access  Private
 */
router.get('/:id', auth, communityController.getById);

/**
 * @route   PUT /api/communities/:id
 * @desc    Update community
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        name: Joi.string().trim().min(3).max(100),
        description: Joi.string().max(1000).allow(''),
        avatar: Joi.string().uri().allow(''),
        coverImage: Joi.string().uri().allow(''),
        privacy: Joi.string().valid('public', 'private', 'invite-only'),
        tags: Joi.array().items(Joi.string()),
        settings: Joi.object({
          allowMemberInvites: Joi.boolean(),
          requireApproval: Joi.boolean(),
          allowGroupCreation: Joi.boolean(),
          maxGroups: Joi.number().min(1).max(50)
        })
      }).required()
    })
  ),
  communityController.update
);

/**
 * @route   DELETE /api/communities/:id
 * @desc    Delete community
 * @access  Private (Owner only)
 */
router.delete('/:id', auth, communityController.deleteCommunity);

/**
 * @route   POST /api/communities/:id/join
 * @desc    Join a community
 * @access  Private
 */
router.post('/:id/join', auth, communityController.join);

/**
 * @route   POST /api/communities/:id/leave
 * @desc    Leave a community
 * @access  Private
 */
router.post('/:id/leave', auth, communityController.leave);

/**
 * @route   POST /api/communities/:id/requests/:userId/approve
 * @desc    Approve join request
 * @access  Private (Admin only)
 */
router.post('/:id/requests/:userId/approve', auth, communityController.approveRequest);

/**
 * @route   POST /api/communities/:id/requests/:userId/reject
 * @desc    Reject join request
 * @access  Private (Admin only)
 */
router.post('/:id/requests/:userId/reject', auth, communityController.rejectRequest);

/**
 * @route   GET /api/communities/:id/members
 * @desc    Get community members
 * @access  Private
 */
router.get('/:id/members', auth, communityController.getMembers);

/**
 * @route   PUT /api/communities/:id/members/:userId/role
 * @desc    Update member role
 * @access  Private (Admin only)
 */
router.put(
  '/:id/members/:userId/role',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        role: Joi.string().valid('admin', 'moderator', 'member').required()
      }).required()
    })
  ),
  communityController.updateMemberRole
);

/**
 * @route   DELETE /api/communities/:id/members/:userId
 * @desc    Remove member from community
 * @access  Private (Admin only)
 */
router.delete('/:id/members/:userId', auth, communityController.removeMember);

// ============================================
// GROUP ROUTES
// ============================================

/**
 * @route   POST /api/communities/:communityId/groups
 * @desc    Create a new group in community
 * @access  Private
 */
router.post(
  '/:communityId/groups',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        name: Joi.string().required().trim().min(3).max(100),
        description: Joi.string().max(500).allow(''),
        type: Joi.string().valid('announcement', 'discussion', 'general').default('general'),
        isAnnouncementOnly: Joi.boolean().default(false)
      }).required()
    })
  ),
  groupController.createGroup
);

/**
 * @route   GET /api/communities/:communityId/groups
 * @desc    Get all groups in community
 * @access  Private
 */
router.get('/:communityId/groups', auth, groupController.getGroups);

/**
 * @route   GET /api/communities/:communityId/groups/:groupId
 * @desc    Get specific group
 * @access  Private
 */
router.get('/:communityId/groups/:groupId', auth, groupController.getGroup);

/**
 * @route   PUT /api/communities/:communityId/groups/:groupId
 * @desc    Update group
 * @access  Private (Admin only)
 */
router.put(
  '/:communityId/groups/:groupId',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        name: Joi.string().trim().min(3).max(100),
        description: Joi.string().max(500).allow(''),
        type: Joi.string().valid('announcement', 'discussion', 'general'),
        isAnnouncementOnly: Joi.boolean()
      }).required()
    })
  ),
  groupController.updateGroup
);

/**
 * @route   DELETE /api/communities/:communityId/groups/:groupId
 * @desc    Delete group
 * @access  Private (Admin only)
 */
router.delete('/:communityId/groups/:groupId', auth, groupController.deleteGroup);

/**
 * @route   POST /api/communities/:communityId/groups/:groupId/join
 * @desc    Join a group
 * @access  Private
 */
router.post('/:communityId/groups/:groupId/join', auth, groupController.joinGroup);

/**
 * @route   POST /api/communities/:communityId/groups/:groupId/leave
 * @desc    Leave a group
 * @access  Private
 */
router.post('/:communityId/groups/:groupId/leave', auth, groupController.leaveGroup);

/**
 * @route   GET /api/communities/:communityId/groups/:groupId/members
 * @desc    Get group members
 * @access  Private
 */
router.get('/:communityId/groups/:groupId/members', auth, groupController.getGroupMembers);

// ============================================
// POST ROUTES
// ============================================

/**
 * @route   POST /api/communities/:communityId/posts
 * @desc    Create a post in community
 * @access  Private
 */
router.post(
  '/:communityId/posts',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        groupId: Joi.string().required(),
        type: Joi.string().valid('text', 'image', 'video', 'poll', 'announcement').default('text'),
        content: Joi.string().required().max(5000),
        media: Joi.array().items(
          Joi.object({
            url: Joi.string().uri().required(),
            type: Joi.string().valid('image', 'video', 'document'),
            thumbnail: Joi.string().uri(),
            size: Joi.number(),
            format: Joi.string()
          })
        ),
        poll: Joi.object({
          question: Joi.string().required(),
          options: Joi.array().items(
            Joi.object({
              text: Joi.string().required()
            })
          ).min(2).max(10).required(),
          endsAt: Joi.date(),
          allowMultiple: Joi.boolean().default(false)
        }).when('type', { is: 'poll', then: Joi.required() })
      }).required()
    })
  ),
  postController.createPost
);

/**
 * @route   GET /api/communities/:communityId/posts
 * @desc    Get community feed
 * @access  Private
 */
router.get('/:communityId/posts', auth, postController.getCommunityFeed);

/**
 * @route   GET /api/communities/:communityId/groups/:groupId/posts
 * @desc    Get posts from specific group
 * @access  Private
 */
router.get('/:communityId/groups/:groupId/posts', auth, postController.getGroupPosts);

/**
 * @route   PUT /api/communities/:communityId/posts/:postId
 * @desc    Update post
 * @access  Private (Author only)
 */
router.put(
  '/:communityId/posts/:postId',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        content: Joi.string().max(5000),
        media: Joi.array().items(
          Joi.object({
            url: Joi.string().uri().required(),
            type: Joi.string().valid('image', 'video', 'document'),
            thumbnail: Joi.string().uri()
          })
        )
      }).required()
    })
  ),
  postController.updatePost
);

/**
 * @route   DELETE /api/communities/:communityId/posts/:postId
 * @desc    Delete post
 * @access  Private (Author or Moderator+)
 */
router.delete('/:communityId/posts/:postId', auth, postController.deletePost);

/**
 * @route   POST /api/communities/:communityId/posts/:postId/pin
 * @desc    Pin/Unpin post
 * @access  Private (Moderator+ only)
 */
router.post('/:communityId/posts/:postId/pin', auth, postController.togglePin);

/**
 * @route   POST /api/communities/:communityId/posts/:postId/like
 * @desc    Like post
 * @access  Private
 */
router.post('/:communityId/posts/:postId/like', auth, postController.likePost);

/**
 * @route   DELETE /api/communities/:communityId/posts/:postId/like
 * @desc    Unlike post
 * @access  Private
 */
router.delete('/:communityId/posts/:postId/like', auth, postController.unlikePost);

/**
 * @route   POST /api/communities/:communityId/posts/:postId/vote
 * @desc    Vote in poll
 * @access  Private
 */
router.post(
  '/:communityId/posts/:postId/vote',
  auth,
  validate(
    Joi.object({
      body: Joi.object({
        optionIndex: Joi.number().required().min(0)
      }).required()
    })
  ),
  postController.voteInPoll
);

module.exports = router;
