require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const Admin = require('../models/Admin.model');
const connectDB = require('../config/db');

const seedAdmin = async () => {
    try {
        const uri = "mongodb+srv://hosannaking2019_db_user:79ygmfZiPPfJRWnE@cluster0.tv8wnu0.mongodb.net/?appName=Cluster0";
        await connectDB(uri);

        const adminEmail = 'admin1@testing.com';
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        const admin = new Admin({
            name: 'Super Admin',
            email: adminEmail,
            password: 'admin123', // You should change this in production
            role: 'SUPER_ADMIN'
        });

        await admin.save();
        console.log('Admin seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
