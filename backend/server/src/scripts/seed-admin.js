require('dotenv').config({ path: '../../.env' });
const Admin = require('../models/Admin.model');
const connectDB = require('../config/db');

const seedAdmin = async () => {
    try {
        await connectDB(process.env.MONGODB_URI);

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.');
            process.exit(1);
        }
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        const admin = new Admin({
            name: 'Super Admin',
            email: adminEmail,
            password: adminPassword,
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
