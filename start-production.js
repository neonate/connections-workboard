#!/usr/bin/env node

/**
 * Production startup script for DigitalOcean deployment
 * Runs both backend API server and serves the React build
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Connections Workboard in production mode...');

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Check if backend dependencies are installed
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
  console.log('📦 Installing backend dependencies...');
  const backendInstall = spawn('npm', ['install'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org'
    }
  });
  
  backendInstall.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Failed to install backend dependencies');
      process.exit(1);
    }
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  console.log('🌐 Starting backend server...');
  
  // Set environment variables for production
  process.env.NODE_ENV = 'production';
  process.env.PORT = process.env.PORT || '8080';
  
  // Start the backend server (which also serves the frontend build)
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      // Backend will serve frontend from the build directory
      SERVE_FRONTEND: 'true'
    }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`💥 Server process exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📡 Received SIGTERM, shutting down gracefully...');
    serverProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('📡 Received SIGINT, shutting down gracefully...');
    serverProcess.kill('SIGINT');
  });
}
