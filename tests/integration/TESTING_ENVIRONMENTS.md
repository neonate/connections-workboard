# Testing Environments Guide

This document explains how to run parser regression tests in different environments.

## 🖥️ Local Development

```bash
# Start backend server
cd backend && node server.js &

# Run parser tests
npm run test:parser
```

## 🚀 GitHub Actions (CI/CD)

Parser tests are automatically run in GitHub Actions workflow on:
- Push to `main` branch
- Pull requests to `main` branch

The workflow:
1. Installs dependencies
2. Runs React/Jest tests
3. Starts backend server
4. Runs parser regression tests
5. Stops backend server
6. Builds the project

## 🌊 DigitalOcean Deployment

To run parser tests against a DigitalOcean deployment:

```bash
# Set the production URL
export DIGITALOCEAN_APP_URL="https://your-app-url.ondigitalocean.app"

# Run tests against production
npm run test:parser
```

Or specify a custom backend URL:

```bash
export BACKEND_URL="https://custom-backend-url.com"
npm run test:parser
```

## 🔧 Environment Variables

- `NODE_ENV`: `development`, `test`, or `production`
- `BACKEND_URL`: Custom backend URL for tests
- `DIGITALOCEAN_APP_URL`: DigitalOcean app URL (takes precedence)
- `PORT`: Backend server port (default: 3001)

## 📊 Test Configuration

Parser tests verify:
- ✅ **Data Structure**: 4 groups, 16 words total
- ✅ **No Duplicates**: Words and groups are unique
- ✅ **Parser Logic**: HTML parsing consistency
- ✅ **Regression Prevention**: Changes don't break existing dates

Test dates include:
- `2024-06-12`: Complex movie titles (edge case)
- `2024-07-18`: Standard format baseline
- `2024-08-21`: Duplicate HTML handling
- `2024-06-01`: Early TechRadar coverage
- `2024-11-13`: November HTML structure
- `2025-08-22`: Current date with compound names

## 🛠️ Troubleshooting

### Backend Server Not Starting
```bash
# Check if port is in use
lsof -i :3001

# Kill existing processes
pkill -f "node server.js"
```

### Tests Failing in Production
```bash
# Check server health
curl https://your-app-url.ondigitalocean.app/api/health

# Run with debug output
BACKEND_URL="https://your-app-url.ondigitalocean.app" npm run test:parser
```

### CORS Issues
Ensure your production backend has proper CORS configuration for the testing environment.
