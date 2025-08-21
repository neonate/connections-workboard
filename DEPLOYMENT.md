# DigitalOcean Deployment Guide

## 🚀 Current Issue Fixed
The DigitalOcean deployment was failing because:
1. Backend server was not running
2. Frontend was trying to connect to `http://localhost:3001` (hardcoded)
3. HTTPS/HTTP mixed content blocking

## ✅ Solution: Single-App Deployment (Implemented)

Your current DigitalOcean App Spec deploys the entire repository as one service. The solution configures the backend to serve both the API and the React frontend from the same domain.

### How It Works

1. **Build Process**: `npm run build` creates React build and installs backend dependencies
2. **Production Server**: Backend serves the React app from `/build` directory  
3. **API Routes**: All `/api/*` requests handled by Express backend
4. **Frontend Routes**: All other requests serve the React app (SPA routing)
5. **Same Origin**: No CORS issues since frontend and backend are on same domain

### Current Configuration

Your existing `lionfish-app` deployment now automatically:
- ✅ Builds the React frontend (`npm run build`)
- ✅ Installs backend dependencies  
- ✅ Starts production server (`npm start` → `node start-production.js`)
- ✅ Serves both frontend and API from port 8080
- ✅ Handles React Router properly

## 🔍 Testing

1. **Backend Health**: Visit `https://lionfish-app-swahh.ondigitalocean.app/api/health`
2. **Frontend**: Visit `https://lionfish-app-swahh.ondigitalocean.app`
3. **Dynamic Fetch**: Try fetching today's puzzle - should work seamlessly

## 🐛 Debugging

Console should now show:
```
🌐 [BackendAPI] Making request to: /api/fetch-puzzle/2025-08-21
✅ [BackendAPI] Successfully fetched puzzle for 2025-08-21
```

## 🚀 Deployment Process

When you push to `main` branch:
1. DigitalOcean triggers build
2. `npm run build` runs tests, builds React app, installs backend deps
3. `npm start` runs `start-production.js` 
4. Backend serves both API and frontend on port 8080
5. Dynamic puzzle fetching now works! 🎉

## 🔧 Environment Variables (Optional)

No environment variables needed for basic functionality! The app auto-detects production mode.

For custom configuration, you can still set:
- `NODE_ENV=production` (automatically set)
- `PORT=8080` (DigitalOcean default)
- `CORS_ORIGIN` (optional, defaults work fine)
