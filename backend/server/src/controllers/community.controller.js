const communityService = require('../services/community.service');
const { success } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const community = await communityService.createCommunity(req.body, req.user.id);
    return success(res, community, 201);
  } catch (err) {
    return next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const communities = await communityService.listCommunities();
    return success(res, communities);
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const community = await communityService.getCommunity(req.params.id);
    return success(res, community || {}, community ? 200 : 404);
  } catch (err) {
    return next(err);
  }
};

const join = async (req, res, next) => {
  try {
    const updated = await communityService.joinCommunity(req.params.id, req.user.id);
    return success(res, updated);
  } catch (err) {
    return next(err);
  }
};

const leave = async (req, res, next) => {
  try {
    const updated = await communityService.leaveCommunity(req.params.id, req.user.id);
    return success(res, updated);
  } catch (err) {
    return next(err);
  }
};

module.exports = { create, list, getById, join, leave };

