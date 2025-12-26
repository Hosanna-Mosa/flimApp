require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// Import models
const User = require('../server/src/models/User.model');
const Post = require('../server/src/models/Post.model');
const Like = require('../server/src/models/Like.model');
const Comment = require('../server/src/models/Comment.model');
const Share = require('../server/src/models/Share.model');
const Follow = require('../server/src/models/Follow.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixPostEngagementCounts = async () => {
  console.log('\n📊 Fixing Post Engagement Counts...\n');
  
  try {
    const posts = await Post.find({});
    console.log(`Found ${posts.length} posts to process`);
    
    let updatedCount = 0;
    
    for (const post of posts) {
      // Count actual likes
      const likesCount = await Like.countDocuments({ 
        post: post._id,
        isActive: true 
      });
      
      // Count actual comments (excluding deleted ones)
      const commentsCount = await Comment.countDocuments({ 
        post: post._id,
        isDeleted: false 
      });
      
      // Count actual shares
      const sharesCount = await Share.countDocuments({ 
        post: post._id 
      });
      
      // Update post engagement counts
      const oldEngagement = { ...post.engagement };
      post.engagement.likesCount = likesCount;
      post.engagement.commentsCount = commentsCount;
      post.engagement.sharesCount = sharesCount;
      
      await post.save();
      updatedCount++;
      
      // Log if there were changes
      if (oldEngagement.likesCount !== likesCount || 
          oldEngagement.commentsCount !== commentsCount || 
          oldEngagement.sharesCount !== sharesCount) {
        console.log(`✅ Post ${post._id}:`);
        console.log(`   Likes: ${oldEngagement.likesCount} → ${likesCount}`);
        console.log(`   Comments: ${oldEngagement.commentsCount} → ${commentsCount}`);
        console.log(`   Shares: ${oldEngagement.sharesCount} → ${sharesCount}`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} posts`);
  } catch (error) {
    console.error('❌ Error fixing post engagement counts:', error);
    throw error;
  }
};

const fixUserStats = async () => {
  console.log('\n👥 Fixing User Stats...\n');
  
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users to process`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      // Count actual followers
      const followersCount = await Follow.countDocuments({ 
        following: user._id,
        status: 'accepted'
      });
      
      // Count actual following
      const followingCount = await Follow.countDocuments({ 
        follower: user._id,
        status: 'accepted'
      });
      
      // Count actual posts
      const postsCount = await Post.countDocuments({ 
        author: user._id,
        isActive: true
      });
      
      // Count likes received on user's posts
      const userPosts = await Post.find({ 
        author: user._id,
        isActive: true 
      }).select('_id');
      
      const postIds = userPosts.map(p => p._id);
      const likesReceived = await Like.countDocuments({ 
        post: { $in: postIds },
        isActive: true
      });
      
      // Update user stats
      const oldStats = { ...user.stats };
      user.stats.followersCount = followersCount;
      user.stats.followingCount = followingCount;
      user.stats.postsCount = postsCount;
      user.stats.likesReceived = likesReceived;
      
      await user.save();
      updatedCount++;
      
      // Log if there were changes
      if (oldStats.followersCount !== followersCount || 
          oldStats.followingCount !== followingCount || 
          oldStats.postsCount !== postsCount ||
          oldStats.likesReceived !== likesReceived) {
        console.log(`✅ User ${user.name} (${user._id}):`);
        console.log(`   Followers: ${oldStats.followersCount} → ${followersCount}`);
        console.log(`   Following: ${oldStats.followingCount} → ${followingCount}`);
        console.log(`   Posts: ${oldStats.postsCount} → ${postsCount}`);
        console.log(`   Likes Received: ${oldStats.likesReceived} → ${likesReceived}`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} users`);
  } catch (error) {
    console.error('❌ Error fixing user stats:', error);
    throw error;
  }
};

const generateReport = async () => {
  console.log('\n📈 Generating Summary Report...\n');
  
  try {
    // Total counts
    const totalUsers = await User.countDocuments({});
    const totalPosts = await Post.countDocuments({});
    const totalLikes = await Like.countDocuments({ isActive: true });
    const totalComments = await Comment.countDocuments({ isDeleted: false });
    const totalShares = await Share.countDocuments({});
    const totalFollows = await Follow.countDocuments({ status: 'accepted' });
    
    console.log('='.repeat(50));
    console.log('DATABASE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Users:        ${totalUsers}`);
    console.log(`Total Posts:        ${totalPosts}`);
    console.log(`Total Likes:        ${totalLikes}`);
    console.log(`Total Comments:     ${totalComments}`);
    console.log(`Total Shares:       ${totalShares}`);
    console.log(`Total Follows:      ${totalFollows}`);
    console.log('='.repeat(50));
    
    // Top engaged posts
    const topPosts = await Post.find({ isActive: true })
      .sort({ 'engagement.likesCount': -1 })
      .limit(5)
      .populate('author', 'name');
    
    console.log('\nTop 5 Most Liked Posts:');
    topPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.author?.name || 'Unknown'} - ${post.engagement.likesCount} likes, ${post.engagement.commentsCount} comments`);
    });
    
    // Top users by followers
    const topUsers = await User.find({})
      .sort({ 'stats.followersCount': -1 })
      .limit(5)
      .select('name stats');
    
    console.log('\nTop 5 Users by Followers:');
    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - ${user.stats.followersCount} followers, ${user.stats.postsCount} posts`);
    });
    
    console.log('\n');
  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  }
};

const verifyIntegrity = async () => {
  console.log('\n🔍 Verifying Data Integrity...\n');
  
  try {
    let issues = 0;
    
    // Check for orphaned likes (likes pointing to non-existent posts)
    const orphanedLikes = await Like.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postData'
        }
      },
      {
        $match: {
          postData: { $size: 0 }
        }
      }
    ]);
    
    if (orphanedLikes.length > 0) {
      console.log(`⚠️  Found ${orphanedLikes.length} orphaned likes (pointing to deleted posts)`);
      issues += orphanedLikes.length;
    }
    
    // Check for orphaned comments
    const orphanedComments = await Comment.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postData'
        }
      },
      {
        $match: {
          postData: { $size: 0 }
        }
      }
    ]);
    
    if (orphanedComments.length > 0) {
      console.log(`⚠️  Found ${orphanedComments.length} orphaned comments (pointing to deleted posts)`);
      issues += orphanedComments.length;
    }
    
    // Check for orphaned shares
    const orphanedShares = await Share.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: 'post',
          foreignField: '_id',
          as: 'postData'
        }
      },
      {
        $match: {
          postData: { $size: 0 }
        }
      }
    ]);
    
    if (orphanedShares.length > 0) {
      console.log(`⚠️  Found ${orphanedShares.length} orphaned shares (pointing to deleted posts)`);
      issues += orphanedShares.length;
    }
    
    if (issues === 0) {
      console.log('✅ No data integrity issues found!');
    } else {
      console.log(`\n⚠️  Total issues found: ${issues}`);
      console.log('💡 Consider running a cleanup script to remove orphaned records');
    }
    
  } catch (error) {
    console.error('❌ Error verifying integrity:', error);
    throw error;
  }
};

const main = async () => {
  console.log('🚀 Starting Engagement Count Fix Script...\n');
  console.log('This script will:');
  console.log('1. Recalculate all post engagement counts (likes, comments, shares)');
  console.log('2. Recalculate all user stats (followers, following, posts, likes received)');
  console.log('3. Verify data integrity');
  console.log('4. Generate a summary report\n');
  
  try {
    await connectDB();
    
    // Fix post engagement counts
    await fixPostEngagementCounts();
    
    // Fix user stats
    await fixUserStats();
    
    // Verify data integrity
    await verifyIntegrity();
    
    // Generate report
    await generateReport();
    
    console.log('✅ All engagement counts have been fixed successfully!\n');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run the script
main();
