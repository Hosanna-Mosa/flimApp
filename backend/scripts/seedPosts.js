require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../server/src/models/Post.model');
const User = require('../server/src/models/User.model');

const seedPosts = [
  {
    type: 'video',
    mediaUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
    caption:
      'Behind the scenes from our latest shoot! The dedication and hard work that goes into every frame is incredible. #FilmMaking #BTS',
    industries: ['bollywood'],
    roles: ['director', 'producer'],
    engagement: {
      likesCount: 234,
      commentsCount: 45,
      sharesCount: 12,
      viewsCount: 1250,
    },
    visibility: 'public',
    isActive: true,
    authorEmail: 'raj@example.com', // Will be converted to author ID
  },
  {
    type: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800',
    caption:
      'Golden hour magic ✨ Nothing beats natural lighting for emotional scenes.',
    industries: ['bollywood', 'punjabi'],
    roles: ['dop', 'editor'],
    engagement: {
      likesCount: 189,
      commentsCount: 23,
      sharesCount: 8,
      viewsCount: 876,
    },
    visibility: 'public',
    isActive: true,
    authorEmail: 'priya@example.com',
  },
  {
    type: 'video',
    mediaUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800',
    caption:
      'Action sequence rehearsal. Perfecting every move before the final take! 🎬',
    industries: ['tollywood', 'kollywood'],
    roles: ['actor'],
    engagement: {
      likesCount: 412,
      commentsCount: 67,
      sharesCount: 23,
      viewsCount: 2345,
    },
    visibility: 'public',
    isActive: true,
    authorEmail: 'arjun@example.com',
  },
  {
    type: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    caption:
      'Working on the theme for an upcoming romantic drama. Traditional instruments meet modern production 🎵',
    industries: ['mollywood', 'kollywood'],
    roles: ['music'],
    engagement: {
      likesCount: 156,
      commentsCount: 34,
      sharesCount: 19,
      viewsCount: 543,
    },
    visibility: 'public',
    isActive: true,
    authorEmail: 'maya@example.com',
  },
  {
    type: 'script',
    mediaUrl:
      'https://images.unsplash.com/photo-1517842264405-c7fe8bdf42eb?w=800',
    caption:
      'Excited to share a glimpse of our upcoming project screenplay. Years of research went into this! 📝',
    industries: ['bollywood'],
    roles: ['director', 'producer'],
    engagement: {
      likesCount: 298,
      commentsCount: 56,
      sharesCount: 31,
      viewsCount: 1456,
    },
    visibility: 'public',
    isActive: true,
    authorEmail: 'raj@example.com',
  },
  {
    type: 'video',
    mediaUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    caption:
      'New camera gear arrived! Testing out the 4K capabilities. The clarity is mind-blowing! 📹',
    industries: ['bollywood', 'punjabi'],
    roles: ['dop'],
    engagement: {
      likesCount: 445,
      commentsCount: 78,
      sharesCount: 34,
      viewsCount: 2134,
    },
    visibility: 'public',
    isActive: true,
    authorEmail: 'priya@example.com',
  },
  {
    type: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    caption:
      'Character study session. Getting into the mindset for the next role. #ActorLife',
    industries: ['tollywood'],
    roles: ['actor'],
    engagement: {
      likesCount: 678,
      commentsCount: 92,
      sharesCount: 45,
      viewsCount: 3421,
    },
    visibility: 'public',
    isActive: true,
    authorEmail: 'arjun@example.com',
  },
  {
    type: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    caption:
      'Experimenting with new sounds for the upcoming thriller. Dark and intense! 🎼',
    industries: ['kollywood'],
    roles: ['music'],
    engagement: {
      likesCount: 234,
      commentsCount: 45,
      sharesCount: 28,
      viewsCount: 876,
    },
    visibility: 'public',
    isActive: true,
    authorEmail: 'maya@example.com',
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.info('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    if (users.length === 0) {
      console.error('No users found! Please run seedUsers.js first.');
      process.exit(1);
    }

    // Create a map of email to user ID
    const emailToUser = {};
    users.forEach((user) => {
      emailToUser[user.email] = user;
    });

    // Clear existing posts
    await Post.deleteMany({});
    console.info('Cleared existing posts');

    // Create posts with correct author IDs
    const postsToInsert = seedPosts.map((post) => {
      const author = emailToUser[post.authorEmail];
      if (!author) {
        console.warn(`Author not found for email: ${post.authorEmail}`);
        return null;
      }

      const { authorEmail, ...postData } = post;
      return {
        ...postData,
        author: author._id,
      };
    }).filter(Boolean);

    // Calculate scores for posts
    const postsWithScores = postsToInsert.map((post) => {
      const engagement =
        (post.engagement.likesCount || 0) * 1 +
        (post.engagement.commentsCount || 0) * 2 +
        (post.engagement.sharesCount || 0) * 3;

      const hoursSince = Math.random() * 72; // Random hours between 0-72
      const recency = 100 / (hoursSince + 1);

      const score = engagement + recency;

      return {
        ...post,
        score: Math.round(score),
      };
    });

    // Insert posts
    const createdPosts = await Post.insertMany(postsWithScores);
    console.info(`Created ${createdPosts.length} posts successfully!`);

    // Update user post references and stats
    for (const post of createdPosts) {
      await User.findByIdAndUpdate(post.author, {
        $push: { posts: post._id },
        $inc: { 'stats.postsCount': 1 },
      });
    }

    console.info('Updated user post references');

    // Log created posts
    createdPosts.forEach((post) => {
      const author = users.find((u) => u._id.toString() === post.author.toString());
      console.info(`- ${post.type} by ${author?.name} - ${post.caption.substring(0, 50)}...`);
    });

    console.info('\n✅ Post seeding completed successfully!');
    console.info(`Total posts created: ${createdPosts.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
