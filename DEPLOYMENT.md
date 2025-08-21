# DigitalOcean Deployment Guide

## 🚀 Current Issue
The DigitalOcean deployment is failing because:
1. Backend server is not deployed/running
2. Frontend is trying to connect to `http://localhost:3001` (hardcoded)
3. HTTPS/HTTP mixed content blocking

## 🔧 Solution: Two-App Deployment

### Step 1: Deploy Backend Server

**Create DigitalOcean App for Backend:**
1. Go to DigitalOcean App Platform
2. Create new app from GitHub repo
3. **Source**: Select the `backend/` directory
4. **Environment**: Node.js
5. **Build Command**: `npm install`
6. **Run Command**: `npm start`
7. **Environment Variables**:
   ```
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://lionfish-app-swahh.ondigitalocean.app
   ```

### Step 2: Update Frontend Configuration

**Set Environment Variable for Frontend:**
1. In DigitalOcean App Platform (frontend app)
2. Go to Settings → Environment Variables
3. Add:
   ```
   REACT_APP_API_URL=https://your-backend-app-name.ondigitalocean.app
   ```
4. Replace `your-backend-app-name` with actual backend app URL

### Step 3: Update Backend CORS

In `backend/server.js`, ensure CORS allows the frontend domain:
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

## 🔍 Testing

1. **Backend Health**: Visit `https://your-backend-app.ondigitalocean.app/api/health`
2. **Frontend**: Should now connect to backend successfully
3. **Dynamic Fetch**: Try fetching a recent puzzle date

## 🐛 Debugging

Console should show:
```
🌐 [BackendAPI] Making request to: https://your-backend-app.ondigitalocean.app/api/fetch-puzzle/2025-08-21
✅ [BackendAPI] Successfully fetched puzzle for 2025-08-21
```

Instead of localhost errors.
