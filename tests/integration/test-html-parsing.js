#!/usr/bin/env node

/**
 * HTML Structure Parsing Test Suite
 * Tests the new HTML-based parsing approach for TechRadar articles
 */

const fs = require('fs');
const path = require('path');

// Test cases specifically for HTML structure parsing
const HTML_PARSING_TESTS = [
  {
    date: '2025-08-23',
    description: 'HTML structure parsing - BRAKE FLUID separation',
    expectedCategory: 'LIQUIDS YOU PUT INTO CARS',
    expectedFirstWord: 'BRAKE FLUID',
    notes: 'Tests that HTML parsing correctly separates category from compound words'
  },
  {
    date: '2024-06-12',
    description: 'HTML structure parsing - HEDWIG AND THE ANGRY INCH',
    expectedCategory: 'ENDING IN UNITS OF MEASUREMENT',
    expectedFirstWord: 'HEDWIG AND THE ANGRY INCH',
    notes: 'Tests that HTML parsing correctly separates category from complex movie titles'
  },
  {
    date: '2025-08-22',
    description: 'HTML structure parsing - CHEVY CHASE compound name',
    expectedCategory: 'ACTORS WHOSE LAST NAMES ARE ALSO VERBS',
    expectedFirstWord: 'CHEVY CHASE',
    notes: 'Tests that HTML parsing correctly handles compound proper names'
  }
];

/**
 * Fetch puzzle data from our backend API
 */
async function fetchPuzzleData(date) {
  try {
    // Support different backend URLs for different environments
    const baseUrl = process.env.DIGITALOCEAN_APP_URL || 
                   process.env.BACKEND_URL || 
                   'http://localhost:3001';
    
    const response = await fetch(`${baseUrl}/api/fetch-puzzle/${date}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch ${date}:`, error.message);
    return null;
  }
}

/**
 * Test HTML structure parsing characteristics
 */
function testHTMLParsing(puzzleData, testCase) {
  const issues = [];
  
  if (!puzzleData.success) {
    issues.push(`API call failed: ${puzzleData.error}`);
    return issues;
  }
  
  const puzzle = puzzleData.data;
  
  // Find the group that should match our test case
  const targetGroup = puzzle.groups.find(group => 
    group.name === testCase.expectedCategory ||
    group.words.includes(testCase.expectedFirstWord)
  );
  
  if (!targetGroup) {
    issues.push(`Could not find group matching test case: ${testCase.description}`);
    return issues;
  }
  
  // Test 1: Category name should match expected
  if (targetGroup.name !== testCase.expectedCategory) {
    issues.push(`Category name mismatch: expected "${testCase.expectedCategory}", got "${targetGroup.name}"`);
  }
  
  // Test 2: First word should match expected
  if (targetGroup.words[0] !== testCase.expectedFirstWord) {
    issues.push(`First word mismatch: expected "${testCase.expectedFirstWord}", got "${targetGroup.words[0]}"`);
  }
  
  // Test 3: Category name should be clean (no concatenated words)
  const categoryWords = targetGroup.name.split(' ').filter(word => word.length > 0);
  const lastCategoryWord = categoryWords[categoryWords.length - 1];
  
  if (targetGroup.words.length > 0 && lastCategoryWord && lastCategoryWord.length > 2) {
    const firstWord = targetGroup.words[0];
    if (firstWord.startsWith(lastCategoryWord + ' ')) {
      issues.push(`HTML parsing issue: First word "${firstWord}" starts with last category word "${lastCategoryWord}"`);
    }
  }
  
  // Test 4: Category name should be reasonable length
  if (targetGroup.name.length > 50) {
    issues.push(`Category name is suspiciously long (${targetGroup.name.length} chars): "${targetGroup.name}"`);
  }
  
  // Test 5: Words should be reasonable length
  targetGroup.words.forEach((word, index) => {
    if (word.length > 30) {
      issues.push(`Word ${index} is very long (${word.length} chars): "${word}"`);
    }
  });
  
  return issues;
}

/**
 * Run HTML parsing tests
 */
async function runHTMLParsingTests() {
  console.log('🧪 HTML Structure Parsing Test Suite');
  console.log('=====================================\n');
  
  const testResults = [];
  
  for (const testCase of HTML_PARSING_TESTS) {
    console.log(`📅 Testing ${testCase.date}: ${testCase.description}`);
    console.log(`   Expected: Category="${testCase.expectedCategory}", First Word="${testCase.expectedFirstWord}"`);
    
    const result = {
      ...testCase,
      timestamp: new Date().toISOString(),
      success: false,
      issues: [],
      data: null
    };
    
    try {
      const puzzleData = await fetchPuzzleData(testCase.date);
      
      if (puzzleData) {
        result.data = puzzleData;
        result.issues = testHTMLParsing(puzzleData, testCase);
        result.success = result.issues.length === 0;
        
        if (result.success) {
          console.log(`   ✅ PASSED - HTML parsing working correctly`);
        } else {
          console.log(`   ❌ FAILED:`);
          result.issues.forEach(issue => console.log(`      - ${issue}`));
        }
      } else {
        result.issues.push('Failed to fetch data');
        console.log(`   ❌ FAILED: Could not fetch data`);
      }
    } catch (error) {
      result.issues.push(`Exception: ${error.message}`);
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    testResults.push(result);
    console.log(''); // spacing
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Create summary
  const passed = testResults.filter(r => r.success).length;
  const total = testResults.length;
  
  console.log('📊 HTML PARSING TEST SUMMARY');
  console.log('=============================');
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All HTML parsing tests passed! The new HTML-based approach is working correctly.');
  } else {
    console.log('⚠️ Some HTML parsing tests failed. Review issues above.');
  }
  
  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runHTMLParsingTests().catch(console.error);
}

module.exports = { runHTMLParsingTests, testHTMLParsing };
