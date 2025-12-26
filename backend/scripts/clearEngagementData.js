require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// Import models
const User = require('../server/src/models/User.model');
const Post = require('../server/src/models/Post.model');
const Like = require('../server/src/models/Like.model');
const Comment = require('../server/src/models/Comment.model');
const Share = require('../server/src/models/Share.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearLikes = async () => {
  console.log('\n💔 Clearing all likes...');
  
  try {
    const result = await Like.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} likes`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error clearing likes:', error);
    throw error;
  }
};

const clearComments = async () => {
  console.log('\n💬 Clearing all comments...');
  
  try {
    const result = await Comment.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} comments`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error clearing comments:', error);
    throw error;
  }
};

const clearShares = async () => {
  console.log('\n🔄 Clearing all shares...');
  
  try {
    const result = await Share.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} shares`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error clearing shares:', error);
    throw error;
  }
};

const resetPostEngagementCounts = async () => {
  console.log('\n📊 Resetting post engagement counts to 0...');
  
  try {
    const posts = await Post.find({});
    console.log(`Found ${posts.length} posts to reset`);
    
    let updatedCount = 0;
    
    for (const post of posts) {
      const oldEngagement = { ...post.engagement };
      
      // Reset all engagement counts to 0
      post.engagement.likesCount = 0;
      post.engagement.commentsCount = 0;
      post.engagement.sharesCount = 0;
      // Keep viewsCount as is (or reset if needed)
      // post.engagement.viewsCount = 0;
      
      await post.save();
      updatedCount++;
      
      // Log if there were any non-zero values
      if (oldEngagement.likesCount > 0 || 
          oldEngagement.commentsCount > 0 || 
          oldEngagement.sharesCount > 0) {
        console.log(`✅ Post ${post._id}:`);
        console.log(`   Likes: ${oldEngagement.likesCount} → 0`);
        console.log(`   Comments: ${oldEngagement.commentsCount} → 0`);
        console.log(`   Shares: ${oldEngagement.sharesCount} → 0`);
      }
    }
    
    console.log(`✅ Reset engagement counts for ${updatedCount} posts`);
    return updatedCount;
  } catch (error) {
    console.error('❌ Error resetting post engagement counts:', error);
    throw error;
  }
};

const resetUserLikesReceived = async () => {
  console.log('\n👥 Resetting user likes received to 0...');
  
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      const oldLikesReceived = user.stats.likesReceived;
      
      // Reset likes received to 0, but keep followers, following, and posts count
      user.stats.likesReceived = 0;
      
      await user.save();
      updatedCount++;
      
      if (oldLikesReceived > 0) {
        console.log(`✅ User ${user.name}: Likes received ${oldLikesReceived} → 0`);
      }
    }
    
    console.log(`✅ Reset likes received for ${updatedCount} users`);
    console.log(`ℹ️  Follower/following counts preserved`);
    return updatedCount;
  } catch (error) {
    console.error('❌ Error resetting user likes received:', error);
    throw error;
  }
};

const clearRedisCache = async () => {
  console.log('\n🗑️  Clearing Redis cache...');
  
  try {
    const redis = require('../server/src/config/redis');
    
    // Clear all cache keys related to engagement
    const keys = await redis.keys('*');
    
    if (keys.length > 0) {
      // Filter out keys we want to keep (follow-related)
      const keysToDelete = keys.filter(key => {
        // Keep follow-related keys
        if (key.includes(':followers') || key.includes(':following')) {
          return false;
        }
        return true;
      });
      
      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
        console.log(`✅ Cleared ${keysToDelete.length} cache keys`);
        console.log(`ℹ️  Preserved ${keys.length - keysToDelete.length} follow-related cache keys`);
      } else {
        console.log('ℹ️  No cache keys to clear');
      }
    } else {
      console.log('ℹ️  Redis cache is already empty');
    }
  } catch (error) {
    console.warn('⚠️  Could not clear Redis cache:', error.message);
    console.log('ℹ️  Continuing without cache clear (cache will expire naturally)');
  }
};

const generateReport = async () => {
  console.log('\n📈 Generating Final Report...\n');
  
  try {
    const totalUsers = await User.countDocuments({});
    const totalPosts = await Post.countDocuments({});
    const totalLikes = await Like.countDocuments({});
    const totalComments = await Comment.countDocuments({});
    const totalShares = await Share.countDocuments({});
    
    // Get follow stats (should be preserved)
    const Follow = require('../server/src/models/Follow.model');
    const totalFollows = await Follow.countDocuments({ status: 'accepted' });
    
    console.log('='.repeat(60));
    console.log('FINAL DATABASE STATE');
    console.log('='.repeat(60));
    console.log(`Total Users:              ${totalUsers}`);
    console.log(`Total Posts:              ${totalPosts}`);
    console.log('');
    console.log('ENGAGEMENT DATA (CLEARED):');
    console.log(`  Total Likes:            ${totalLikes} ✅`);
    console.log(`  Total Comments:         ${totalComments} ✅`);
    console.log(`  Total Shares:           ${totalShares} ✅`);
    console.log('');
    console.log('FOLLOW DATA (PRESERVED):');
    console.log(`  Total Follows:          ${totalFollows} 👥`);
    console.log('='.repeat(60));
    
    // Verify all posts have 0 engagement
    const postsWithEngagement = await Post.countDocuments({
      $or: [
        { 'engagement.likesCount': { $gt: 0 } },
        { 'engagement.commentsCount': { $gt: 0 } },
        { 'engagement.sharesCount': { $gt: 0 } }
      ]
    });
    
    if (postsWithEngagement === 0) {
      console.log('\n✅ VERIFICATION: All posts have 0 engagement counts');
    } else {
      console.log(`\n⚠️  WARNING: ${postsWithEngagement} posts still have non-zero engagement`);
    }
    
    // Show user stats
    const users = await User.find({})
      .select('name stats')
      .sort({ 'stats.followersCount': -1 })
      .limit(5);
    
    console.log('\nTop Users (by followers - PRESERVED):');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Followers: ${user.stats.followersCount}`);
      console.log(`   Following: ${user.stats.followingCount}`);
      console.log(`   Posts: ${user.stats.postsCount}`);
      console.log(`   Likes Received: ${user.stats.likesReceived} (cleared)`);
    });
    
    console.log('\n');
  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  }
};

