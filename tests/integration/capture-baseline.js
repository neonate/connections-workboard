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
    description: 'HTML structure parsing - complex movie titles correctly separated',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Tests HTML-based parsing of complex titles like "HEDWIG AND THE ANGRY INCH" - should separate category from words'
  },
  {
    date: '2024-07-18',
    description: 'HTML structure parsing - standard format validation',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Clean HTML format, validates basic HTML structure parsing works'
  },
  {
    date: '2024-08-21',
    description: 'HTML structure parsing - duplicate HTML elements handling',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'TechRadar HTML contains duplicate sections, tests HTML selector robustness'
  },
  {
    date: '2024-06-01',
    description: 'HTML structure parsing - early coverage boundary',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'First reliable date in TechRadar coverage, tests HTML parsing on older articles'
  },
  {
    date: '2024-11-13',
    description: 'HTML structure parsing - different seasonal layouts',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Tests HTML parsing on different seasonal HTML layouts and structures'
  },
  {
    date: '2025-08-22',
    description: 'HTML structure parsing - compound proper names (CHEVY CHASE)',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Tests HTML parsing correctly handles compound proper names like CHEVY CHASE'
  },
  {
    date: '2025-03-06',
    description: 'HTML structure parsing - hint vs category separation',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Tests HTML parsing properly separates vague hints from full category names'
  },
  {
    date: '2025-08-23',
    description: 'HTML structure parsing - compound word separation (BRAKE FLUID)',
    expectedGroups: 4,
    expectedWords: 16,
    notes: 'Tests HTML parsing correctly separates "LIQUIDS YOU PUT INTO CARS" from "BRAKE FLUID"'
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
  
  // HTML-based parsing specific validations
  puzzle.groups.forEach((group, index) => {
    // Check that category names are clean (no concatenated words)
    const categoryWords = group.name.split(' ').filter(word => word.length > 0);
    const lastCategoryWord = categoryWords[categoryWords.length - 1];
    
    // Check that the first word in the group doesn't start with the last word of the category
    // This catches the old parsing issue where "LIQUIDS YOU PUT INTO CARS BRAKE" would have "FLUID" as first word
    if (group.words.length > 0 && lastCategoryWord && lastCategoryWord.length > 2) {
      const firstWord = group.words[0];
      if (firstWord.startsWith(lastCategoryWord + ' ')) {
        issues.push(`Group ${index} (${group.name}): First word "${firstWord}" starts with last category word "${lastCategoryWord}" - possible old parsing issue`);
      }
    }
    
    // Check that category names are reasonable length (not extremely long concatenated strings)
    if (group.name.length > 50) {
      issues.push(`Group ${index} category name is very long (${group.name.length} chars): "${group.name}" - possible concatenation issue`);
    }
    
    // Check that words don't contain obvious category fragments
    group.words.forEach((word, wordIndex) => {
      if (word.length > 30) {
        issues.push(`Group ${index} word ${wordIndex} is very long (${word.length} chars): "${word}" - possible parsing issue`);
      }
    });
  });
  
  return issues;
}

/**
 * Capture baseline data for all known working dates
 */
