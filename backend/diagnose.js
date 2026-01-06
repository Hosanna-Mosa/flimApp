require('dotenv').config({ path: 'e:/App/Filmy10/flimApp/backend/.env' });
const mongoose = require('mongoose');
const User = require('./server/src/models/User.model');
const Post = require('./server/src/models/Post.model');
const feedService = require('./server/src/services/feed.service');

// Mock Redis
process.env.ENABLE_REDIS = 'false';
require('./server/src/config/redis');

async function start() {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Pick a random user who is NOT the author of all posts (if possible)
        // Let's just pick the first user
        const users = await User.find().limit(5);
        if (!users.length) { console.log('No users'); return; }

        const testUser = users[0];
        console.log(`\n--- Test User: ${testUser.name} (${testUser._id}) ---`);

        // 2. Look at available posts
        const posts = await Post.find().sort({ createdAt: -1 }).limit(5).lean();
        console.log(`\n--- Recent 5 Posts in DB ---`);
        for (const p of posts) {
            const isOwn = p.author.toString() === testUser._id.toString();
            console.log(`Post ${p._id}: Author=${p.author}, IsOwn=${isOwn}, Vis=${p.visibility}, Created=${p.createdAt.toISOString()}`);
        }

        // 3. Replicate Feed Query Logic
        const timeRange = 365;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeRange);

        const query = {
            author: { $ne: testUser._id },
            isActive: true,
            createdAt: { $gte: cutoffDate },
            visibility: 'public' // assuming no following for simple test
        };

        console.log(`\n--- Testing Manual Query ---`);
        console.log(`Criteria: Author != ${testUser._id}, match public, date >= ${cutoffDate.toISOString()}`);
        const count = await Post.countDocuments(query);
        console.log(`Matches found: ${count}`);

        if (count === 0) {
            console.log("!!! The query returns 0 documents. This is why the feed is empty.");
            // Diagnostics
            const total = await Post.countDocuments();
            const own = await Post.countDocuments({ author: testUser._id });
            const recent = await Post.countDocuments({ createdAt: { $gte: cutoffDate } });
            const publicVis = await Post.countDocuments({ visibility: 'public' });

            console.log(`Total: ${total}, Own: ${own}, Recent: ${recent}, Public: ${publicVis}`);
        } else {
            console.log("Query matched documents! Running service...");
            const feed = await feedService.getPersonalizedFeed(testUser._id);
            console.log(`Service returned: ${feed.data.length} items`);
            if (feed.data.length === 0) {
                console.log("Service returned 0 but query matched! Checking enrichPosts or population.");
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

start();
