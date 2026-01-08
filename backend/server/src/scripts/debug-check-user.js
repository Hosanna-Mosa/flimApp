const mongoose = require('mongoose');
const User = require('../models/user.model');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const checkRecentUsers = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flim';
        console.log(`DB URI: ${uri.substring(0, 20)}...`);
        await mongoose.connect(uri);

        const recentUsers = await User.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select('email name phone createdAt');

        console.log(`--- Last 5 Users ---`);
        recentUsers.forEach(u => {
            console.log(`[${u.createdAt.toISOString().split('T')[1].substring(0, 8)}] ${u.email} | ${u.phone}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkRecentUsers();
