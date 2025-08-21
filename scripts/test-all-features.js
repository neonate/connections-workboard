#!/usr/bin/env node

/**
 * Comprehensive Test Script for NYT Connections Puzzle Data Update Script
 * This script tests all the major functionality of the update-puzzle-data.js script
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SCRIPT_PATH = path.join(__dirname, 'update-puzzle-data.js');
const TEST_PUZZLE_PATH = path.join(__dirname, 'test-puzzle.json');

// Test puzzle data
const testPuzzle = {
  "date": "2025-08-19",
  "gameId": 801,
  "groups": [
    {
      "name": "ANIMAL SOUNDS",
      "level": 0,
      "words": ["BARK", "MEOW", "MOO", "OINK"]
    },
    {
      "name": "COLORS",
      "level": 1,
      "words": ["RED", "BLUE", "GREEN", "YELLOW"]
    },
    {
      "name": "FRUITS",
      "level": 2,
      "words": ["APPLE", "BANANA", "ORANGE", "GRAPE"]
    },
    {
      "name": "COUNTRIES",
      "level": 3,
      "words": ["USA", "CANADA", "MEXICO", "BRAZIL"]
    }
  ]
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function runCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

function testFeature(name, testFn) {
  logInfo(`Testing: ${name}`);
  try {
    const result = testFn();
    if (result) {
      logSuccess(`${name} - PASSED`);
      return true;
    } else {
      logError(`${name} - FAILED`);
      return false;
    }
  } catch (error) {
    logError(`${name} - ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('🧪 Starting comprehensive feature tests...', 'blue');
  log('');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: List command
  totalTests++;
  if (testFeature('List Command', () => {
    const result = runCommand(`node ${SCRIPT_PATH} list`);
    return result.success && result.output.includes('Available puzzle dates');
  })) passedTests++;
  
  // Test 2: Validate command
  totalTests++;
  if (testFeature('Validate Command', () => {
    const result = runCommand(`node ${SCRIPT_PATH} validate`);
    return result.success && (result.output.includes('All puzzles validated successfully') || result.output.includes('All 18 puzzles validated successfully'));
  })) passedTests++;
  
  // Test 3: Stats command
  totalTests++;
  if (testFeature('Stats Command', () => {
    const result = runCommand(`node ${SCRIPT_PATH} stats`);
    return result.success && result.output.includes('Puzzle Statistics');
  })) passedTests++;
  
  // Test 4: Search command
  totalTests++;
  if (testFeature('Search Command', () => {
    const result = runCommand(`node ${SCRIPT_PATH} search "ZEBRA"`);
    return result.success && result.output.includes('Found 1 puzzle(s) containing "ZEBRA"');
  })) passedTests++;
  
  // Test 5: Create test puzzle file
  totalTests++;
  if (testFeature('Create Test Puzzle File', () => {
    fs.writeFileSync(TEST_PUZZLE_PATH, JSON.stringify(testPuzzle, null, 2));
    return fs.existsSync(TEST_PUZZLE_PATH);
  })) passedTests++;
  
  // Test 6: Add puzzle
  totalTests++;
  if (testFeature('Add Puzzle Command', () => {
    const result = runCommand(`node ${SCRIPT_PATH} add --date 2025-08-19 --puzzle-file ${TEST_PUZZLE_PATH}`);
    return result.success && result.output.includes('added successfully');
  })) passedTests++;
  
  // Test 7: Verify puzzle was added
  totalTests++;
  if (testFeature('Verify Added Puzzle', () => {
    const result = runCommand(`node ${SCRIPT_PATH} list`);
    return result.success && result.output.includes('2025-08-19');
  })) passedTests++;
  
  // Test 8: Search for added puzzle
  totalTests++;
  if (testFeature('Search Added Puzzle', () => {
    const result = runCommand(`node ${SCRIPT_PATH} search "ANIMAL SOUNDS"`);
    return result.success && result.output.includes('Found 1 puzzle(s) containing "ANIMAL SOUNDS"');
  })) passedTests++;
  
  // Test 9: Force update puzzle
  totalTests++;
  if (testFeature('Force Update Puzzle', () => {
    const updatedPuzzle = { ...testPuzzle };
    updatedPuzzle.groups[0].name = 'ANIMAL SOUNDS UPDATED';
    fs.writeFileSync(TEST_PUZZLE_PATH, JSON.stringify(updatedPuzzle, null, 2));
    
    const result = runCommand(`node ${SCRIPT_PATH} add --date 2025-08-19 --puzzle-file ${TEST_PUZZLE_PATH} --force`);
    return result.success && result.output.includes('updated successfully');
  })) passedTests++;
  
  // Test 10: Verify force update
  totalTests++;
  if (testFeature('Verify Force Update', () => {
    const result = runCommand(`node ${SCRIPT_PATH} search "ANIMAL SOUNDS UPDATED"`);
    return result.success && result.output.includes('Found 1 puzzle(s) containing "ANIMAL SOUNDS UPDATED"');
  })) passedTests++;
  
  // Test 11: Remove puzzle
  totalTests++;
  if (testFeature('Remove Puzzle Command', () => {
    const result = runCommand(`node ${SCRIPT_PATH} remove --date 2025-08-19`);
    return result.success && result.output.includes('removed successfully');
  })) passedTests++;
  
  // Test 12: Verify puzzle was removed
  totalTests++;
  if (testFeature('Verify Removed Puzzle', () => {
    const result = runCommand(`node ${SCRIPT_PATH} list`);
    return result.success && !result.output.includes('2025-08-19');
  })) passedTests++;
  
  // Test 13: Backup command
  totalTests++;
  if (testFeature('Backup Command', () => {
    const result = runCommand(`node ${SCRIPT_PATH} backup`);
    return result.success && result.output.includes('Manual backup created');
  })) passedTests++;
  
  // Test 14: Clean up test files
  totalTests++;
  if (testFeature('Clean Up Test Files', () => {
    if (fs.existsSync(TEST_PUZZLE_PATH)) {
      fs.unlinkSync(TEST_PUZZLE_PATH);
    }
    return !fs.existsSync(TEST_PUZZLE_PATH);
  })) passedTests++;
  
  // Final validation
  totalTests++;
  if (testFeature('Final Validation', () => {
    const result = runCommand(`node ${SCRIPT_PATH} validate`);
    return result.success && (result.output.includes('All puzzles validated successfully') || result.output.includes('All 18 puzzles validated successfully'));
  })) passedTests++;
  
  // Results
  log('');
  log('📊 Test Results:', 'blue');
  log(`Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'red');
  
  if (passedTests === totalTests) {
    logSuccess('🎉 All tests passed! The script is working perfectly.');
  } else {
    logError(`⚠️  ${totalTests - passedTests} test(s) failed. Please check the output above.`);
  }
  
  log('');
  log('🧹 Cleaning up...', 'blue');
  
  // Clean up any remaining test files
  if (fs.existsSync(TEST_PUZZLE_PATH)) {
    fs.unlinkSync(TEST_PUZZLE_PATH);
  }
  
  logSuccess('Cleanup completed!');
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };
