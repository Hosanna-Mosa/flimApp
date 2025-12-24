require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/src/models/User.model');
const Post = require('../server/src/models/Post.model');
const Follow = require('../server/src/models/Follow.model');
const Like = require('../server/src/models/Like.model');
const Comment = require('../server/src/models/Comment.model');

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.info('Connected to MongoDB');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Follow.deleteMany({}),
      Like.deleteMany({}),
      Comment.deleteMany({}),
    ]);

    console.info('✅ All collections cleared successfully!');
    console.info('- Users');
    console.info('- Posts');
    console.info('- Follows');
    console.info('- Likes');
    console.info('- Comments');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();
