# 🚀 Filmy - Quick Reference Guide

## 📋 Table of Contents
1. [Getting Started](#getting-started)
2. [Common Tasks](#common-tasks)
3. [API Quick Reference](#api-quick-reference)
4. [Database Queries](#database-queries)
5. [Troubleshooting](#troubleshooting)

---

## 🏁 Getting Started

### **Start Backend**
```bash
cd backend
npm run dev
# Server runs on http://localhost:8000
```

### **Start Frontend**
```bash
cd app
npx expo start -c
# Press 'a' for Android, 'i' for iOS, 'w' for Web
```

### **Check Services**
```bash
# MongoDB
mongosh

# Redis
redis-cli ping  # Should return PONG

# Check logs
tail -f backend/server/logs/combined.log
```

---

## 🔧 Common Tasks

### **1. Add New API Endpoint**

**Backend (3 files):**

1. **Route** (`backend/server/src/routes/example.routes.js`)
```javascript
const router = require('express').Router();
const { protect } = require('../middlewares/auth.middleware');
const controller = require('../controllers/example.controller');

router.get('/', protect, controller.getAll);
router.post('/', protect, controller.create);

module.exports = router;
```

2. **Controller** (`backend/server/src/controllers/example.controller.js`)
```javascript
const service = require('../services/example.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
```

3. **Service** (`backend/server/src/services/example.service.js`)
```javascript
const Model = require('../models/Example.model');

exports.getAll = async (userId) => {
  return await Model.find({ user: userId });
};
```

4. **Register Route** (`backend/server/src/app.js`)
```javascript
const exampleRoutes = require('./routes/example.routes');
app.use('/api/example', exampleRoutes);
```

**Frontend:**

Add to `app/utils/api.ts`:
```typescript
export const apiGetExample = (token?: string) =>
  request('/api/example', { token });

// Add to default export
export const api = {
  // ... existing
  getExample: apiGetExample,
};
```

---

### **2. Add New Screen**

1. **Create file** `app/app/example.tsx`
```typescript
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ExampleScreen() {
  const { colors } = useTheme();
  
  return (
    <>
      <Stack.Screen options={{ title: 'Example' }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text }}>Example Screen</Text>
      </View>
    </>
  );
}
```

2. **Navigate to it:**
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/example');
```

---

### **3. Add Socket Event**

**Backend** (`backend/server/src/sockets/chat.socket.js`):
```javascript
socket.on('custom_event', async (data) => {
  try {
    // Process data
    const result = await someService.process(data);
    
    // Emit to specific user
    io.to(userId).emit('custom_response', result);
    
    // Or broadcast to room
    io.to(`room_${roomId}`).emit('custom_response', result);
  } catch (error) {
    console.error('Error:', error);
  }
});
```

**Frontend** (`app/contexts/SocketContext.tsx`):
```typescript
useEffect(() => {
  if (!socket) return;
  
  socket.on('custom_response', (data) => {
    console.log('Received:', data);
    // Update state
  });
  
  return () => {
    socket.off('custom_response');
  };
}, [socket]);

// Emit event
socket?.emit('custom_event', { data: 'value' });
```

---

### **4. Add Background Job**

**Backend** (`backend/server/src/services/queue.service.js`):
```javascript
// Add new queue
const customQueue = new Queue('custom-queue', {
  redis: redisConfig,
});

// Add job
exports.addCustomJob = async (data) => {
  await customQueue.add('process-custom', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
};
```

**Processor** (`backend/server/src/workers/processors.js`):
```javascript
customQueue.process('process-custom', async (job) => {
  const { data } = job.data;
  
  try {
    // Process job
    await someService.process(data);
    return { success: true };
  } catch (error) {
    logger.error('Job failed:', error);
    throw error;
  }
});
```

---

## 📡 API Quick Reference

### **Authentication**
```typescript
// Login
await api.login(phone);
await api.verifyOtp(phone, otp);

// Get current user
const user = await api.me(token);

// Update profile
await api.updateMe({ name: 'New Name' }, token);
```

### **Posts**
```typescript
// Create post
await api.createPost({
  type: 'image',
  media: { url: 'https://...' },
  caption: 'My post',
}, token);

// Get feed
const feed = await api.getFeed(0, 20, 'hybrid', 7, token);

// Delete post
await api.deletePost(postId, token);
```

### **Social**
```typescript
// Like
await api.likePost(postId, token);
await api.unlikePost(postId, token);

// Follow
await api.followUser(userId, token);
await api.unfollowUser(userId, token);

// Comment
await api.addComment(postId, 'Great!', null, token);

// Share
await api.sharePost(postId, { shareType: 'repost' }, token);
```

### **Communities**
```typescript
// Create
await api.createCommunity({
  name: 'My Community',
  type: 'industry',
  privacy: 'public',
}, token);

// Join
await api.joinCommunity(communityId, token);

// Post
await api.createCommunityPost(communityId, {
  groupId: groupId,
  type: 'text',
  content: 'Hello!',
}, token);
```

---

## 🗄️ Database Queries

### **Common Mongoose Queries**

```javascript
// Find with population
const posts = await Post.find({ author: userId })
  .populate('author', 'name avatar isVerified')
  .sort({ createdAt: -1 })
  .limit(20);

// Update with increment
await Post.findByIdAndUpdate(postId, {
  $inc: { 'engagement.likesCount': 1 }
});

// Aggregation
const stats = await Post.aggregate([
  { $match: { author: userId } },
  { $group: {
    _id: '$type',
    count: { $sum: 1 },
    totalLikes: { $sum: '$engagement.likesCount' }
  }}
]);

// Text search
const users = await User.find({
  $text: { $search: query }
}).limit(20);
```

### **Redis Commands**

```javascript
const redis = require('./config/redis');

// Set with expiry
await redis.setex(`key:${id}`, 60, JSON.stringify(data));

// Get
const data = await redis.get(`key:${id}`);
const parsed = JSON.parse(data);

// Delete
await redis.del(`key:${id}`);

// Increment
await redis.incr(`counter:${id}`);

// Add to set
await redis.sadd(`set:${id}`, value);

// Check if in set
const exists = await redis.sismember(`set:${id}`, value);
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. "Failed to get feed" Error**
```bash
# Check backend logs
tail -f backend/server/logs/error.log

# Check if Redis is running
redis-cli ping

# Restart backend
cd backend && npm run dev
```

#### **2. Socket Connection Issues**
```typescript
// Frontend: Check socket status
console.log('Socket connected:', socket?.connected);

// Backend: Check logs
grep "Socket" backend/server/logs/combined.log
```

#### **3. Image Upload Fails**
```bash
# Check Cloudinary credentials
cat backend/.env | grep CLOUDINARY

# Test signature endpoint
curl -X POST http://localhost:8000/media/signature \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "image"}'
```

#### **4. MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongosh

# Check connection string
cat backend/.env | grep MONGODB_URI

# Restart MongoDB
brew services restart mongodb-community
```

#### **5. Expo Build Issues**
```bash
# Clear cache
cd app
rm -rf node_modules
npm install
npx expo start -c
```

---

## 🔍 Debugging Tips

### **Backend Debugging**
```javascript
// Add detailed logging
const logger = require('./config/logger');

logger.info('Processing request', { userId, postId });
logger.error('Error occurred', { error: error.message, stack: error.stack });

// Use debugger
debugger; // Add breakpoint
node --inspect server/src/server.js
```

### **Frontend Debugging**
```typescript
// Console logs with context
console.log('[Component] Action:', data);

// React DevTools
// Install: https://github.com/facebook/react-devtools

// Network debugging
console.log('[API Request]', method, path, body);
console.log('[API Response]', status, data);
```

### **Redis Debugging**
```bash
# Monitor all commands
redis-cli monitor

# Check keys
redis-cli keys "user:*"

# Get value
redis-cli get "user:123:stats"

# Check memory
redis-cli info memory
```

---

## 📊 Performance Monitoring

### **Check Response Times**
```bash
# Backend logs show timing
grep "ms" backend/server/logs/combined.log

# Redis stats
redis-cli info stats
```

### **Database Performance**
```javascript
// Enable query logging
mongoose.set('debug', true);

// Check slow queries
db.setProfilingLevel(1, { slowms: 100 });
db.system.profile.find().limit(10).sort({ ts: -1 });
```

---

## 🔑 Environment Variables

### **Backend Required**
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/flimapp
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_secret_here
REDIS_HOST=localhost
REDIS_PORT=6379
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### **Frontend Required**
```env
EXPO_PUBLIC_API_URL=http://10.18.107.42:8000
```

---

## 🧪 Testing

### **Manual API Testing**
```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "+1234567890"}'

# Get feed
curl -X GET http://localhost:8000/api/feed \
  -H "Authorization: Bearer YOUR_TOKEN"

# Like post
curl -X POST http://localhost:8000/api/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 Common Frontend Patterns

### **Optimistic Update**
```typescript
const [liked, setLiked] = useState(false);
const [count, setCount] = useState(0);

const handleLike = async () => {
  // Update UI immediately
  setLiked(!liked);
  setCount(liked ? count - 1 : count + 1);
  
  try {
    // Sync with server
    const result = await api.likePost(postId, token);
    setCount(result.likesCount);
  } catch (error) {
    // Revert on error
    setLiked(liked);
    setCount(count);
  }
};
```

### **Infinite Scroll**
```typescript
const [page, setPage] = useState(0);
const [loading, setLoading] = useState(false);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  if (loading || !hasMore) return;
  
  setLoading(true);
  const result = await api.getFeed(page + 1, 20, token);
  
  setData([...data, ...result.data]);
  setPage(page + 1);
  setHasMore(result.data.length === 20);
  setLoading(false);
};

<FlatList
  data={data}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

---

## 🎯 Best Practices

1. **Always use try-catch** for async operations
2. **Implement loading states** for better UX
3. **Use optimistic updates** for instant feedback
4. **Cache data** when appropriate
5. **Log errors** with context
6. **Validate inputs** on both frontend and backend
7. **Use TypeScript types** for API responses
8. **Handle edge cases** (no data, errors, etc.)
9. **Test on multiple devices** (iOS, Android, Web)
10. **Monitor performance** (response times, memory)

---

**Last Updated:** December 27, 2025  
**Maintained by:** Development Team
