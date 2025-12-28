# 🗄️ Database Management Scripts

Quick reference for all database management scripts in the Filmy backend.

---

## 📋 Available Scripts

### **1. Clear All Comments** 🗑️
**Script:** `clearComments.js`  
**Command:** `npm run clear:comments`

**What it does:**
- Deletes all comments from the Comment collection
- Resets comment counts in all posts to 0
- Shows before/after statistics
- Includes 3-second safety delay

**Usage:**
```bash
cd backend
npm run clear:comments
```

**Output:**
```
🗑️  Starting comment cleanup...
✅ Connected to MongoDB

📊 Current State:
   - Total comments: 150
   - Posts with comments: 45

⚠️  WARNING: This will permanently delete all comments!
   Press Ctrl+C to cancel, or wait 3 seconds to continue...

🗑️  Deleting all comments...
✅ Deleted 150 comments
🔄 Resetting comment counts in posts...
✅ Reset comment counts in 45 posts

📊 Final State:
   - Remaining comments: 0
   - Posts with non-zero comment count: 0

✨ All comments cleared successfully!
```

---

### **2. Clear Entire Database** 🗑️
**Script:** `clearDatabase.js`  
**Command:** `npm run seed:clear`

**What it does:**
- Deletes ALL data from ALL collections:
  - Users
  - Posts
  - Follows
  - Likes
  - Comments

**Usage:**
```bash
cd backend
npm run seed:clear
```

**⚠️ WARNING:** This will delete EVERYTHING! Use with caution.

---

### **3. Clear Engagement Data** 🗑️
**Script:** `clearEngagementData.js`  
**Command:** `node scripts/clearEngagementData.js`

**What it does:**
- Deletes all likes, comments, shares, follows
- Resets engagement counts in posts
- Resets user stats
- Keeps users and posts intact

**Usage:**
```bash
cd backend
node scripts/clearEngagementData.js
```

---

### **4. Fix Engagement Counts** 🔧
**Script:** `fixEngagementCounts.js`  
**Command:** `node scripts/fixEngagementCounts.js`

**What it does:**
- Recalculates all engagement counts from actual data
- Fixes mismatched counts in posts
- Fixes user stats (followers, following, posts, likes)
- Updates post scores

**Usage:**
```bash
cd backend
node scripts/fixEngagementCounts.js
```

---

### **5. Seed Users** 🌱
**Script:** `seedUsers.js`  
**Command:** `npm run seed:users`

**What it does:**
- Creates sample users with different roles
- Generates realistic profile data
- Sets up verified users

**Usage:**
```bash
cd backend
npm run seed:users
```

---

### **6. Seed Posts** 🌱
**Script:** `seedPosts.js`  
**Command:** `npm run seed:posts`

**What it does:**
- Creates sample posts for existing users
- Generates different media types (video, audio, image, script)
- Adds realistic captions and metadata

**Usage:**
```bash
cd backend
npm run seed:posts
```

---

### **7. Seed All** 🌱
**Script:** `seedAll.js`  
**Command:** `npm run seed`

**What it does:**
- Runs seed:users
- Runs seed:posts
- Complete database seeding in one command

**Usage:**
```bash
cd backend
npm run seed
```

---

### **8. Debug Posts** 🔍
**Script:** `debug_posts.js`  
**Command:** `node scripts/debug_posts.js`

**What it does:**
- Lists all posts with their engagement counts
- Shows author information
- Useful for debugging

**Usage:**
```bash
cd backend
node scripts/debug_posts.js
```

---

## 🎯 Common Workflows

### **Fresh Start (Keep Users)**
```bash
cd backend
npm run clear:comments          # Clear comments only
node scripts/clearEngagementData.js  # Clear all engagement
npm run seed:posts              # Add new posts
```

### **Complete Reset**
```bash
cd backend
npm run seed:clear              # Clear everything
npm run seed                    # Seed users and posts
```

### **Fix Data Issues**
```bash
cd backend
node scripts/fixEngagementCounts.js  # Recalculate all counts
```

### **Clean Comments Only**
```bash
cd backend
npm run clear:comments          # Clear all comments
```

---

## 📝 Script Details

### **clearComments.js** (NEW)

**Features:**
- ✅ Shows statistics before deletion
- ✅ 3-second safety delay
- ✅ Deletes all comments
- ✅ Resets post comment counts
- ✅ Verifies cleanup
- ✅ Shows final statistics

**Safe to run:** Yes (only affects comments)

**Reversible:** No (permanent deletion)

**Affects:**
- Comment collection
- Post.engagement.commentsCount field

**Does NOT affect:**
- Users
- Posts (except comment count)
- Likes
- Follows
- Shares

---

## ⚠️ Safety Tips

1. **Always backup before clearing data**
2. **Read the script output carefully**
3. **Use Ctrl+C to cancel during safety delay**
4. **Test on development database first**
5. **Verify results after running scripts**

---

## 🔧 Adding New Scripts

To add a new database script:

1. Create script in `backend/scripts/`
2. Add to `package.json` scripts section:
   ```json
   "script-name": "node scripts/yourScript.js"
   ```
3. Document it in this file

---

## 📊 Script Comparison

| Script | Users | Posts | Comments | Likes | Follows | Shares |
|--------|-------|-------|----------|-------|---------|--------|
| clearComments | ✅ Keep | ✅ Keep | ❌ Delete | ✅ Keep | ✅ Keep | ✅ Keep |
| clearDatabase | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete |
| clearEngagementData | ✅ Keep | ✅ Keep | ❌ Delete | ❌ Delete | ❌ Delete | ❌ Delete |
| fixEngagementCounts | ✅ Keep | ✅ Keep | ✅ Keep | ✅ Keep | ✅ Keep | ✅ Keep |

---

**Last Updated:** December 27, 2025  
**Maintained by:** Development Team
