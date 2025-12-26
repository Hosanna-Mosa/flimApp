const groupService = require('../services/communityGroup.service');
const { success } = require('../utils/response');

/**
 * Create a new group in a community
 */
const createGroup = async (req, res, next) => {
  try {
    const group = await groupService.createGroup(
      req.params.communityId,
      req.body,
      req.user.id
    );
    return success(res, group, 201);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get all groups in a community
 */
const getGroups = async (req, res, next) => {
  try {
    const groups = await groupService.getGroups(
      req.params.communityId,
      req.user?.id
    );
    return success(res, groups);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get a specific group
 */
const getGroup = async (req, res, next) => {
  try {
    const group = await groupService.getGroup(
      req.params.communityId,
      req.params.groupId
    );
    return success(res, group);
  } catch (err) {
    return next(err);
  }
};

/**
 * Update a group
 */
const updateGroup = async (req, res, next) => {
  try {
    const group = await groupService.updateGroup(
      req.params.communityId,
      req.params.groupId,
      req.body,
      req.user.id
    );
    return success(res, group);
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete a group
 */
const deleteGroup = async (req, res, next) => {
  try {
    const result = await groupService.deleteGroup(
      req.params.communityId,
      req.params.groupId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Join a group
 */
const joinGroup = async (req, res, next) => {
  try {
    const result = await groupService.joinGroup(
      req.params.communityId,
      req.params.groupId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Leave a group
 */
const leaveGroup = async (req, res, next) => {
  try {
    const result = await groupService.leaveGroup(
      req.params.communityId,
      req.params.groupId,
      req.user.id
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

/**
 * Get group members
 */
const getGroupMembers = async (req, res, next) => {
  try {
    const { page = 0, limit = 50 } = req.query;
    const result = await groupService.getGroupMembers(
      req.params.communityId,
      req.params.groupId,
      parseInt(page),
      parseInt(limit)
    );
    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers
};
