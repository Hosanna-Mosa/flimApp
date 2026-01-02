require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../server/src/models/Admin.model');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@flimy.app';
    const password = 'adminpassword123';
    const name = 'System Admin';

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
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
