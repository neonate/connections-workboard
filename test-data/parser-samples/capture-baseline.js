#!/usr/bin/env node

/**
 * Baseline capture script for TechRadar parser
 * Captures known working dates and their expected outputs for regression testing
 */

const fs = require('fs');
const path = require('path');

// Known working dates with expected characteristics
const KNOWN_WORKING_DATES = [
  {
    date: '2024-06-12',
    description: 'Edge case with complex movie titles - Hedwig and the Angry Inch',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Contains multi-word movie titles that can confuse parser'
  },
  {
    date: '2024-07-18',
    description: 'Standard format, simple group names',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Clean format, good baseline example'
  },
  {
    date: '2024-08-21',
    description: 'Has duplicate HTML elements (regression test)',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'TechRadar HTML contains duplicate sections, tests deduplication'
  },
  {
    date: '2024-06-01',
    description: 'Early June 2024 - boundary of TechRadar coverage',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'First reliable date in TechRadar coverage'
  },
  {
    date: '2024-11-13',
    description: 'November date - different HTML structure',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Tests different seasonal HTML layouts'
  },
  {
    date: '2025-08-22',
    description: 'Current date with compound names (CHEVY CHASE parsing bug)',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Tests parsing of compound proper names like CHEVY CHASE'
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
 * Validate puzzle data meets expectations
 */
function validatePuzzleData(data, expected) {
  const issues = [];
  
  if (!data.success) {
    issues.push(`API call failed: ${data.error}`);
    return issues;
  }
  
  const puzzle = data.data;
  
  if (puzzle.groups.length !== expected.expectedGroups) {
    issues.push(`Expected ${expected.expectedGroups} groups, got ${puzzle.groups.length}`);
  }
  
  if (puzzle.words.length !== expected.expectedWords) {
    issues.push(`Expected ${expected.expectedWords} words, got ${puzzle.words.length}`);
  }
  
  // Check for duplicate groups
  const groupNames = puzzle.groups.map(g => g.name);
  const uniqueGroups = new Set(groupNames);
  if (uniqueGroups.size !== groupNames.length) {
    issues.push(`Found duplicate groups: ${groupNames.join(', ')}`);
  }
  
  // Check for duplicate words
  const allWords = puzzle.words;
  const uniqueWords = new Set(allWords);
  if (uniqueWords.size !== allWords.length) {
    issues.push(`Found duplicate words`);
  }
  
  // Check that each group has 4 words
  puzzle.groups.forEach((group, index) => {
    if (group.words.length !== 4) {
      issues.push(`Group ${index} (${group.name}) has ${group.words.length} words, expected 4`);
    }
  });
  
  return issues;
}

/**
 * Capture baseline data for all known working dates
 */
async function captureBaseline() {
  console.log('🧪 TechRadar Parser Baseline Capture');
  console.log('=====================================\n');
  
  const baselineData = {
    capturedAt: new Date().toISOString(),
    nodeVersion: process.version,
    testResults: []
  };
  
  for (const testCase of KNOWN_WORKING_DATES) {
    console.log(`📅 Testing ${testCase.date}: ${testCase.description}`);
    
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
        result.issues = validatePuzzleData(puzzleData, testCase);
        result.success = result.issues.length === 0;
        
        if (result.success) {
          console.log(`   ✅ PASSED`);
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
    
    baselineData.testResults.push(result);
    console.log(''); // spacing
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save baseline data
  const outputPath = path.join(__dirname, 'baseline-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(baselineData, null, 2));
  
  // Create summary
  const passed = baselineData.testResults.filter(r => r.success).length;
  const total = baselineData.testResults.length;
  
  console.log('📊 SUMMARY');
  console.log('===========');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Baseline saved to: ${outputPath}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Baseline is solid.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review issues before making parser changes.');
    process.exit(1);
  }
}

/**
 * Compare current results against baseline
 */
async function compareToBaseline() {
  const baselinePath = path.join(__dirname, 'baseline-data.json');
  
  if (!fs.existsSync(baselinePath)) {
    console.log('❌ No baseline found. Run capture mode first.');
    process.exit(1);
  }
  
  console.log('🔍 Comparing against baseline...\n');
  
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  let regressions = 0;
  
  for (const baselineTest of baseline.testResults) {
    if (!baselineTest.success) continue; // Skip tests that were already failing
    
    console.log(`📅 Testing ${baselineTest.date}...`);
    
    const currentData = await fetchPuzzleData(baselineTest.date);
    const issues = validatePuzzleData(currentData, baselineTest);
    
    if (issues.length === 0) {
      console.log(`   ✅ PASSED (matches baseline)`);
    } else {
      console.log(`   ❌ REGRESSION DETECTED:`);
      issues.forEach(issue => console.log(`      - ${issue}`));
      regressions++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Regression test complete: ${regressions} regressions found`);
  
  if (regressions === 0) {
    console.log('🎉 No regressions! Parser changes are safe.');
    process.exit(0);
  } else {
    console.log('⚠️  Regressions detected! Review parser changes.');
    process.exit(1);
  }
}

// Main execution
const mode = process.argv[2];

if (mode === 'compare') {
  compareToBaseline();
} else {
  captureBaseline();
}
