require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/src/models/User.model');
const Post = require('./server/src/models/Post.model');
const feedService = require('./server/src/services/feed.service');

// Mock Redis
process.env.ENABLE_REDIS = 'false';
require('./server/src/config/redis');

async function debugFeed() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const users = await User.find().limit(1);
        const testUser = users[0];
        console.log(`Test User: ${testUser.name} (${testUser._id})`);

        // 1. Check raw posts
        const allPosts = await Post.find().limit(5).select('author visibility createdAt type');
        console.log('--- Sample Posts ---');
        allPosts.forEach(p => {
            console.log(`id: ${p._id}, author: ${p.author}, vis: ${p.visibility}, created: ${p.createdAt}`);
        });

        // 2. Check query params logic
        const timeRange = 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeRange);
        console.log(`Cutoff Date: ${cutoffDate.toISOString()}`);

        // 3. Run the exact query `getHybridFeed` uses
        const query = {
            author: { $ne: testUser._id },
            isActive: true,
            createdAt: { $gte: cutoffDate },
            // Simplified visibility check for debugging
            visibility: 'public'
        };

        console.log('--- Testing Query ---');
        console.log(JSON.stringify(query));

        const count = await Post.countDocuments(query);
        console.log(`Matching Posts Count (Public, !Own, Recent): ${count}`);

        if (count === 0) {
            console.log('Diagnostics:');
            const others = await Post.countDocuments({ author: { $ne: testUser._id } });
            console.log(`- Posts by others: ${others}`);

            const recent = await Post.countDocuments({ createdAt: { $gte: cutoffDate } });
            console.log(`- Posts recent enough: ${recent}`);

            const publicPosts = await Post.countDocuments({ visibility: 'public' });
            console.log(`- Public posts: ${publicPosts}`);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugFeed();
