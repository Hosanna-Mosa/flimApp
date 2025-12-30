require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Post = require('../server/src/models/Post.model');
const User = require('../server/src/models/User.model');

const seedPosts = [
  // Raj Malhotra - Director/Producer
  {
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
    caption: 'Behind the scenes from our latest shoot! The dedication and hard work that goes into every frame is incredible. #FilmMaking #BTS',
    industries: ['bollywood'],
    roles: ['director', 'producer'],
    engagement: { likesCount: 234, commentsCount: 45, sharesCount: 12, viewsCount: 1250 },
    authorEmail: 'raj@example.com',
  },
  {
    type: 'script',
    mediaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    caption: 'Excited to share a glimpse of our upcoming project screenplay. Years of research went into this! 📝',
    industries: ['bollywood'],
    roles: ['director', 'producer'],
    engagement: { likesCount: 298, commentsCount: 56, sharesCount: 31, viewsCount: 1456 },
    authorEmail: 'raj@example.com',
  },
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1492691523567-f73b3f550534?w=800',
    caption: 'Scouting locations in Himachal. The mountains have a story to tell.',
    industries: ['bollywood'],
    roles: ['director'],
    engagement: { likesCount: 412, commentsCount: 28, sharesCount: 15, viewsCount: 980 },
    authorEmail: 'raj@example.com',
  },
  {
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    caption: 'Final color grading session for the teaser. Almost there! 🎞️',
    industries: ['bollywood'],
    roles: ['producer'],
    engagement: { likesCount: 567, commentsCount: 89, sharesCount: 45, viewsCount: 5400 },
    authorEmail: 'raj@example.com',
  },

  // Priya Sharma - DOP/Editor
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800',
    caption: 'Golden hour magic ✨ Nothing beats natural lighting for emotional scenes.',
    industries: ['bollywood', 'punjabi'],
    roles: ['dop', 'editor'],
    engagement: { likesCount: 189, commentsCount: 23, sharesCount: 8, viewsCount: 876 },
    authorEmail: 'priya@example.com',
  },
  {
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    caption: 'New camera gear arrived! Testing out the 4K capabilities. The clarity is mind-blowing! 📹',
    industries: ['bollywood', 'punjabi'],
    roles: ['dop'],
    engagement: { likesCount: 445, commentsCount: 78, sharesCount: 34, viewsCount: 2134 },
    authorEmail: 'priya@example.com',
  },
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800',
    caption: 'Midnight editing session. Crafting the pace of our upcoming thriller.',
    industries: ['punjabi'],
    roles: ['editor'],
    engagement: { likesCount: 156, commentsCount: 19, sharesCount: 5, viewsCount: 1200 },
    authorEmail: 'priya@example.com',
  },
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1500462859233-17b7524c715b?w=800',
    caption: 'Anamorphic lenses are worth the struggle. The flare is just ❤️',
    industries: ['bollywood'],
    roles: ['dop'],
    engagement: { likesCount: 890, commentsCount: 145, sharesCount: 67, viewsCount: 8900 },
    authorEmail: 'priya@example.com',
  },

  // Arjun Kumar - Actor
  {
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    caption: 'Action sequence rehearsal. Perfecting every move before the final take! 🎬',
    industries: ['tollywood', 'kollywood'],
    roles: ['actor'],
    engagement: { likesCount: 412, commentsCount: 67, sharesCount: 23, viewsCount: 2345 },
    authorEmail: 'arjun@example.com',
  },
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=800',
    caption: 'Character study session. Getting into the mindset for the next role. #ActorLife',
    industries: ['tollywood'],
    roles: ['actor'],
    engagement: { likesCount: 678, commentsCount: 92, sharesCount: 45, viewsCount: 3421 },
    authorEmail: 'arjun@example.com',
  },
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
    caption: 'Flashback to my first theater performance. Where it all began.',
    industries: ['kollywood'],
    roles: ['actor'],
    engagement: { likesCount: 1200, commentsCount: 340, sharesCount: 89, viewsCount: 15000 },
    authorEmail: 'arjun@example.com',
  },
  {
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=800',
    caption: 'Dubbing session complete. The energy in this film is next level!',
    industries: ['tollywood'],
    roles: ['actor'],
    engagement: { likesCount: 789, commentsCount: 112, sharesCount: 56, viewsCount: 7800 },
    authorEmail: 'arjun@example.com',
  },

  // Maya Iyer - Music
  {
    type: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    caption: 'Working on the theme for an upcoming romantic drama. Traditional instruments meet modern production 🎵',
    industries: ['mollywood', 'kollywood'],
    roles: ['music'],
    engagement: { likesCount: 156, commentsCount: 34, sharesCount: 19, viewsCount: 543 },
    authorEmail: 'maya@example.com',
  },
  {
    type: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    caption: 'Experimenting with new sounds for the upcoming thriller. Dark and intense! 🎼',
    industries: ['kollywood'],
    roles: ['music'],
    engagement: { likesCount: 234, commentsCount: 45, sharesCount: 28, viewsCount: 876 },
    authorEmail: 'maya@example.com',
  },
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
    caption: 'My sanctuary. Where melodies are born.',
    industries: ['mollywood'],
    roles: ['music'],
    engagement: { likesCount: 445, commentsCount: 32, sharesCount: 12, viewsCount: 2100 },
    authorEmail: 'maya@example.com',
  },
  {
    type: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    caption: 'Folk music reimagined. Coming soon to a theater near you!',
    industries: ['kollywood'],
    roles: ['music'],
    engagement: { likesCount: 980, commentsCount: 156, sharesCount: 78, viewsCount: 12000 },
    authorEmail: 'maya@example.com',
  },

  // Vikram Patel - Action Director
  {
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800',
    caption: 'Safety first! Drilling the complex wire-work for the climax sequence. #NoFear',
    industries: ['bollywood', 'tollywood'],
    roles: ['fight-director', 'stunt'],
    engagement: { likesCount: 890, commentsCount: 120, sharesCount: 45, viewsCount: 9800 },
    authorEmail: 'vikram@example.com',
  },
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
    caption: 'Training the next generation of stunt professionals.',
    industries: ['bollywood'],
    roles: ['stunt'],
    engagement: { likesCount: 345, commentsCount: 28, sharesCount: 14, viewsCount: 1500 },
    authorEmail: 'vikram@example.com',
  },
  {
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593033516515-99460039750c?w=800',
    caption: 'Explosion planning for tomorrow shoot. Precision is key. 💣',
    industries: ['tollywood'],
    roles: ['fight-director'],
    engagement: { likesCount: 1500, commentsCount: 230, sharesCount: 110, viewsCount: 25000 },
    authorEmail: 'vikram@example.com',
  },

  // Ananya Reddy - Costume Designer (Private)
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800',
    caption: 'Fabric hunting in old market. Finding the perfect texture for the lead character.',
    industries: ['bollywood', 'fashion'],
    roles: ['costume', 'designer'],
    engagement: { likesCount: 456, commentsCount: 34, sharesCount: 12, viewsCount: 2300 },
    authorEmail: 'ananya@example.com',
  },
  {
    type: 'script',
    mediaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    caption: 'Sketchbook reveal. How we envisioned the period drama costumes.',
    industries: ['bollywood'],
    roles: ['designer'],
    engagement: { likesCount: 678, commentsCount: 56, sharesCount: 28, viewsCount: 4500 },
    authorEmail: 'ananya@example.com',
  },
  {
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1537832816519-689ad163238b?w=800',
    caption: 'The final fitting. Perfection in every stitch.',
    industries: ['fashion'],
    roles: ['costume'],
    engagement: { likesCount: 2300, commentsCount: 180, sharesCount: 56, viewsCount: 35000 },
    authorEmail: 'ananya@example.com',
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.info('Connected to MongoDB');

    const users = await User.find({});
    if (users.length === 0) {
      console.error('No users found! Please run seedUsers.js first.');
      process.exit(1);
    }

    const emailToUser = {};
    users.forEach((user) => {
      emailToUser[user.email] = user;
    });

    await Post.deleteMany({});
    console.info('Cleared existing posts');

    const postsToInsert = seedPosts.map((post) => {
      const author = emailToUser[post.authorEmail];
      if (!author) {
        console.warn(`Author not found for email: ${post.authorEmail}`);
        return null;
      }

      const { authorEmail, mediaUrl, thumbnailUrl, ...postData } = post;
      return {
        ...postData,
        author: author._id,
        media: {
          url: mediaUrl,
          thumbnail: thumbnailUrl
        }
      };
    }).filter(Boolean);

    const postsWithScores = postsToInsert.map((post) => {
      const engagement =
        (post.engagement.likesCount || 0) * 1 +
        (post.engagement.commentsCount || 0) * 2 +
        (post.engagement.sharesCount || 0) * 3;

      const hoursSince = Math.random() * 72;
      const recency = 100 / (hoursSince + 1);
      const score = engagement + recency;

      return {
        ...post,
        score: Math.round(score),
        isActive: true,
        visibility: 'public',
        createdAt: new Date(Date.now() - hoursSince * 60 * 60 * 1000)
      };
    });

    const createdPosts = await Post.insertMany(postsWithScores);
    console.info(`Created ${createdPosts.length} posts successfully!`);

    await User.updateMany({}, { $set: { posts: [], 'stats.postsCount': 0 } });
    
    for (const post of createdPosts) {
      await User.findByIdAndUpdate(post.author, {
        $push: { posts: post._id },
        $inc: { 'stats.postsCount': 1 },
      });
    }

    console.info('Updated user post references and stats');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
