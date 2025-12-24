# Social Media Features Implementation Plan

## Overview
Implementing efficient social media features (likes, comments, shares, follows) using industry-standard patterns from platforms like Instagram, Twitter, and Facebook.

## Architecture Principles

### 1. **Write-Through Cache Pattern**
- Immediate writes to cache (Redis)
- Async batch updates to database
- Fast read performance

### 2. **Denormalization for Performance**
- Store counts in multiple places
- Trade storage for speed
- Eventual consistency acceptable

### 3. **Optimistic Updates**
- Update UI immediately
- Queue background jobs
- Handle failures gracefully

## Database Schema Design

### User Model Enhancements
```javascript
{
  // Existing fields...
  
  // Social Features
  isVerified: Boolean,
  accountType: String, // 'public', 'private', 'business'
  
  // Cached Counts (denormalized)
  stats: {
    followersCount: Number,
    followingCount: Number,
    postsCount: Number,
    likesReceived: Number
  },
  
  // Reference Arrays (for small datasets)
  posts: [ObjectId], // Recent posts only (limit 100)
  
  // Settings
  privacy: {
    showFollowers: Boolean,
    showFollowing: Boolean,
    allowComments: Boolean,
    allowShares: Boolean
  }
}
```

### Post Model Enhancements
```javascript
{
  // Existing fields...
  
  // Engagement (cached counts)
  engagement: {
    likesCount: Number,
    commentsCount: Number,
    sharesCount: Number,
    viewsCount: Number
  },
  
  // Privacy
  visibility: String, // 'public', 'followers', 'private'
  
  // Performance
  isActive: Boolean,
  
  // Indexes for queries
  // Index: { author: 1, createdAt: -1 }
  // Index: { 'engagement.likesCount': -1, createdAt: -1 }
}
```

### New Models

#### 1. Follow Model (Relationship)
```javascript
{
  follower: ObjectId, // User who follows
  following: ObjectId, // User being followed
  status: String, // 'pending', 'accepted' (for private accounts)
  createdAt: Date
}
// Indexes: 
// - { follower: 1, following: 1 } unique
// - { following: 1, createdAt: -1 }
// - { follower: 1, createdAt: -1 }
```

#### 2. Like Model (Interaction)
```javascript
{
  user: ObjectId,
  post: ObjectId,
  createdAt: Date
}
// Indexes:
// - { user: 1, post: 1 } unique
// - { post: 1, createdAt: -1 }
// - { user: 1, createdAt: -1 }
```

#### 3. Comment Model
```javascript
{
  user: ObjectId,
  post: ObjectId,
  content: String,
  parentComment: ObjectId, // For replies
  likesCount: Number,
  repliesCount: Number,
  isActive: Boolean,
  createdAt: Date
}
// Indexes:
// - { post: 1, createdAt: -1 }
// - { parentComment: 1, createdAt: -1 }
```

#### 4. Share Model
```javascript
{
  user: ObjectId,
  post: ObjectId,
  shareType: String, // 'repost', 'quote', 'external'
  caption: String, // For quote shares
  createdAt: Date
}
```

## Redis Cache Strategy

### Cache Keys Pattern
```
user:{userId}:stats -> Hash of user stats
post:{postId}:likes -> Sorted Set (score: timestamp, member: userId)
post:{postId}:stats -> Hash of post engagement
user:{userId}:liked -> Set of postIds
user:{userId}:followers -> Sorted Set
user:{userId}:following -> Sorted Set
feed:{userId} -> List of postIds (cached feed)
```

### Cache Operations

#### Like/Unlike Flow
1. **Client Request** → Like Post
2. **Check Cache** → `user:{userId}:liked` SISMEMBER
3. **Update Cache**:
   - SADD `user:{userId}:liked` postId
   - ZADD `post:{postId}:likes` timestamp userId
   - HINCRBY `post:{postId}:stats` likesCount 1
4. **Queue Job** → Background worker updates DB
5. **Return Success** → Immediate response

