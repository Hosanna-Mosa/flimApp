require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/src/models/User.model');
const VerificationRequest = require('../server/src/models/VerificationRequest.model');

const mockRequestsData = [
  {
    userData: {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      phone: '1234567890',
      roles: ['actor'], // Mapping CREATOR to actor for user model compatibility
      industries: ['bollywood'],
      bio: 'Digital content creator and lifestyle influencer',
      isVerified: false,
    },
    requestData: {
      verificationType: 'CREATOR',
      status: 'PENDING',
      reason: 'I have 500k followers on Instagram and create daily lifestyle content.',
      documents: [
        { type: 'SOCIAL_LINK', url: 'https://instagram.com/sarahjohnson', name: 'Instagram Profile' }
      ],
      createdAt: '2024-12-28T14:30:00Z',
    }
  },
  {
    userData: {
      name: 'Tech Gadgets Inc',
      email: 'contact@techgadgets.com',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      phone: '1234567891',
      roles: ['producer'], // Mapping BRAND to producer
      industries: ['bollywood'],
      bio: 'Leading tech accessories brand',
      isVerified: false,
    },
    requestData: {
      verificationType: 'BRAND',
      status: 'PENDING',
      reason: 'We are an established tech brand with official business registration.',
      documents: [
        { type: 'ID_DOCUMENT', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', name: 'Business Registration' }
      ],
      createdAt: '2024-12-27T09:15:00Z',
    }
  },
  {
    userData: {
      name: 'Michael Chen',
      email: 'michael@news.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      phone: '1234567892',
      roles: ['writer'], // Mapping JOURNALIST context to writer
      industries: ['bollywood'],
      bio: 'Senior journalist at Daily News',
      isVerified: true,
    },
    requestData: {
      verificationType: 'JOURNALIST',
      status: 'APPROVED',
      reason: 'I am a senior journalist at Daily News covering tech and business.',
      documents: [
        { type: 'PROOF_OF_WORK', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', name: 'Press ID Card' }
      ],
      adminNotes: 'Verified press credentials.',
      createdAt: '2024-12-20T11:00:00Z',
      reviewedAt: '2024-12-21T15:30:00Z',
    }
  },
  {
    userData: {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      avatar: null,
      phone: '1234567893',
      roles: ['actor'],
      industries: ['bollywood'],
      bio: 'Aspiring influencer',
      isVerified: false,
    },
    requestData: {
      verificationType: 'PUBLIC_FIGURE',
      status: 'REJECTED',
      reason: 'I want to be verified because I am famous.',
      documents: [],
      adminNotes: 'Insufficient documentation provided.',
      createdAt: '2024-12-22T16:45:00Z',
      reviewedAt: '2024-12-23T10:00:00Z',
    }
  }
];

const seedMockData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing mock data to avoid unique constraint errors
    const emails = mockRequestsData.map(item => item.userData.email);
    const phones = mockRequestsData.map(item => item.userData.phone);
    
    // Find users to delete their requests too
    const existingUsers = await User.find({ $or: [{ email: { $in: emails } }, { phone: { $in: phones } }] });
    const userIds = existingUsers.map(u => u._id);
    
    await VerificationRequest.deleteMany({ user: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    
    console.log('Cleared existing mock users and requests');

    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const item of mockRequestsData) {
      // Create User
      const user = new User({
        ...item.userData,
        password: hashedPassword,
      });
      await user.save();
      console.log(`Created user: ${user.name}`);

      // Create Verification Request
      const request = new VerificationRequest({
        ...item.requestData,
        user: user._id,
        // Hack to set createdAt manually since it is a timestamp field
      });
      
      // We use create() then update manually for specific timestamps if needed, 
      // but mongoose handles createdAt. If we want exact mock times:
      await request.save();
      
      // Update timestamps to match mock data
      await VerificationRequest.findByIdAndUpdate(request._id, {
        createdAt: new Date(item.requestData.createdAt)
      });
      
      console.log(`Created ${item.requestData.status} verification request for ${user.name}`);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedMockData();
