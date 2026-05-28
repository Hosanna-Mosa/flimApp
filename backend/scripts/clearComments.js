require('dotenv').config();
const mongoose = require('mongoose');
const Comment = require('../server/src/models/Comment.model');
const Post = require('../server/src/models/Post.model');

/**
 * Clear All Comments Script
 * 
 * This script will:
 * 1. Delete all comments from the Comment collection
 * 2. Reset comment counts in all posts to 0
 * 
 * Usage: node scripts/clearComments.js
 */

const clearComments = async () => {
  try {
    console.log('🗑️  Starting comment cleanup...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get counts before deletion
    const commentCount = await Comment.countDocuments({});
    const postsWithComments = await Post.countDocuments({ 'engagement.commentsCount': { $gt: 0 } });

    console.log(`\n📊 Current State:`);
    console.log(`   - Total comments: ${commentCount}`);
    console.log(`   - Posts with comments: ${postsWithComments}`);

    if (commentCount === 0) {
      console.log('\n✨ No comments to delete. Database is already clean!');
      process.exit(0);
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete all comments!');
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all comments
    console.log('🗑️  Deleting all comments...');
    const deleteResult = await Comment.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} comments`);

    // Reset comment counts in all posts
    console.log('🔄 Resetting comment counts in posts...');
    const updateResult = await Post.updateMany(
      { 'engagement.commentsCount': { $gt: 0 } },
      { $set: { 'engagement.commentsCount': 0 } }
    );
    console.log(`✅ Reset comment counts in ${updateResult.modifiedCount} posts`);

    // Verify cleanup
    const remainingComments = await Comment.countDocuments({});
    const remainingPostsWithComments = await Post.countDocuments({ 'engagement.commentsCount': { $gt: 0 } });

    console.log(`\n📊 Final State:`);
    console.log(`   - Remaining comments: ${remainingComments}`);
    console.log(`   - Posts with non-zero comment count: ${remainingPostsWithComments}`);

    if (remainingComments === 0 && remainingPostsWithComments === 0) {
      console.log('\n✨ All comments cleared successfully!');
    } else {
      console.log('\n⚠️  Warning: Some data may not have been cleared properly');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing comments:', error);
    process.exit(1);
  }
};

clearComments();
