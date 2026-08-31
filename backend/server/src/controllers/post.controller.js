const postService = require('../services/post.service');
const { success } = require('../utils/response');

const createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user.id, req.body);
    return success(res, post, 201);
  } catch (err) {
    return next(err);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await postService.updatePost(req.params.id, req.user.id, req.body);
    return success(res, post);
  } catch (err) {
    return next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const deleted = await postService.deletePost(req.params.id, req.user.id);
    return success(res, { deleted: Boolean(deleted) });
  } catch (err) {
    return next(err);
  }
};

const getDonations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const posts = await postService.getDonations(page, limit, req.user.id);
    return success(res, posts);
  } catch (err) {
    return next(err);
  }
};

const getPost = async (req, res, next) => {
  try {
    const userId = req.user?.id; // Get user ID if authenticated
    const post = await postService.getPostById(req.params.id, userId);
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    return success(res, post);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createPost,
  deletePost,
  getDonations,
  getPost,
  updatePost,
};

