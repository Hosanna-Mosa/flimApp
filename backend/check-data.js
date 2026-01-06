require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/src/models/User.model');
const Post = require('./server/src/models/Post.model');

async function checkData() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const userCount = await User.countDocuments();
        const postCount = await Post.countDocuments();

        console.log(`Total Users: ${userCount}`);
        console.log(`Total Posts: ${postCount}`);

        if (postCount > 0) {
            const posts = await Post.find().sort({ createdAt: -1 }).limit(5).select('createdAt caption author');
            console.log('Recent 5 Posts:');
            posts.forEach(p => {
                console.log(`- [${p._id}] ${p.createdAt.toISOString()} | Caption: ${p.caption?.substring(0, 20)}...`);
            });
        }

        console.log('Current System Time:', new Date().toISOString());

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