async function captureBaseline() {
  console.log('🧪 TechRadar Parser Baseline Capture');
  console.log('=====================================\n');
  
  // Check if baseline already exists
  const baselinePath = path.join(__dirname, 'baseline-data.json');
  let existingBaseline = null;
  
  if (fs.existsSync(baselinePath)) {
    try {
      existingBaseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      console.log('📁 Found existing baseline - preserving timestamps unless data changes');
    } catch (error) {
      console.log('⚠️  Could not read existing baseline, will create new one');
    }
  }
  
  const baselineData = {
    capturedAt: new Date().toISOString(), // Will be updated if data changes
    nodeVersion: process.version,
    testResults: []
  };
  
  // Check if any data has actually changed
  let anyDataChanged = false;
  
  for (const testCase of KNOWN_WORKING_DATES) {
    console.log(`📅 Testing ${testCase.date}: ${testCase.description}`);
    
    // Check if we have existing data for this date
    const existingTest = existingBaseline?.testResults?.find(r => r.date === testCase.date);
    
    const result = {
      ...testCase,
      timestamp: new Date().toISOString(), // Will be updated if data changes
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
        
        // Check if data has actually changed from existing baseline
        if (existingTest && existingTest.success && result.success) {
          const dataChanged = hasDataChanged(existingTest.data, result.data);
          if (!dataChanged) {
            // Data hasn't changed, preserve existing timestamps by using existing data
            result.timestamp = existingTest.timestamp;
            result.data = existingTest.data; // Use the entire existing data object
            console.log(`   ✅ PASSED (data unchanged, timestamp preserved)`);
          } else {
            // Data has changed, update timestamp
            anyDataChanged = true;
            console.log(`   ✅ PASSED (data changed, timestamp updated)`);
          }
        } else {
          // No existing data or test failed, use new timestamp
          anyDataChanged = true;
          console.log(`   ✅ PASSED`);
        }
        
        if (!result.success) {
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
  
  // Only update main timestamp if data has changed
  if (existingBaseline && !anyDataChanged) {
    baselineData.capturedAt = existingBaseline.capturedAt;
    console.log('📁 All data unchanged - preserving main timestamp');
  }
  
  // Save baseline data
  fs.writeFileSync(baselinePath, JSON.stringify(baselineData, null, 2));
  
  // Create summary
  const passed = baselineData.testResults.filter(r => r.success).length;
  const total = baselineData.testResults.length;
  
  console.log('📊 SUMMARY');
  console.log('===========');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Baseline saved to: ${baselinePath}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Baseline is solid.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review issues before making parser changes.');
    process.exit(1);
  }
}

/**
 * Check if puzzle data has actually changed (ignoring timestamps)
 */
function hasDataChanged(oldData, newData) {
  if (!oldData || !newData) return true;
  
  // Compare the actual puzzle content, not metadata
  const oldGroups = oldData.data?.groups || [];
  const newGroups = newData.data?.groups || [];
  
  if (oldGroups.length !== newGroups.length) return true;
  
  for (let i = 0; i < oldGroups.length; i++) {
    const oldGroup = oldGroups[i];
    const newGroup = newGroups[i];
    
    if (oldGroup.name !== newGroup.name) return true;
    if (oldGroup.words.length !== newGroup.words.length) return true;
    
    for (let j = 0; j < oldGroup.words.length; j++) {
      if (oldGroup.words[j] !== newGroup.words[j]) return true;
    }
  }
  
  return false;
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
} else if (mode === 'update-timestamps') {
  console.log('🔄 Updating all timestamps in baseline...');
  updateAllTimestamps();
} else if (mode === 'help' || mode === '--help' || mode === '-h') {
  showHelp();
} else {
  captureBaseline();
}

/**
 * Update all timestamps in existing baseline (useful for maintenance)
 */
async function updateAllTimestamps() {
  const baselinePath = path.join(__dirname, 'baseline-data.json');
  
  if (!fs.existsSync(baselinePath)) {
    console.log('❌ No baseline found. Run capture mode first.');
    process.exit(1);
  }
  
  console.log('📁 Reading existing baseline...');
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  
  // Update main timestamp
  baseline.capturedAt = new Date().toISOString();
  
  // Update all test timestamps
  baseline.testResults.forEach(result => {
    result.timestamp = new Date().toISOString();
    if (result.data) {
      result.data.fetchedAt = new Date().toISOString();
    }
  });
  
  // Save updated baseline
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
  console.log('✅ All timestamps updated in baseline');
}

/**
 * Show usage information
 */
function showHelp() {
  console.log('🧪 TechRadar Parser Baseline Tool');
  console.log('==================================\n');
  console.log('Usage: node capture-baseline.js [mode]\n');
  console.log('Modes:');
  console.log('  (none)     - Capture new baseline or update existing one');
  console.log('  compare    - Compare current results against existing baseline');
  console.log('  update-timestamps - Force update all timestamps in baseline');
  console.log('  help       - Show this help message\n');
  console.log('Examples:');
  console.log('  node capture-baseline.js              # Capture/update baseline');
  console.log('  node capture-baseline.js compare      # Run regression tests');
  console.log('  node capture-baseline.js update-timestamps # Update all timestamps');
}
