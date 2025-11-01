# Backend Running Without MongoDB

## ✅ Changes Made

MongoDB is now **optional** - the server can start without it!

### What Was Changed:

1. **Config (`src/config/config.js`)**
   - `MONGODB_URL` is now optional (not required)
   - Server won't fail if MongoDB URL is missing

2. **Server Startup (`src/index.js`)**
   - Checks if MongoDB URL is configured
   - Starts server even without MongoDB
   - Shows warning messages

3. **Auth Controllers (`src/controllers/auth.controller.js`)**
   - All auth endpoints check if MongoDB is connected
   - Return `501 Not Implemented` if MongoDB is not available
   - Clear error messages for frontend

4. **Passport Config (`src/config/passport.js`)**
   - Handles missing User model gracefully

5. **Error Middleware (`src/middlewares/error.js`)**
   - Makes mongoose optional

### Current Status:

✅ Server can start without MongoDB  
⚠️ Authentication endpoints will return 501 (Not Implemented)  
⚠️ Login/Register won't work without MongoDB  

### To Use Authentication:

Simply add `MONGODB_URL` to your `.env` file:
```
MONGODB_URL=mongodb://localhost:27017/hack2heal
```

Then restart the server - authentication will work!

### Environment Variables Required:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-here
```

### Optional:
```env
MONGODB_URL=mongodb://localhost:27017/hack2heal
```

