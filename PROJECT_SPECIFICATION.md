# 🎬 FlimApp - Full-Stack Social Media Project Specification

FlimApp is a full-stack social media platform engineered for creative professionals (actors, directors, writers, and technical crew). The platform allows users to verify their identities, publish rich media assets, build networks using public/private accounts, engage via likes/comments/shares, and discover content using custom recommendation algorithms.

---

## 🛠️ Technology Stack & Infrastructure

| Layer | Technologies & Tools | Purpose |
| :--- | :--- | :--- |
| **Mobile Client** | React Native, Expo, TypeScript | User application for iOS & Android |
| **Admin Panel** | React, Vite, Tailwind CSS | Back-office management dashboard |
| **Backend Server** | Node.js, Express.js, Socket.io | Core REST APIs & WebSockets communication |
| **Database** | MongoDB, Mongoose ODM | Primary data store for document resources |
| **Caching & Queues**| Redis, Bull Queue | Performance caching & background sync processes |
| **Cloud Services** | Cloudinary, Twilio, Expo Push | Media storage, SMS OTP, and push notifications |
| **Payments** | Razorpay Gateway | In-app user subscriptions and billing |

---

## 🏗️ Architecture & High-Performance Patterns

To ensure high performance and sub-50ms user action response times, FlimApp implements a **Write-Through Caching Pattern**:

1. **Fast-path Write**: When a user performs a social action (like a post or follow request), the application updates the count directly in the Redis cache and returns success immediately.
2. **Background Sync**: A background job is dispatched to a **Bull Queue**.
3. **Database Persistence**: The worker process pulls jobs from the queue and updates the MongoDB database asynchronously, ensuring the primary database is eventually consistent without blocking the user response.

### Caching TTL Policies
* **User Profile Stats**: 60 seconds
* **Post Engagement Counts**: 60 seconds
* **Personalized Feeds**: 5 minutes
* **Full User Profile Info**: 10 minutes

---

## 🔑 Database Schema Models

The MongoDB database consists of six core models:

### 1. User Model
Stores profile information, settings, verification status, and denormalized follower/following counts.
* **Fields**: `name`, `email`, `phone`, `password`, `roles` (array), `industries` (array), `isPrivate`, `isVerified`, `followersCount`, `followingCount`.

### 2. Post Model
Represents published creative items with built-in engagement stats.
* **Fields**: `type` (video, audio, image, script, text), `mediaUrl`, `thumbnail`, `caption`, `industries` (array), `roles` (array), `likesCount`, `commentsCount`, `sharesCount`, `isDonation` (boolean).

### 3. Follow Model
Tracks unidirectional relationship pairs.
* **Fields**: `followerId` (Ref: User), `followingId` (Ref: User), `status` (pending, accepted).

### 4. Like Model
Tracks post and comment likes.
* **Fields**: `userId` (Ref: User), `targetId` (Ref: Post/Comment), `targetType` (Post/Comment).

### 5. Comment Model
Allows nested replies (up to 1 level deep).
* **Fields**: `postId` (Ref: Post), `userId` (Ref: User), `content`, `parentId` (Ref: Comment, optional), `likesCount`.

### 6. Share Model
Tracks reposts and external platform shares.
* **Fields**: `postId` (Ref: Post), `userId` (Ref: User), `platform` (system, twitter, whatsapp, facebook, other), `type` (repost, quote), `quoteText`.

---

## 🔌 API Route Directory & Core Endpoints

### 🔐 1. Authentication (`/auth`)
* `POST /auth/register` - Create user profile with roles & industry focus.
* `POST /auth/login-password` - Direct access via phone and password.
* `POST /auth/send-otp` - Trigger SMS OTP via Twilio.
* `POST /auth/verify-otp` - Confirm OTP and issue JWT access & refresh tokens.
* `POST /auth/refresh` - Rotate expired tokens.
* `POST /auth/logout` - Revoke tokens and terminate session.

### 📝 2. Posts (`/posts`)
* `POST /posts/` - Upload and publish a new post asset.
* `GET /posts/:id` - Fetch single post detail.
* `PUT /posts/:id` / `DELETE /posts/:id` - Edit/delete post.
* `POST /posts/:id/save` - Save/Bookmark a post.

### 💬 3. Comments (`/api`)
* `POST /api/posts/:id/comments` - Post a comment (or reply to a comment).
* `GET /api/posts/:id/comments` - Get comments for a post.
* `GET /api/comments/:id/replies` - Get replies for a comment.
* `PUT /api/comments/:id` / `DELETE /api/comments/:id` - Edit/delete comment.
* `POST /api/comments/:id/like` - Like/unlike comment.

### 💖 4. Likes & Shares (`/api`)
* `POST /api/posts/:id/like` / `DELETE /api/posts/:id/like` - Like/unlike post.
* `GET /api/posts/:id/likes` - List users who liked a post.
* `POST /api/posts/:id/share` - Record quote-post or share action.

### 👥 5. Relationships & Networks (`/api`)
* `POST /api/users/:id/follow` - Send follow request or follow public user.
* `DELETE /api/users/:id/follow` - Unfollow user.
* `GET /api/follow-requests` - View pending follow requests.
* `POST /api/follow-requests/:userId/accept` (or `/reject`) - Approve/deny follow request.
* `GET /api/users/:id/followers` / `/following` - View network lists.

### 📰 6. Feed Recommendation Engine (`/api/feed`)
Feeds are personalized dynamically using the following formula:
$$\text{Score} = (\text{Engagement} \times 0.4) + (\text{Recency} \times 0.4) + (\text{Relevance} \times 0.2) \times (\text{VerifiedBoost})$$

* `GET /api/feed` - Get personalized recommendation feed.
* `GET /api/feed/trending` - Get trending posts from last 24 hours.
* `GET /api/feed/industry/:industry` - Filter feed by industry.

---

## 🔒 Security & Performance Policies

* **Rate Limiting**: Main routes are limited to **1000 requests per 15 minutes** per IP. OTP routes are strictly limited to **5 requests per 10 minutes** to prevent SMS exhaustion.
* **Privacy Controls**: Non-followers of private accounts cannot view posts or follow lists.
