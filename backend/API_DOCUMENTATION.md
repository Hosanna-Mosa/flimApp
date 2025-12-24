# Social Media API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📱 Like Endpoints

### Like a Post
```http
POST /api/posts/:id/like
```
**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Post liked successfully",
  "likesCount": 42
}
```

### Unlike a Post
```http
DELETE /api/posts/:id/like
```
**Auth Required:** Yes

### Get Post Likes
```http
GET /api/posts/:id/likes?page=0&limit=20
```
**Auth Required:** No

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "John Doe",
      "avatar": "https://...",
      "isVerified": true,
      "roles": ["Director"]
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get User's Liked Posts
```http
GET /api/users/:id/liked?page=0&limit=20
```
**Auth Required:** No

### Check if User Liked Post
```http
GET /api/posts/:id/liked
```
**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "liked": true
}
```

---

## 👥 Follow Endpoints

### Follow a User
```http
POST /api/users/:id/follow
```
**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "User followed successfully",
  "status": "accepted",
  "followingCount": 125,
  "followersCount": 340
}
```
*Note: For private accounts, status will be "pending"*

### Unfollow a User
```http
DELETE /api/users/:id/follow
```
**Auth Required:** Yes

### Get Followers
```http
GET /api/users/:id/followers?page=0&limit=20
```
**Auth Required:** No

### Get Following
```http
GET /api/users/:id/following?page=0&limit=20
```
**Auth Required:** No

### Get Pending Follow Requests
```http
GET /api/follow-requests?page=0&limit=20
```
**Auth Required:** Yes

### Accept Follow Request
```http
POST /api/follow-requests/:userId/accept
```
**Auth Required:** Yes

### Reject Follow Request
```http
POST /api/follow-requests/:userId/reject
```
**Auth Required:** Yes

### Check Follow Status
```http
GET /api/users/:id/following-status
```
**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "following": true
}
```

### Get Mutual Followers
```http
GET /api/users/:id/mutual-followers
```
**Auth Required:** Yes

---

## 💬 Comment Endpoints

### Add Comment
```http
POST /api/posts/:id/comments
Content-Type: application/json

{
  "content": "Great post!",
  "parentCommentId": "optional-for-replies"
}
```
**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "_id": "...",
    "content": "Great post!",
    "user": {
      "name": "John Doe",
      "avatar": "https://...",
      "isVerified": true
    },
    "createdAt": "2025-12-24T12:00:00Z"
  }
}
```

### Get Post Comments
```http
GET /api/posts/:id/comments?page=0&limit=20&sortBy=recent
```
**Query Params:**
- `sortBy`: `recent` (default) or `popular`

**Auth Required:** No

### Get Comment Replies
```http
GET /api/comments/:id/replies?page=0&limit=10
```
**Auth Required:** No

### Edit Comment
```http
PUT /api/comments/:id
Content-Type: application/json

{
  "content": "Updated comment text"
}
```
**Auth Required:** Yes

### Delete Comment
```http
DELETE /api/comments/:id
```
**Auth Required:** Yes

### Like a Comment
```http
POST /api/comments/:id/like
```
**Auth Required:** Yes

### Get User's Comments
```http
GET /api/users/:id/comments?page=0&limit=20
```
**Auth Required:** No

---

## 🔄 Share Endpoints

### Share a Post
```http
POST /api/posts/:id/share
Content-Type: application/json

{
  "shareType": "repost",  // "repost", "quote", or "external"
  "caption": "Check this out!",  // optional, for quote shares
  "platform": "whatsapp"  // optional: whatsapp, twitter, facebook, instagram, other
}
```
**Auth Required:** Yes

### Get Post Shares
```http
GET /api/posts/:id/shares?page=0&limit=20
```
**Auth Required:** No

### Get User's Shares
```http
GET /api/users/:id/shares?page=0&limit=20
```
**Auth Required:** No

### Delete Share
```http
DELETE /api/shares/:id
```
**Auth Required:** Yes

### Get Share Statistics
```http
GET /api/posts/:id/share-stats
```
**Auth Required:** No

**Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "whatsapp", "count": 45 },
    { "_id": "twitter", "count": 23 },
    { "_id": null, "count": 102 }  // In-app reposts
  ]
}
```

