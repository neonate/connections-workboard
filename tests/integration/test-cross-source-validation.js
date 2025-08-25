/**
 * Cross-Source Validation Test Suite
 * 
 * This script tests the cross-source validation functionality between
 * TechRadar and Times of India parsers to ensure they can work together
 * reliably and catch discrepancies in puzzle data.
 */

const fs = require('fs');
const path = require('path');

// Import our test data
const { TOI_TEST_SAMPLES } = require('./toi-samples.js');

// Load TechRadar baseline data
const baselineDataPath = path.join(__dirname, 'baseline-data.json');
const baselineData = JSON.parse(fs.readFileSync(baselineDataPath, 'utf8'));

/**
 * Mock TechRadar parser for testing
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Parsed puzzle data
 */
function mockTechRadarParser(date) {
  // Find matching baseline data
  const baselineEntry = baselineData.testResults.find(entry => entry.date === date);
  
  if (!baselineEntry || !baselineEntry.success) {
    throw new Error(`No TechRadar data available for ${date}`);
  }
  
  return baselineEntry.data.data;
}

/**
 * Mock TOI parser for testing
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Parsed puzzle data
 */
function mockTOIParser(date) {
  // Find matching TOI sample data
  const toiEntry = TOI_TEST_SAMPLES.find(entry => entry.date === date);
  
  if (!toiEntry) {
    throw new Error(`No TOI data available for ${date}`);
  }
  
  // Convert TOI sample format to standard puzzle format
  return {
    date: toiEntry.date,
    gameId: parseInt(toiEntry.date.replace(/-/g, '')),
    groups: toiEntry.expectedGroups.map((group, index) => ({
      name: group.name,
      level: group.level,
      words: group.words,
      hint: group.hint
    })),
    source: 'Times of India (Mock)',
    words: toiEntry.expectedGroups.flatMap(group => group.words)
  };
}

/**
 * Cross-validate data from multiple sources and select the best one
 * @param {Object} sourceResults - Data from each source
 * @param {Object} sourceErrors - Errors from each source
 * @param {string} date - Date being fetched
 * @returns {Object} Validation result with best data and discrepancies
 */
function crossValidateSources(sourceResults, sourceErrors, date) {
  const availableSources = Object.keys(sourceResults).filter(source => sourceResults[source]);
  const discrepancies = [];
  
  console.log(`🔍 Cross-validation: ${availableSources.length} sources available for ${date}`);
  
  if (availableSources.length === 0) {
    throw new Error('No sources provided valid data');
  }
  
  if (availableSources.length === 1) {
    const source = availableSources[0];
    console.log(`📊 Single source available: ${source}`);
    return {
      bestData: sourceResults[source],
      bestSource: source,
      discrepancies: [],
      confidence: 'single_source'
    };
  }
  
  // Compare data quality across sources
  const sourceScores = {};
  
  for (const source of availableSources) {
    const data = sourceResults[source];
    let score = 0;
    const issues = [];
    
    // Score based on data completeness
    if (data.groups && data.groups.length === 4) score += 20;
    if (data.words && data.words.length === 16) score += 20;
    
    // Score based on data quality
    if (data.groups) {
      data.groups.forEach((group, index) => {
        // Check for compound word parsing issues
        if (group.words && group.words.some(word => word.includes(' '))) {
          score += 5; // Bonus for compound words (indicates good parsing)
        }
        
        // Check for reasonable category names (not too long, not empty)
        if (group.name && group.name.length > 0 && group.name.length < 100) {
          score += 5;
        } else {
          issues.push(`Group ${index + 1}: ${group.name ? 'name too long' : 'missing name'}`);
        }
        
        // Check for proper word counts
        if (group.words && group.words.length === 4) {
          score += 5;
        } else {
          issues.push(`Group ${index + 1}: expected 4 words, got ${group.words?.length || 0}`);
        }
      });
    }
    
    // Score based on hints availability
    if (data.groups && data.groups.some(g => g.hint && g.hint !== g.name)) {
      score += 10; // Bonus for proper hints
    }
    
    sourceScores[source] = { score, issues };
    console.log(`📊 ${source} score: ${score}/100 (${issues.length} issues)`);
  }
  
  // Find the best source
  const bestSource = Object.keys(sourceScores).reduce((best, current) => 
    sourceScores[current].score > sourceScores[best].score ? current : best
  );
  
  // Check for significant discrepancies between sources
  const bestScore = sourceScores[bestSource].score;
  const otherSources = availableSources.filter(s => s !== bestSource);
  
  for (const source of otherSources) {
    const scoreDiff = bestScore - sourceScores[source].score;
    if (scoreDiff > 20) { // Significant quality difference
      discrepancies.push({
        source: source,
        issue: `Data quality significantly lower (score: ${sourceScores[source].score} vs ${bestScore})`,
        details: sourceScores[source].issues
      });
    }
    
    // Check for word list discrepancies
    const bestWords = sourceResults[bestSource].words.sort();
    const currentWords = sourceResults[source].words.sort();
    
    if (JSON.stringify(bestWords) !== JSON.stringify(currentWords)) {
      discrepancies.push({
        source: source,
        issue: 'Word list differs from best source',
        details: {
          bestWords: bestWords,
          currentWords: currentWords
        }
      });
    }
  }
  
  console.log(`🎯 Best source: ${bestSource} (score: ${bestScore}/100)`);
  
  return {
    bestData: sourceResults[sourceResults[bestSource]],
    bestSource: bestSource,
    discrepancies: discrepancies,
    confidence: availableSources.length > 1 ? 'cross_validated' : 'single_source',
    sourceScores: sourceScores
  };
}

