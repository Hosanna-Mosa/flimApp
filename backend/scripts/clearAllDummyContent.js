require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import all models needed for cleanup
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

const clearAllDummyContent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.info('🚀 Connected to MongoDB for content cleanup...');

    const collectionsToWipe = [
      { name: 'Comments', model: Comment },
      { name: 'Communities', model: Community },
      { name: 'CommunityMembers', model: CommunityMember },
      { name: 'CommunityPosts', model: CommunityPost },
      { name: 'Follows', model: Follow },
      { name: 'Likes', model: Like },
      { name: 'Messages', model: Message },
      { name: 'Notifications', model: Notification },
      { name: 'Posts', model: Post },
      { name: 'Shares', model: Share }
    ];

    console.info('⚠️  Wiping all dummy content (keeping user accounts)...');

    // 1. Wipe all content collections
    for (const col of collectionsToWipe) {
      const count = await col.model.countDocuments();
      await col.model.deleteMany({});
      console.info(`✅ Deleted ${count} records from ${col.name}`);
    }

    // 2. Clear industrial collections (raw)
    const rawCollections = ['verificationrequests', 'verificationlogs', 'followrequests'];
    for (const rawCol of rawCollections) {
      try {
        const count = await mongoose.connection.db.collection(rawCol).countDocuments();
        await mongoose.connection.db.collection(rawCol).deleteMany({});
        console.info(`✅ Deleted ${count} records from raw collection: ${rawCol}`);
      } catch (e) {
        // Skip if not exists
      }
    }

    // 3. Reset User Stats
    console.info('\n🔄 Resetting statistics for all users...');
    const result = await User.updateMany(
      {},
      {
        $set: {
          'stats.followersCount': 0,
          'stats.followingCount': 0,
          'stats.postsCount': 0,
          'stats.likesReceived': 0,
          posts: []
        }
      }
    );
    console.info(`✅ Reset stats for ${result.modifiedCount} users`);

    console.info('\n✨ Cleanup completed! Users are now fresh with 0 posts/followers.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

clearAllDummyContent();
