const Post = require('../models/Post.model');
const feedService = require('./feed.service');
const configureCloudinary = require('../config/cloudinary');

const cloudinary = configureCloudinary();

const uploadMedia = async (filePath) => {
  const upload = await cloudinary.uploader.upload(filePath, {
    resource_type: 'auto',
    folder: 'film-network/posts',
  });
  return { url: upload.secure_url, thumbnailUrl: upload.secure_url };
};

const createPost = async (authorId, payload) => {
  let mediaUrl = payload.mediaUrl;
  let thumbnailUrl = payload.thumbnailUrl;

  if (!mediaUrl && payload.filePath) {
    const uploaded = await uploadMedia(payload.filePath);
    mediaUrl = uploaded.url;
    thumbnailUrl = uploaded.thumbnailUrl;
  }

  const post = await Post.create({
    author: authorId,
    type: payload.type,
    mediaUrl,
    thumbnailUrl,
    caption: payload.caption,
    industries: payload.industries || [],
    roles: payload.roles || [],
  });
  return post;
};

const deletePost = async (postId, userId) =>
  Post.findOneAndDelete({ _id: postId, author: userId });

const getUserPosts = async (userId) => Post.find({ author: userId }).sort({ createdAt: -1 });

const getTrending = async () => feedService.getTrending();

const getFeed = async (user) => feedService.getPersonalizedFeed(user);

module.exports = { createPost, deletePost, getUserPosts, getTrending, getFeed };

