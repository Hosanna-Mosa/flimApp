require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../server/src/models/Admin.model');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'System Admin';

    if (!email || !password) {
      console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.');
      process.exit(1);
    }
    if (password.length < 12) {
      console.error('ADMIN_PASSWORD must be at least 12 characters.');
      process.exit(1);
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const admin = new Admin({
      name,
      email,
      password,
      role: 'SUPER_ADMIN'
    });

    await admin.save();
    console.log(`Admin created successfully!`);
    console.log(`Email: ${email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
