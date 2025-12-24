const Post = require('../models/Post.model');

const RECENCY_HALF_LIFE_HOURS = 48;

const computeScore = (post, user) => {
  const engagementScore =
    (post.engagement?.likes || 0) * 1 +
    (post.engagement?.comments || 0) * 2 +
    (post.engagement?.shares || 0) * 3;

  const roleMatch = post.roles?.some((r) => user.roles.includes(r)) ? 10 : 0;
  const industryMatch = post.industries?.some((i) => user.industries.includes(i))
    ? 8
    : 0;

  const hoursSince = (Date.now() - new Date(post.createdAt).getTime()) / 36e5;
  const recency = Math.exp(-hoursSince / RECENCY_HALF_LIFE_HOURS) * 10;

  return engagementScore + roleMatch + industryMatch + recency;
};

const getPersonalizedFeed = async (user) => {
  const posts = await Post.find({})
    .populate('author', 'name avatar roles industries')
    .lean();

  const scored = posts.map((post) => ({
    ...post,
    score: computeScore(post, user),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, 100);
};

const getTrending = async () => {
  const posts = await Post.find({})
    .sort({ 'engagement.likes': -1, createdAt: -1 })
    .limit(50)
    .populate('author', 'name avatar roles industries');
  return posts;
};

module.exports = { getPersonalizedFeed, getTrending };

