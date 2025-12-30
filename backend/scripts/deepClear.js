require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import all models
const Comment = require('../server/src/models/Comment.model');
const Community = require('../server/src/models/Community.model');
const CommunityMember = require('../server/src/models/CommunityMember.model');
const CommunityPost = require('../server/src/models/CommunityPost.model');
const Follow = require('../server/src/models/Follow.model');
const Like = require('../server/src/models/Like.model');
const Message = require('../server/src/models/Message.model');
const Notification = require('../server/src/models/Notification.model');
const Post = require('../server/src/models/Post.model');
const Share = require('../server/src/models/Share.model');
const User = require('../server/src/models/User.model');
const Wallet = require('../server/src/models/Wallet.model');

const deepClear = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.info('🚀 Connected to MongoDB for deep cleanup...');

    const collections = [
      { name: 'Comments', model: Comment },
      { name: 'Communities', model: Community },
      { name: 'CommunityMembers', model: CommunityMember },
      { name: 'CommunityPosts', model: CommunityPost },
      { name: 'Follows', model: Follow },
      { name: 'Likes', model: Like },
      { name: 'Messages', model: Message },
      { name: 'Notifications', model: Notification },
      { name: 'Posts', model: Post },
      { name: 'Shares', model: Share },
      { name: 'Users', model: User },
      { name: 'Wallets', model: Wallet }
    ];

    console.info('⚠️ Starting deep clear of all collections...');

    for (const col of collections) {
      const count = await col.model.countDocuments();
      await col.model.deleteMany({});
      console.info(`✅ Cleared ${count} records from ${col.name}`);
    }

    // Also clear some potentially non-modeled collections found in the DB check
    const rawCollections = ['verificationrequests', 'verificationlogs', 'followrequests'];
    for (const rawCol of rawCollections) {
      try {
        const count = await mongoose.connection.db.collection(rawCol).countDocuments();
        await mongoose.connection.db.collection(rawCol).deleteMany({});
        console.info(`✅ Cleared ${count} records from raw collection: ${rawCol}`);
      } catch (e) {
        // Collection might not exist, skip
      }
    }

    console.info('\n✨ Database is now completely empty.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during deep clear:', error);
    process.exit(1);
  }
};

deepClear();
