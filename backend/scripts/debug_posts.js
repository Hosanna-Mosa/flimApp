
const mongoose = require('mongoose');
const User = require('../server/src/models/User.model');
const Post = require('../server/src/models/Post.model');
require('dotenv').config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found');
      return;
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const username = 'kol';
    const user = await User.findOne({ name: { $regex: new RegExp(`^${username}$`, 'i') } });

    if (!user) {
      console.log(`User '${username}' not found.`);
      return;
    }

    console.log(`User found: ${user.name} (${user._id})`);
    console.log('User Stats:', JSON.stringify(user.stats, null, 2));
    console.log('User Posts array (ref):', JSON.stringify(user.posts, null, 2));

    const posts = await Post.find({ author: user._id });
    console.log(`Found ${posts.length} posts in Post collection for this author.`);

    posts.forEach(p => {
      console.log('--------------------------------------------------');
      console.log(`Post ID: ${p._id}`);
      console.log(`  isActive: ${p.isActive}`);
      console.log(`  visibility: ${p.visibility}`);
      console.log(`  type: ${p.type}`);
      console.log(`  createdAt: ${p.createdAt}`);
      console.log(`  author: ${p.author}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
