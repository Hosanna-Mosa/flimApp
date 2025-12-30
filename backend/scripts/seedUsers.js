require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/src/models/User.model');

const seedUsers = [
  {
    name: 'Raj Malhotra',
    email: 'raj@example.com',
    phone: '9876543210',
    password: 'password123', // Will be hashed
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=raj',
    bio: 'Award-winning director with 15+ years in Bollywood',
    roles: ['director', 'producer'],
    industries: ['bollywood'],
    experience: 15,
    location: 'Mumbai',
    isVerified: true,
    accountType: 'public',
    stats: {
      followersCount: 1245,
      followingCount: 423,
      postsCount: 5,
      likesReceived: 1099,
    },
    privacy: {
      showFollowers: true,
      showFollowing: true,
      allowComments: true,
      allowShares: true,
      allowMessages: true,
    },
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543211',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=priya',
    bio: 'Cinematographer | Capturing stories through lens',
    roles: ['dop', 'editor'],
    industries: ['bollywood', 'punjabi'],
    experience: 8,
    location: 'Delhi',
    isVerified: false,
    accountType: 'public',
    stats: {
      followersCount: 876,
      followingCount: 312,
      postsCount: 1,
      likesReceived: 189,
    },
    privacy: {
      showFollowers: true,
      showFollowing: true,
      allowComments: true,
      allowShares: true,
      allowMessages: true,
    },
  },
  {
    name: 'Arjun Kumar',
    email: 'arjun@example.com',
    phone: '9876543212',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=arjun',
    bio: 'Actor | Theater to Cinema',
    roles: ['actor'],
    industries: ['tollywood', 'kollywood'],
    experience: 5,
    location: 'Hyderabad',
    isVerified: false,
    accountType: 'public',
    stats: {
      followersCount: 2134,
      followingCount: 156,
      postsCount: 1,
      likesReceived: 412,
    },
    privacy: {
      showFollowers: true,
      showFollowing: true,
      allowComments: true,
      allowShares: true,
      allowMessages: true,
    },
  },
  {
    name: 'Maya Iyer',
    email: 'maya@example.com',
    phone: '9876543213',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=maya',
    bio: 'Music Composer | Blending tradition with modern',
    roles: ['music'],
    industries: ['mollywood', 'kollywood'],
    experience: 12,
    location: 'Chennai',
    isVerified: false,
    accountType: 'public',
    stats: {
      followersCount: 1567,
      followingCount: 89,
      postsCount: 1,
      likesReceived: 156,
    },
    privacy: {
      showFollowers: true,
      showFollowing: true,
      allowComments: true,
      allowShares: true,
      allowMessages: true,
    },
  },
  {
    name: 'Vikram Patel',
    email: 'vikram@example.com',
    phone: '9876543214',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=vikram',
    bio: 'Action Director | Choreographing thrills since 2010',
    roles: ['fight-director', 'stunt'],
    industries: ['bollywood', 'tollywood'],
    experience: 14,
    location: 'Mumbai',
    isVerified: true,
    accountType: 'business',
    stats: {
      followersCount: 3421,
      followingCount: 234,
      postsCount: 0,
      likesReceived: 0,
    },
    privacy: {
      showFollowers: true,
      showFollowing: true,
      allowComments: true,
      allowShares: true,
      allowMessages: true,
    },
  },
  {
    name: 'Ananya Reddy',
    email: 'ananya@example.com',
    phone: '9876543215',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=ananya',
    bio: 'Costume Designer | Fashion meets Film',
    roles: ['costume', 'designer'],
    industries: ['bollywood', 'fashion'],
    experience: 6,
    location: 'Mumbai',
    isVerified: false,
    accountType: 'private',
    stats: {
      followersCount: 543,
      followingCount: 421,
      postsCount: 0,
      likesReceived: 0,
    },
    privacy: {
      showFollowers: false,
      showFollowing: false,
      allowComments: true,
      allowShares: false,
      allowMessages: false,
    },
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop all indexes on users collection to start fresh
    try {
      await mongoose.connection.db.collection('users').dropIndexes();
      console.log('Dropped existing indexes');
    } catch (err) {
      // Collection might not exist, ignore
    }

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords and create users
    const usersToInsert = await Promise.all(
      seedUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return {
          ...user,
          password: hashedPassword,
        };
      })
    );

    // Insert users
    const createdUsers = await User.insertMany(usersToInsert);
    console.log(`Created ${createdUsers.length} users successfully!`);

    // Log created users
    createdUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.email}) - ID: ${user._id}`);
    });

    console.log('\n✅ User seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('Email: raj@example.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
