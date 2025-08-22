#!/bin/bash

# Parser Regression Test Script
# Validates parser changes against known working dates

set -e  # Exit on any error

# Get the script directory to work from any location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🧪 Parser Regression Test"
echo "=========================="
echo "📂 Project root: $PROJECT_ROOT"

# Set working directory to project root
cd "$PROJECT_ROOT"

# Check if backend is running with timeout
echo "🔍 Checking backend server..."
# Support both local development and production deployment
if [ -n "$DIGITALOCEAN_APP_URL" ]; then
    BACKEND_URL="$DIGITALOCEAN_APP_URL"
elif [ -n "$BACKEND_URL" ]; then
    BACKEND_URL="$BACKEND_URL"
else
    BACKEND_URL="http://localhost:3001"
fi
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "${BACKEND_URL}/api/health" > /dev/null 2>&1; then
        echo "✅ Backend server is running at $BACKEND_URL"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "❌ Backend server not running at $BACKEND_URL after $MAX_RETRIES attempts"
        echo "   For local testing: cd backend && node server.js"
        echo "   For CI/CD: ensure backend is started before this script"
        exit 1
    fi
    
    echo "⏳ Waiting for backend server... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 1
done

# Run baseline comparison
cd test-data/parser-samples

if [ ! -f baseline-data.json ]; then
    echo "📸 No baseline found, capturing current state..."
    node capture-baseline.js
    echo "✅ Baseline captured"
else
    echo "🔍 Running regression test..."
    if node capture-baseline.js --compare; then
        echo "✅ All parser regression tests passed!"
    else
        echo "❌ Parser regression test failed!"
        exit 1
    fi
fi

echo "🎉 Parser regression test completed"