/**
 * Test cross-source validation for a specific date
 * @param {string} date - Date to test
 * @returns {Object} Test result
 */
function testCrossSourceValidation(date) {
  console.log(`\n🧪 Testing cross-source validation for ${date}...`);
  
  const sourceResults = {};
  const sourceErrors = {};
  
  // Test TechRadar parser
  try {
    sourceResults.TechRadar = mockTechRadarParser(date);
    console.log(`✅ TechRadar: Successfully parsed ${sourceResults.TechRadar.groups.length} groups`);
  } catch (error) {
    console.log(`❌ TechRadar: ${error.message}`);
    sourceErrors.TechRadar = error.message;
  }
  
  // Test TOI parser
  try {
    sourceResults.TimesOfIndia = mockTOIParser(date);
    console.log(`✅ Times of India: Successfully parsed ${sourceResults.TimesOfIndia.groups.length} groups`);
  } catch (error) {
    console.log(`❌ Times of India: ${error.message}`);
    sourceErrors.TimesOfIndia = error.message;
  }
  
  // Run cross-validation
  try {
    const validationResult = crossValidateSources(sourceResults, sourceErrors, date);
    
    console.log(`🎯 Cross-validation result:`);
    console.log(`   Best source: ${validationResult.bestSource}`);
    console.log(`   Confidence: ${validationResult.confidence}`);
    console.log(`   Discrepancies: ${validationResult.discrepancies.length}`);
    
    if (validationResult.discrepancies.length > 0) {
      console.log(`   ⚠️ Discrepancies found:`);
      validationResult.discrepancies.forEach(d => {
        console.log(`      • ${d.source}: ${d.issue}`);
        if (d.details && d.details.bestWords && d.details.currentWords) {
          console.log(`        Best: ${d.details.bestWords.slice(0, 3).join(', ')}...`);
          console.log(`        ${d.source}: ${d.details.currentWords.slice(0, 3).join(', ')}...`);
        }
      });
    }
    
    return {
      success: true,
      validationResult,
      sourceResults,
      sourceErrors
    };
    
  } catch (error) {
    console.log(`❌ Cross-validation failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      sourceResults,
      sourceErrors
    };
  }
}

/**
 * Find overlapping dates between TechRadar and TOI data
 * @returns {string[]} Array of dates available in both sources
 */
function findOverlappingDates() {
  const techRadarDates = baselineData.testResults
    .filter(entry => entry.success)
    .map(entry => entry.date);
  
  const toiDates = TOI_TEST_SAMPLES.map(entry => entry.date);
  
  const overlapping = techRadarDates.filter(date => toiDates.includes(date));
  
  console.log(`📅 Date overlap analysis:`);
  console.log(`   TechRadar dates: ${techRadarDates.length}`);
  console.log(`   TOI dates: ${toiDates.length}`);
  console.log(`   Overlapping dates: ${overlapping.length}`);
  
  return overlapping;
}

/**
 * Run comprehensive cross-source validation tests
 */
function runCrossSourceValidationTests() {
  console.log('🚀 Running Cross-Source Validation Tests...\n');
  
  // Find overlapping dates
  const overlappingDates = findOverlappingDates();
  
  if (overlappingDates.length === 0) {
    console.log('❌ No overlapping dates found between TechRadar and TOI data');
    console.log('   Cannot test cross-source validation');
    return;
  }
  
  console.log(`\n🧪 Testing ${overlappingDates.length} overlapping dates...\n`);
  
  const testResults = [];
  
  for (const date of overlappingDates) {
    const result = testCrossSourceValidation(date);
    testResults.push({
      date,
      ...result
    });
  }
  
  // Summary
  console.log('\n📊 Cross-Source Validation Test Summary:');
  console.log(`   Total tests: ${testResults.length}`);
  console.log(`   Successful validations: ${testResults.filter(r => r.success).length}`);
  console.log(`   Failed validations: ${testResults.filter(r => !r.success).length}`);
  
  const totalDiscrepancies = testResults.reduce((sum, r) => 
    sum + (r.success ? r.validationResult.discrepancies.length : 0), 0
  );
  console.log(`   Total discrepancies found: ${totalDiscrepancies}`);
  
  if (totalDiscrepancies > 0) {
    console.log('\n⚠️ Discrepancies detected between sources:');
    testResults.forEach(result => {
      if (result.success && result.validationResult.discrepancies.length > 0) {
        console.log(`   ${result.date}: ${result.validationResult.discrepancies.length} discrepancies`);
      }
    });
  }
  
  // Save detailed results
  const outputPath = path.join(__dirname, 'cross-source-validation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    testRun: new Date().toISOString(),
    overlappingDates,
    testResults,
    summary: {
      totalTests: testResults.length,
      successfulValidations: testResults.filter(r => r.success).length,
      failedValidations: testResults.filter(r => !r.success).length,
      totalDiscrepancies
    }
  }, null, 2));
  
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);
  
  return testResults;
}

// Run tests if this file is executed directly
if (require.main === module) {
  try {
    runCrossSourceValidationTests();
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

module.exports = {
  testCrossSourceValidation,
  crossValidateSources,
  findOverlappingDates,
  runCrossSourceValidationTests
};