---

## 📰 Feed Endpoints

### Get Personalized Feed
```http
GET /api/feed?page=0&limit=20&algorithm=hybrid&timeRange=7
```
**Query Params:**
- `algorithm`: `hybrid` (default), `chronological`, or `engagement`
- `timeRange`: Number of days to look back (default: 7)

**Auth Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "video",
      "mediaUrl": "https://...",
      "caption": "Check out my latest project!",
      "author": {
        "name": "Jane Smith",
        "avatar": "https://...",
        "isVerified": true
      },
      "engagement": {
        "likesCount": 234,
        "commentsCount": 45,
        "sharesCount": 12
      },
      "createdAt": "2025-12-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "source": "cache"  // or "database"
}
```

### Get Trending Feed
```http
GET /api/feed/trending?page=0&limit=20
```
**Auth Required:** Yes

### Get Industry Feed
```http
GET /api/feed/industry/:industry?page=0&limit=20
```
**Example:** `/api/feed/industry/film-production`

**Auth Required:** No

### Get User's Posts (Profile Feed)
```http
GET /api/feed/users/:id/posts?page=0&limit=20
```
**Auth Required:** No (optional for privacy checks)

### Invalidate Feed Cache
```http
POST /api/feed/invalidate
```
**Auth Required:** Yes

---

## 🔐 Rate Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Global | 1000 requests | 15 minutes |
| Likes | 100 actions | 1 hour |
| Follows | 50 actions | 1 hour |
| Comments | 30 actions | 1 hour |
| Shares | 20 actions | 1 hour |

---

## 📊 Cache Strategy

### Cache TTLs
- **User Stats**: 60 seconds
- **Post Stats**: 60 seconds
- **Feed**: 5 minutes
- **User Profile**: 10 minutes

### Cache Keys
```
user:{userId}:stats          → User statistics
user:{userId}:liked          → Set of liked post IDs
user:{userId}:followers      → Sorted set of followers
user:{userId}:following      → Sorted set of following
post:{postId}:likes          → Sorted set of user likes
post:{postId}:stats          → Post engagement stats
feed:{userId}                → User's personalized feed
```

---

## 🚀 Performance

### Response Times (Target)
- Like/Unlike: < 50ms
- Follow/Unfollow: < 100ms
- Add Comment: < 150ms
- Feed Load (cached): < 100ms
- Feed Load (fresh): < 200ms

### Feed Algorithm Scores
```javascript
finalScore = (engagementScore * 0.4) +
             (recencyScore * 0.4) +
             (relevanceScore * 0.2) +
             (verifiedBoost)

where:
  engagementScore = log(likes + comments*2 + shares*3 + 1)
  recencyScore = 1 / (hoursAgo + 1)
  relevanceScore = matchingIndustries / totalIndustries
  verifiedBoost = 1.2x if verified, 1.0x otherwise
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Post already liked"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized to delete this comment"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Post not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🧪 Testing Examples

### Using cURL

#### Like a post:
```bash
curl -X POST http://localhost:4000/api/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get personalized feed:
```bash
curl -X GET "http://localhost:4000/api/feed?page=0&limit=20&algorithm=hybrid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Add a comment:
```bash
curl -X POST http://localhost:4000/api/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Great work!"}'
```

### Using JavaScript (Fetch)

```javascript
// Like a post
const likePost = async (postId) => {
  const response = await fetch(`http://localhost:4000/api/posts/${postId}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return await response.json();
};

// Get personalized feed
const getFeed = async (page = 0) => {
  const response = await fetch(
    `http://localhost:4000/api/feed?page=${page}&limit=20&algorithm=hybrid`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return await response.json();
};
```

---

## 📝 Notes

1. **Cache Fallback**: If Redis is unavailable, all operations fall back to direct database queries
2. **Background Jobs**: Likes, follows, and other operations are queued for async database updates
3. **Privacy**: Private account follows create pending requests that require approval
4. **Pagination**: All list endpoints support pagination with `page` and `limit` query parameters
5. **Soft Deletes**: Comments are soft-deleted to maintain thread integrity

---

**Last Updated:** 2025-12-24
**API Version:** 1.0.0
