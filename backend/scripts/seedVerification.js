require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/src/models/User.model');
const VerificationRequest = require('../server/src/models/VerificationRequest.model');

const seedVerification = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({});
    if (!user) {
      console.log('No user found to create verification request for');
      process.exit(0);
    }

    const existingRequest = await VerificationRequest.findOne({ user: user._id });
    if (existingRequest) {
      console.log('Verification request already exists for this user');
      process.exit(0);
    }

    const request = new VerificationRequest({
      user: user._id,
      verificationType: 'CREATOR',
      status: 'PENDING',
      reason: 'I am a popular filmmaker with over 10 years of experience.',
      documents: [
        {
          type: 'ID_DOCUMENT',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          name: 'Passport.jpg'
        },
        {
          type: 'PROOF_OF_WORK',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          name: 'IMDb_Profile.pdf'
        }
      ]
    });

    await request.save();
    console.log('Dummy verification request created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding verification:', error);
    process.exit(1);
  }
};

seedVerification();
