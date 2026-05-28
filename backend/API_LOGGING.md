# API Request Logging

## 📊 Enhanced Request Logger

The backend now has comprehensive API request logging with color-coded console output for easy debugging.

---

## 🎨 **What Gets Logged**

### **For Every Request:**

```
================================================================================
[2025-12-24T13:45:00.123Z] POST /api/posts/123/like
IP: 10.212.182.150 | User: 694beae960e8e5b2755aabf1
Body: {
  "postId": "123"
}
← 200 (45ms)
================================================================================
```

### **Logged Information:**

1. ✅ **Timestamp** - ISO 8601 format
2. ✅ **HTTP Method** - Color-coded (GET=green, POST=cyan, PUT=yellow, DELETE=red)
3. ✅ **URL Path** - Full request URL
4. ✅ **IP Address** - Client IP
5. ✅ **User ID** - Authenticated user or "Anonymous"
6. ✅ **Query Parameters** - URL query string
7. ✅ **Request Body** - With sensitive data sanitized (✅ passwords, tokens)
8. ✅ **File Uploads** - Number of files if multipart/form-data
9. ✅ **Status Code** - Color-coded (2xx=green, 3xx=cyan, 4xx=yellow, 5xx=red)
10. ✅ **Response Time** - In milliseconds

---

## 🔐 **Security Features**

### **Automatically Sanitized Fields:**
- `password` → `***`
- `refreshToken` → `***`
- `accessToken` → `***`
- `authorization` header → Hidden
- `cookie` header → Hidden

---

## 🎨 **Color Codes**

| HTTP Method | Color |
|-------------|-------|
| GET | 🟢 Green |
| POST | 🔵 Cyan |
| PUT | 🟡 Yellow |
| DELETE | 🔴 Red |
| PATCH | 🟣 Magenta |

| Status Code | Color |
|-------------|-------|
| 2xx Success | 🟢 Green |
| 3xx Redirect | 🔵 Cyan |
| 4xx Client Error | 🟡 Yellow |
| 5xx Server Error | 🔴 Red |

---

## 📝 **Example Logs**

### **1. Login Request**
```
================================================================================
[2025-12-24T13:44:04.396Z] POST /auth/login-password
IP: 10.212.182.239 | User: Anonymous
Body: {
  "phone": "9876543210",
  "password": "***"
}
← 200 (166ms)
================================================================================
```

### **2. Get Feed**
```
================================================================================
[2025-12-24T13:45:23.145Z] GET /api/feed?page=0&limit=20&algorithm=hybrid
IP: 10.212.182.239 | User: 694beae960e8e5b2755aabf1
Query: {"page":"0","limit":"20","algorithm":"hybrid"}
← 200 (87ms)
================================================================================
```

### **3. Like a Post**
```
================================================================================
[2025-12-24T13:46:10.523Z] POST /api/posts/694bef123abc456def/like
IP: 10.212.182.239 | User: 694beae960e8e5b2755aabf1
← 200 (43ms)
================================================================================
```

### **4. Error Response**
```
================================================================================
[2025-12-24T13:47:05.892Z] POST /api/posts/invalid-id/comment
IP: 10.212.182.239 | User: 694beae960e8e5b2755aabf1
Body: {
  "content": "Great post!"
}
← 404 (12ms)
================================================================================
```

---

## ⚙️ **Configuration**

### **Enable Header Logging** (Optional)
To also log request headers, add to `.env`:
```env
LOG_HEADERS=true
```

**Note:** Authorization and Cookie headers are always excluded for security.

---

## 📂 **Log Files**

Logs are also written to files (configured in `logger.js`):

```
logs/
├── combined.log      # All logs
├── error.log         # Error logs only
└── YYYY-MM-DD/      # Daily rotating logs
```

---

## 🔍 **Use Cases**

### **Debugging:**
- See exactly what data is being sent
- Track response times
- Identify slow endpoints

### **Monitoring:**
- Track API usage
- Monitor error rates
- Identify suspicious activity

### **Development:**
- Easy visual debugging
- Color-coded for quick scanning
- Complete request/response cycle

---

## 💡 **Tips**

1. **Filter by color** in your terminal for specific methods
2. **Look for yellow/red** responses for errors
3. **Monitor response times** (gray timestamp)
4. **Check sanitized body** for data validation issues

---

**Logging is active! Watch your console for beautifully formatted API logs! 📊✨**