const confirmAction = () => {
  return new Promise((resolve) => {
    console.log('\n⚠️  WARNING: This script will:');
    console.log('   1. DELETE all likes from the database');
    console.log('   2. DELETE all comments from the database');
    console.log('   3. DELETE all shares from the database');
    console.log('   4. RESET all post engagement counts to 0');
    console.log('   5. RESET user likes received to 0');
    console.log('   6. CLEAR engagement-related Redis cache');
    console.log('   7. PRESERVE all follow relationships and counts\n');
    console.log('✅ This action will create a clean slate for engagement data.');
    console.log('✅ Follow statistics will be preserved.\n');
    
    // Auto-confirm for script execution
    console.log('Proceeding with cleanup...\n');
    resolve(true);
  });
};

const main = async () => {
  console.log('🧹 ENGAGEMENT DATA CLEANUP SCRIPT\n');
  console.log('This script will clear all engagement data while preserving follows.');
  
  try {
    await connectDB();
    
    // Confirm action
    await confirmAction();
    
    // Track totals
    let totalDeleted = 0;
    
    // Clear all engagement data
    totalDeleted += await clearLikes();
    totalDeleted += await clearComments();
    totalDeleted += await clearShares();
    
    // Reset post engagement counts
    await resetPostEngagementCounts();
    
    // Reset user likes received (but keep follower stats)
    await resetUserLikesReceived();
    
    // Clear Redis cache (except follow data)
    await clearRedisCache();
    
    // Generate final report
    await generateReport();
    
    console.log('='.repeat(60));
    console.log(`✅ CLEANUP COMPLETE!`);
    console.log(`   Total records deleted: ${totalDeleted}`);
    console.log(`   All engagement counts reset to 0`);
    console.log(`   Follow statistics preserved`);
    console.log('='.repeat(60));
    console.log('\n💡 Your database now has a clean engagement slate!');
    console.log('💡 Users can start fresh with likes, comments, and shares.\n');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run the script
main();
