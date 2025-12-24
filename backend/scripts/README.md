# Database Seed Scripts

## 📝 Overview

These scripts populate your MongoDB database with initial data for testing and development.

---

## 🗂️ Available Scripts

### **Run All Seeds (Recommended)**
```bash
npm run seed
```
This will:
1. Clear all existing data
2. Create 6 test users
3. Create 8 test posts
4. Link posts to users

### **Individual Scripts**

```bash
# Seed only users
npm run seed:users

# Seed only posts (requires users to exist)
npm run seed:posts

# Clear all data
npm run seed:clear
```

---

## 👥 Test Users Created

| Name | Email | Role | Industry | Verified |
|------|-------|------|----------|----------|
| Raj Malhotra | raj@example.com | Director, Producer | Bollywood | ✅ Yes |
| Priya Sharma | priya@example.com | DOP, Editor | Bollywood, Punjabi | ❌ No |
| Arjun Kumar | arjun@example.com | Actor | Tollywood, Kollywood | ❌ No |
| Maya Iyer | maya@example.com | Music Composer | Mollywood, Kollywood | ❌ No |
| Vikram Patel | vikram@example.com | Action Director | Bollywood, Tollywood | ✅ Yes |
| Ananya Reddy | ananya@example.com | Costume Designer | Bollywood, Fashion | ❌ No (Private) |

**All passwords:** `password123`

---

## 📱 Test Posts Created

| Type | Author | Industries | Engagement |
|------|--------|-----------|------------|
| Video (BTS) | Raj Malhotra | Bollywood | 234 likes, 45 comments |
| Image (Golden Hour) | Priya Sharma | Bollywood, Punjabi | 189 likes, 23 comments |
| Video (Action) | Arjun Kumar | Tollywood, Kollywood | 412 likes, 67 comments |
| Audio (Theme) | Maya Iyer | Mollywood | 156 likes, 34 comments |
| Script | Raj Malhotra | Bollywood | 298 likes, 56 comments |
| Video (Camera Test) | Priya Sharma | Bollywood | 445 likes, 78 comments |
| Image (Character Study) | Arjun Kumar | Tollywood | 678 likes, 92 comments |
| Audio (Thriller) | Maya Iyer | Kollywood | 234 likes, 45 comments |

---

## 🚀 Quick Start

### **1. Make sure MongoDB is running**
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"
```

### **2. Make sure .env is configured**
```bash
# Check backend/.env has:
MONGODB_URI=mongodb://localhost:27017/flim-app
```

### **3. Run the seed**
```bash
cd backend
npm run seed
```

### **4. Expected Output**
```
🌱 Starting database seeding...

Step 1: Clearing existing data...
✅ All collections cleared successfully!

Step 2: Seeding users...
Created 6 users successfully!
- Raj Malhotra (raj@example.com)
- Priya Sharma (priya@example.com)
...

Step 3: Seeding posts...
Created 8 posts successfully!

🎉 All seeding completed successfully!

📊 Database Summary:
✅ 6 Users created
✅ 8 Posts created

🔑 Test Login Credentials:
  Email: raj@example.com
  Password: password123
```

---

## 🧪 Testing in the App

### **1. Start the backend**
```bash
cd backend
npm run dev
```

### **2. Start the frontend**
```bash
cd app
npx expo start
```

### **3. Login with test credentials**
```
Email: raj@example.com
Password: password123
```

### **4. See the seeded data**
- Home feed will show 8 posts
- Search will show 6 users
- Profile will show user details

---

## 📋 What Each Script Does

### **seedUsers.js**
- Creates 6 test users
- Hashes passwords with bcrypt
- Sets up user stats (followers, following, posts)
- Configures privacy settings
- Assigns roles and industries
- Sets verification status

### **seedPosts.js**
- Creates 8 test posts
- Links posts to users
- Sets engagement metrics (likes, comments, shares)
- Calculates post scores
- Updates user post references
- Sets visibility to public

### **clearDatabase.js**
- Removes all users
- Removes all posts
- Removes all follows
- Removes all likes
- Removes all comments
- Removes all shares

### **seedAll.js**
- Runs clearDatabase.js
- Runs seedUsers.js
- Runs seedPosts.js
- Shows summary

---

## 🔧 Troubleshooting

### **Error: No users found**
```bash
# Run users seed first
npm run seed:users

# Then run posts seed
npm run seed:posts
```

### **Error: Cannot connect to MongoDB**
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB if needed
brew services start mongodb-community
```

### **Error: MONGODB_URI not defined**
```bash
# Make sure .env file exists in backend/
cat backend/.env | grep MONGODB_URI

# If missing, add it:
echo "MONGODB_URI=mongodb://localhost:27017/flim-app" >> backend/.env
```

---

## 🎯 User Accounts Overview

### **Public Accounts (5)**
Can be followed immediately:
- Raj Malhotra (Director)
- Priya Sharma (DOP)
- Arjun Kumar (Actor)
- Maya Iyer (Music)
- Vikram Patel (Action Director)

### **Private Account (1)**
Requires follow request approval:
- Ananya Reddy (Costume Designer)

### **Verified Accounts (2)**
Have the blue checkmark:
- Raj Malhotra
- Vikram Patel

### **Business Account (1)**
- Vikram Patel (Can create ads in the future)

---

## 📊 Database Stats After Seeding

```javascript
{
  users: 6,
  posts: 8,
  follows: 0,  // Run in app to create
  likes: 0,    // Run in app to create
  comments: 0, // Run in app to create
  shares: 0    // Run in app to create
}
```

---

## 🔄 Re-seeding Database

To start fresh:

```bash
# Option 1: Run complete seed
npm run seed

# Option 2: Manual steps
npm run seed:clear
npm run seed:users
npm run seed:posts
```

---

## 💡 Tips

1. **Always seed users before posts** - Posts need users to exist
2. **Use `npm run seed` for fresh start** - Clears and re-seeds everything
3. **Test different accounts** - Each user has different roles/industries
4. **Private account testing** - Use Ananya's account to test follow requests
5. **Verified accounts** - Use Raj or Vikram to test verified badges

---

## 📝 Notes

- All users have the same password: `password123`
- Posts include real sample media URLs
- Engagement metrics are preset for testing
- User stats are pre-populated
- Post scores are calculated automatically
- All data can be modified after seeding

---

**Created by:** Antigravity AI
**Last Updated:** 2025-12-24
