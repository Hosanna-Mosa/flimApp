const userService = require('../services/user.service');
const { success } = require('../utils/response');

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    return success(res, user);
  } catch (err) {
    return next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    return success(res, user);
  } catch (err) {
    return next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    return success(res, user || {}, user ? 200 : 404);
  } catch (err) {
    return next(err);
  }
};

const search = async (req, res, next) => {
  try {
    console.log('[User Search] Query params:', req.query);
    const results = await userService.search(req.query, req.user.id);
    console.log('[User Search] Results count:', results.length);
    return success(res, results);
  } catch (err) {
    console.error('[User Search] Error:', err);
    return next(err);
  }
};

module.exports = { getMe, updateMe, getById, search };

