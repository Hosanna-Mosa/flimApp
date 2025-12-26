const communityService = require('../services/community.service');
const { success } = require('../utils/response');

/**
 * Create a new community
 */
const create = async (req, res, next) => {
  try {
    const community = await communityService.createCommunity(req.body, req.user.id);
    return success(res, community, 201);
  } catch (err) {
    return next(err);
  }
};

/**
 * List all communities with filters
 */
const list = async (req, res, next) => {
  try {
    const { type, industry, role, privacy, tags, search, page = 0, limit = 20 } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (industry) filters.industry = industry;
    if (role) filters.role = role;
    if (privacy) filters.privacy = privacy;
    if (tags) filters.tags = tags.split(',');
    if (search) filters.search = search;

    const result = await communityService.listCommunities(
      filters,
      parseInt(page),
      parseInt(limit),
      req.user ? req.user.id : null
    );
    
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get user's communities
 */
const getMyCommunities = async (req, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;
    const result = await communityService.getUserCommunities(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get community by ID
 */
const getById = async (req, res, next) => {
  try {
    const community = await communityService.getCommunity(
      req.params.id,
      req.user?.id
    );
    return success(res, community);
  } catch (err) {
    return next(err);
  }
};

/**
 * Update community
 */
const update = async (req, res, next) => {
  try {
    const community = await communityService.updateCommunity(
      req.params.id,
      req.user.id,
      req.body
    );
    return success(res, community);
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete community
 */
const deleteCommunity = async (req, res, next) => {
  try {
    const result = await communityService.deleteCommunity(
      req.params.id,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Join community
 */
const join = async (req, res, next) => {
  try {
    const result = await communityService.joinCommunity(
      req.params.id,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Leave community
 */
const leave = async (req, res, next) => {
  try {
    const result = await communityService.leaveCommunity(
      req.params.id,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Approve join request
 */
const approveRequest = async (req, res, next) => {
  try {
    const result = await communityService.approveJoinRequest(
      req.params.id,
      req.params.userId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Reject join request
 */
const rejectRequest = async (req, res, next) => {
  try {
    const result = await communityService.rejectJoinRequest(
      req.params.id,
      req.params.userId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get community members
 */
const getMembers = async (req, res, next) => {
  try {
    const { page = 0, limit = 50 } = req.query;
    const result = await communityService.getCommunityMembers(
      req.params.id,
      parseInt(page),
      parseInt(limit)
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Update member role
 */
const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const member = await communityService.updateMemberRole(
      req.params.id,
      req.params.userId,
      role,
      req.user.id
    );
    return success(res, member);
  } catch (err) {
    return next(err);
  }
};

/**
 * Remove member
 */
const removeMember = async (req, res, next) => {
  try {
    const result = await communityService.removeMember(
      req.params.id,
      req.params.userId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  create,
  list,
  getMyCommunities,
  getById,
  update,
  deleteCommunity,
  join,
  leave,
  approveRequest,
  rejectRequest,
  getMembers,
  updateMemberRole,
  removeMember
};
