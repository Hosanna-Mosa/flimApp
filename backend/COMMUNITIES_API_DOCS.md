# 🏘️ Communities API Documentation

## Base URL
```
http://localhost:8000/api/communities
```

All endpoints require authentication unless specified otherwise.

---

## 📋 Table of Contents
1. [Community Management](#community-management)
2. [Group Management](#group-management)
3. [Post Management](#post-management)
4. [Member Management](#member-management)

---

## 🏘️ Community Management

### Create Community
```http
POST /api/communities
```

**Request Body:**
```json
{
  "name": "Bollywood Filmmakers",
  "description": "A community for Bollywood directors, producers, and crew",
  "avatar": "https://example.com/avatar.jpg",
  "coverImage": "https://example.com/cover.jpg",
  "type": "industry",
  "industry": "bollywood",
  "privacy": "public",
  "tags": ["filmmaking", "bollywood", "directors"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "community_id",
    "name": "Bollywood Filmmakers",
    "description": "...",
    "createdBy": "user_id",
    "members": ["user_id"],
    "memberCount": 1,
    "groups": [
      {
        "_id": "group_id_1",
        "name": "Announcements",
        "type": "announcement",
        "isAnnouncementOnly": true
      },
      {
        "_id": "group_id_2",
        "name": "General",
        "type": "general"
      }
    ],
    "createdAt": "2025-12-26T...",
    "updatedAt": "2025-12-26T..."
  }
}
```

---

### List Communities
```http
GET /api/communities?type=industry&industry=bollywood&page=0&limit=20
```

**Query Parameters:**
- `type` - Filter by type (industry, role, project, general)
- `industry` - Filter by industry
- `role` - Filter by role
- `privacy` - Filter by privacy (public, private, invite-only)
- `tags` - Comma-separated tags
- `search` - Search in name and description
- `page` - Page number (default: 0)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "community_id",
        "name": "Bollywood Filmmakers",
        "memberCount": 150,
        "stats": {
          "totalPosts": 450,
          "activeMembers": 75
        }
      }
    ],
    "pagination": {
      "page": 0,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

### Get My Communities
```http
GET /api/communities/my?page=0&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "community_id",
        "name": "Bollywood Filmmakers",
        "memberRole": "admin",
        "joinedAt": "2025-12-20T...",
        "lastActiveAt": "2025-12-26T..."
      }
    ],
    "pagination": {...}
  }
}
```

---

### Get Community Details
```http
GET /api/communities/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "community_id",
    "name": "Bollywood Filmmakers",
    "description": "...",
    "avatar": "...",
    "coverImage": "...",
    "type": "industry",
    "privacy": "public",
    "createdBy": {...},
    "admins": [...],
    "moderators": [...],
    "memberCount": 150,
    "groups": [...],
    "stats": {...},
    "isMember": true,
    "memberRole": "member",
    "isPending": false
  }
}
```

---

### Update Community
```http
PUT /api/communities/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "privacy": "private",
  "settings": {
    "allowMemberInvites": true,
    "requireApproval": true,
    "allowGroupCreation": false,
    "maxGroups": 15
  }
}
```

---

### Delete Community
```http
DELETE /api/communities/:id
```

---

### Join Community
```http
POST /api/communities/:id/join
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Joined community successfully",
    "status": "joined"  // or "pending" for private communities
  }
}
```

---

### Leave Community
```http
POST /api/communities/:id/leave
```

---

## 👥 Member Management

### Get Members
```http
GET /api/communities/:id/members?page=0&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "member_id",
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "avatar": "...",
          "isVerified": true
        },
        "role": "member",
        "joinedAt": "...",
        "postsCount": 15,
        "messagesCount": 234
      }
    ],
    "pagination": {...}
  }
}
```

---

### Approve Join Request
```http
POST /api/communities/:id/requests/:userId/approve
```

---

### Reject Join Request
```http
POST /api/communities/:id/requests/:userId/reject
```

---

### Update Member Role
```http
PUT /api/communities/:id/members/:userId/role
```

**Request Body:**
```json
{
  "role": "moderator"  // admin, moderator, or member
}
```

---

### Remove Member
```http
DELETE /api/communities/:id/members/:userId
```

---

## 📁 Group Management

### Create Group
```http
POST /api/communities/:communityId/groups
```

**Request Body:**
```json
{
  "name": "Directors Channel",
  "description": "For directors only",
  "type": "discussion",
  "isAnnouncementOnly": false
}
```

---

### Get All Groups
```http
GET /api/communities/:communityId/groups
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "group_id",
      "name": "Directors Channel",
      "description": "...",
      "type": "discussion",
      "memberCount": 45,
      "isMember": true
    }
  ]
}
```

---

### Get Group Details
```http
GET /api/communities/:communityId/groups/:groupId
```

---

### Update Group
```http
PUT /api/communities/:communityId/groups/:groupId
```

---

### Delete Group
```http
DELETE /api/communities/:communityId/groups/:groupId
```

---

### Join Group
```http
POST /api/communities/:communityId/groups/:groupId/join
```

---

### Leave Group
```http
POST /api/communities/:communityId/groups/:groupId/leave
```

---

### Get Group Members
```http
GET /api/communities/:communityId/groups/:groupId/members?page=0&limit=50
```

---

## 📝 Post Management

### Create Post
```http
POST /api/communities/:communityId/posts
```

**Text Post:**
```json
{
  "groupId": "group_id",
  "type": "text",
  "content": "This is a text post"
}
```

**Image Post:**
```json
{
  "groupId": "group_id",
  "type": "image",
  "content": "Check out this image!",
  "media": [
    {
      "url": "https://example.com/image.jpg",
      "type": "image",
      "thumbnail": "https://example.com/thumb.jpg"
    }
  ]
}
```

**Poll Post:**
```json
{
  "groupId": "group_id",
  "type": "poll",
  "content": "What's your favorite genre?",
  "poll": {
    "question": "What's your favorite genre?",
    "options": [
      { "text": "Action" },
      { "text": "Drama" },
      { "text": "Comedy" },
      { "text": "Thriller" }
    ],
    "endsAt": "2025-12-31T23:59:59Z",
    "allowMultiple": false
  }
}
```

---

### Get Community Feed
```http
GET /api/communities/:communityId/posts?page=0&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "post_id",
        "community": "community_id",
        "group": "group_id",
        "author": {
          "_id": "user_id",
          "name": "John Doe",
          "avatar": "...",
          "isVerified": true
        },
        "type": "text",
        "content": "...",
        "likesCount": 45,
        "commentsCount": 12,
        "isPinned": false,
        "isLiked": true,
        "createdAt": "..."
      }
    ],
    "pagination": {...}
  }
}
```

---

### Get Group Posts
```http
GET /api/communities/:communityId/groups/:groupId/posts?page=0&limit=20
```

---

### Update Post
```http
PUT /api/communities/:communityId/posts/:postId
```

**Request Body:**
```json
{
  "content": "Updated content",
  "media": [...]
}
```

---

### Delete Post
```http
DELETE /api/communities/:communityId/posts/:postId
```

---

### Pin/Unpin Post
```http
POST /api/communities/:communityId/posts/:postId/pin
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "isPinned": true,
    "message": "Post pinned"
  }
}
```

---

### Like Post
```http
POST /api/communities/:communityId/posts/:postId/like
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Post liked",
    "likesCount": 46
  }
}
```

---

### Unlike Post
```http
DELETE /api/communities/:communityId/posts/:postId/like
```

---

### Vote in Poll
```http
POST /api/communities/:communityId/posts/:postId/vote
```

**Request Body:**
```json
{
  "optionIndex": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Vote recorded",
    "poll": {
      "question": "...",
      "options": [
        {
          "text": "Action",
          "votes": ["user_id_1", "user_id_2"]
        },
        {
          "text": "Drama",
          "votes": ["user_id_3"]
        },
        {
          "text": "Comedy",
          "votes": ["user_id_4", "user_id_5", "current_user_id"]
        }
      ]
    }
  }
}
```

---

## 🔐 Permission Levels

| Action | Owner | Admin | Moderator | Member |
|--------|-------|-------|-----------|--------|
| Create Community | ✅ | ❌ | ❌ | ❌ |
| Update Community | ✅ | ✅ | ❌ | ❌ |
| Delete Community | ✅ | ❌ | ❌ | ❌ |
| Create Group | ✅ | ✅ | ❌ | ❌* |
| Update Group | ✅ | ✅ | ❌ | ❌ |
| Delete Group | ✅ | ✅ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ❌ | ❌ |
| Pin Posts | ✅ | ✅ | ✅ | ❌ |
| Delete Any Post | ✅ | ✅ | ✅ | ❌ |
| Create Post | ✅ | ✅ | ✅ | ✅ |
| Delete Own Post | ✅ | ✅ | ✅ | ✅ |

*If `allowGroupCreation` setting is enabled

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 🎯 Example Use Cases

### 1. Create a Bollywood Community
```bash
curl -X POST http://localhost:8000/api/communities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bollywood Filmmakers",
    "type": "industry",
    "industry": "bollywood",
    "privacy": "public"
  }'
```

### 2. Join a Community
```bash
curl -X POST http://localhost:8000/api/communities/COMMUNITY_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Create a Poll
```bash
curl -X POST http://localhost:8000/api/communities/COMMUNITY_ID/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "GROUP_ID",
    "type": "poll",
    "content": "Best Bollywood movie of 2024?",
    "poll": {
      "question": "Best Bollywood movie of 2024?",
      "options": [
        {"text": "Movie A"},
        {"text": "Movie B"},
        {"text": "Movie C"}
      ]
    }
  }'
```

---

**🎉 You now have a fully functional WhatsApp-style communities system!**