#### Follow/Unfollow Flow
1. **Client Request** → Follow User
2. **Check Privacy** → If private, create pending request
3. **Update Cache**:
   - ZADD `user:{followerId}:following` timestamp followingId
   - ZADD `user:{followingId}:followers` timestamp followerId
   - HINCRBY `user:{followerId}:stats` followingCount 1
   - HINCRBY `user:{followingId}:stats` followersCount 1
4. **Queue Job** → Create Follow document
5. **Invalidate Feed** → Clear follower's feed cache

## API Endpoints

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post
- `GET /api/posts/feed` - Get personalized feed
- `DELETE /api/posts/:id` - Delete post

### Likes
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post
- `GET /api/posts/:id/likes` - Get post likes (paginated)

### Comments
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/:id/comments` - Get comments (paginated)
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like comment

### Follows
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following

### Shares
- `POST /api/posts/:id/share` - Share post
- `GET /api/posts/:id/shares` - Get shares

## Background Jobs (Bull Queue)

### Job Types
1. **sync-like** - Sync like to database
2. **sync-unlike** - Sync unlike to database
3. **sync-follow** - Sync follow to database
4. **sync-comment** - Sync comment to database
5. **update-feed** - Regenerate user feed
6. **sync-stats** - Batch update user/post stats

### Job Processing
- Process in batches every 5 seconds
- Retry failed jobs with exponential backoff
- Dead letter queue for permanent failures

## Feed Generation Algorithm

### Personalized Feed Strategy
1. **Get Following List** from cache
2. **Fetch Recent Posts** from followed users (last 7 days)
3. **Score Posts**:
   - Recency: Higher score for newer posts
   - Engagement: Factor in likes, comments, shares
   - Relevance: Match user's industries/roles
4. **Cache Feed** for 5 minutes
5. **Pagination** using cursor-based approach

### Scoring Formula
```
score = (engagement_score * 0.4) + (recency_score * 0.4) + (relevance_score * 0.2)

engagement_score = log(likes + comments*2 + shares*3 + 1)
recency_score = 1 / (hours_since_post + 1)
relevance_score = matching_industries_count / total_industries
```

## Implementation Steps

### Phase 1: Database Models (Day 1)
1. ✅ Update User model
2. ✅ Update Post model
3. ✅ Create Follow model
4. ✅ Create Like model
5. ✅ Create Comment model
6. ✅ Create Share model

### Phase 2: Redis Setup (Day 1)
1. ✅ Configure Redis connection
2. ✅ Create cache service
3. ✅ Implement cache helpers

### Phase 3: Core Services (Day 2)
1. ✅ Like service
2. ✅ Comment service
3. ✅ Follow service
4. ✅ Share service
5. ✅ Feed service

### Phase 4: Controllers & Routes (Day 2)
1. ✅ Post controller enhancements
2. ✅ User controller enhancements
3. ✅ Like controller
4. ✅ Comment controller
5. ✅ Follow controller

### Phase 5: Background Jobs (Day 3)
1. ✅ Setup Bull queue
2. ✅ Create job processors
3. ✅ Implement retry logic

### Phase 6: Testing & Optimization (Day 3)
1. ✅ Load testing
2. ✅ Cache hit rate monitoring
3. ✅ Query optimization

## Performance Targets

- **Like/Unlike**: < 50ms response time
- **Follow/Unfollow**: < 100ms response time
- **Feed Load**: < 200ms for 20 posts
- **Comment Post**: < 150ms response time
- **Cache Hit Rate**: > 90%

## Monitoring & Metrics

### Key Metrics
- Cache hit/miss ratio
- Average response times
- Queue length and processing time
- Database query performance
- Error rates

### Alerts
- Cache miss rate > 20%
- Queue length > 1000
- Response time > 500ms
- Error rate > 1%

## Security Considerations

1. **Rate Limiting**: 100 likes/hour, 50 follows/hour
2. **Validation**: Sanitize all user inputs
3. **Authorization**: Verify user owns resources
4. **Privacy**: Respect account privacy settings
5. **Spam Prevention**: Detect and block suspicious patterns
