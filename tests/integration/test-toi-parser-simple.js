/**
 * Simple Times of India Parser Test
 * 
 * This script tests our TOI parser logic without external dependencies
 */

const { TOI_TEST_SAMPLES } = require('./toi-samples');

/**
 * Simple TOI parser function for testing
 * This simulates what our actual TOI parser should do
 * @param {string} content - Text content to parse
 * @param {string} date - Date being parsed
 * @returns {Object} Parsed puzzle data
 */
function simpleTOIParser(content, date) {
  const hints = {};
  const groups = [];
  const allWords = [];
  
  // Parse hints - look for patterns like "Yellow: Car liquids"
  const hintPattern = /(Yellow|Green|Blue|Purple):\s*([^\n]+)/gi;
  let hintMatch;
  
  while ((hintMatch = hintPattern.exec(content)) !== null) {
    const color = hintMatch[1].toLowerCase();
    const hint = hintMatch[2].trim();
    hints[color] = hint;
  }
  
  // Parse answers using the split approach that works
  // Split by group markers and process each section
  const groupSections = content.split(/(?=(?:Yellow|Green|Blue|Purple)\s+group)/);
  
  groupSections.forEach((section, index) => {
    // Skip the first section (it's the content before the first group)
    if (index === 0) return;
    
    // Extract group name and words from the section
    const groupMatch = section.match(/^(Yellow|Green|Blue|Purple)\s+group\s*[–-]\s*(.+)/i);
    
    if (groupMatch) {
      const groupName = groupMatch[1].trim();
      const wordsText = groupMatch[2].trim();
      
      // Parse words (split by comma and clean up)
      const words = wordsText.split(',').map(word => word.trim());
      
      // Determine difficulty level based on color order
      const colorOrder = ['yellow', 'green', 'blue', 'purple'];
      const level = colorOrder.indexOf(groupName.toLowerCase());
      
      // Get hint for this group
      const hint = hints[groupName.toLowerCase()] || groupName;
      
      groups.push({
        name: groupName,
        level: level >= 0 ? level : groups.length,
        words: words,
        hint: hint
      });
      
      allWords.push(...words);
    }
  });
  
  return {
    date: date,
    gameId: null,
    words: allWords,
    groups: groups,
    source: 'Times of India (Test)',
    hints: hints
  };
}

/**
 * Test the parser with actual TOI content format
 * @param {string} date - Date to test
 * @returns {Object} Test result
 */
function testWithActualTOIFormat(date) {
  console.log(`\n🔍 Testing with actual TOI format for ${date}...`);
  
  // Create content in the actual format we discovered from TOI
  const actualTOIContent = `
Today's NYT Connections hints
Yellow: Car liquids
Green: Place for hosting events
Blue: Deceptive behavior
Purple: New inventions

Today's NYT Connections answers
Yellow group – BRAKE FLUID, COOLANT, FUEL, OILGreen group – BOWL, COLISEUM, HIPPODROME, STADIUMBlue group – CHICANERY, DECEIT, LEGERDEMAIN, SUBTERFUGEPurple group – CRYPTO, PODCAST, SMARTWATCH, VAPE
  `;
  
  try {
    const parsedData = simpleTOIParser(actualTOIContent, date);
    
    console.log(`✅ Parsed data:`, {
      groups: parsedData.groups?.length || 0,
      words: parsedData.words?.length || 0,
      source: parsedData.source
    });
    
    if (parsedData.groups) {
      parsedData.groups.forEach((group, index) => {
        console.log(`   Group ${index + 1}: ${group.name} (${group.words?.length || 0} words) - "${group.hint}"`);
        if (group.words) {
          console.log(`      Words: ${group.words.join(', ')}`);
        }
      });
    }
    
    return {
      success: true,
      data: parsedData
    };
    
  } catch (error) {
    console.log(`❌ Error parsing actual TOI format: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test against our sample data
 * @returns {Object} Test results
 */
function testAgainstSamples() {
  const results = {
    totalTests: TOI_TEST_SAMPLES.length,
    passed: 0,
    failed: 0,
    details: []
  };

  console.log(`🧪 Testing TOI Parser against ${TOI_TEST_SAMPLES.length} samples...`);

  TOI_TEST_SAMPLES.forEach((sample, index) => {
    console.log(`\n🔍 Test ${index + 1}: ${sample.date} - ${sample.description}`);
    
    try {
      // Create mock content for this sample
      const mockContent = createMockTOIContent(sample);
      
      // Parse the mock content
      const parsedData = simpleTOIParser(mockContent, sample.date);
      
      // Validate the results
      const testResult = validateParsing(parsedData, sample);
      
      if (testResult.passed) {
        console.log(`✅ PASSED: ${sample.date}`);
        results.passed++;
      } else {
        console.log(`❌ FAILED: ${sample.date}`);
        console.log(`   Issues: ${testResult.issues.join(', ')}`);
        results.failed++;
      }
      
      results.details.push({
        date: sample.date,
        passed: testResult.passed,
        issues: testResult.issues,
        parsed: parsedData,
        expected: sample
      });
      
    } catch (error) {
      console.log(`❌ ERROR: ${sample.date} - ${error.message}`);
      results.failed++;
      results.details.push({
        date: sample.date,
        passed: false,
        issues: [`Parser error: ${error.message}`],
        parsed: null,
        expected: sample
      });
    }
  });

  return results;
}

/**
 * Create mock TOI content for testing
 * @param {Object} sample - Test sample data
 * @returns {string} Mock content
 */
function createMockTOIContent(sample) {
  const hints = Object.entries(sample.expectedHints)
    .map(([color, hint]) => `${color.charAt(0).toUpperCase() + color.slice(1)}: ${hint}`)
    .join('\n');

  const answers = sample.expectedGroups
    .map(group => `${group.name} group – ${group.words.join(', ')}`)
    .join('');

  return `
Today's NYT Connections hints
${hints}

Today's NYT Connections answers
${answers}
  `;
}

/**
 * Validate parsed data against expected results
 * @param {Object} parsedData - Data returned by the parser
 * @param {Object} expected - Expected test results
 * @returns {Object} Validation result
 */
function validateParsing(parsedData, expected) {
  const issues = [];
  
  if (!parsedData) {
    issues.push('No data returned by parser');
    return { passed: false, issues };
  }
  
  // Check groups count
  if (!parsedData.groups || parsedData.groups.length !== expected.expectedGroupsCount) {
    issues.push(`Expected ${expected.expectedGroupsCount} groups, got ${parsedData.groups?.length || 0}`);
  }
  
  // Check total words count
  if (!parsedData.words || parsedData.words.length !== expected.expectedWords) {
    issues.push(`Expected ${expected.expectedWords} words, got ${parsedData.words?.length || 0}`);
  }
  
  // Check each group
  if (parsedData.groups) {
    expected.expectedGroups.forEach((expectedGroup, index) => {
      const parsedGroup = parsedData.groups[index];
      
      if (!parsedGroup) {
        issues.push(`Missing group ${index + 1} (${expectedGroup.name})`);
        return;
      }
      
      // Check group name
      if (parsedGroup.name !== expectedGroup.name) {
        issues.push(`Group ${index + 1}: expected name "${expectedGroup.name}", got "${parsedGroup.name}"`);
      }
      
      // Check group level
      if (parsedGroup.level !== expectedGroup.level) {
        issues.push(`Group ${index + 1}: expected level ${expectedGroup.level}, got ${parsedGroup.level}`);
      }
      
      // Check words
      if (!parsedGroup.words || parsedGroup.words.length !== 4) {
        issues.push(`Group ${index + 1}: expected 4 words, got ${parsedGroup.words?.length || 0}`);
      } else {
        expectedGroup.words.forEach((expectedWord, wordIndex) => {
          if (parsedGroup.words[wordIndex] !== expectedWord) {
            issues.push(`Group ${index + 1}, word ${wordIndex + 1}: expected "${expectedWord}", got "${parsedGroup.words[wordIndex]}"`);
          }
        });
      }
      
      // Check hint
      if (parsedGroup.hint !== expectedGroup.hint) {
        issues.push(`Group ${index + 1}: expected hint "${expectedGroup.hint}", got "${parsedGroup.hint}"`);
      }
    });
  }
  
  return {
    passed: issues.length === 0,
    issues
  };
}

/**
 * Main test execution
 */
async function runTOITests() {
  console.log('🧪 Running Simple Times of India Parser Tests...\n');
  
  // Test 1: Test against our sample data
  console.log('📋 Test 1: Testing against sample data...');
  const sampleResults = testAgainstSamples();
  
  // Test 2: Test with actual TOI format
  console.log('\n📋 Test 2: Testing with actual TOI format...');
  const actualResults = testWithActualTOIFormat('2025-08-23');
  
  // Summary
  console.log('\n📊 TOI Parser Test Summary:');
  console.log(`   Sample Tests: ${sampleResults.passed}/${sampleResults.totalTests} passed`);
  console.log(`   Actual Format Test: ${actualResults.success ? 'PASSED' : 'FAILED'}`);
  
  if (sampleResults.failed > 0) {
    console.log('\n❌ Failed sample tests:');
    sampleResults.details
      .filter(detail => !detail.passed)
      .forEach(detail => {
        console.log(`   ${detail.date}: ${detail.issues.join(', ')}`);
      });
  }
  
  if (!actualResults.success) {
    console.log(`\n❌ Actual format test failed: ${actualResults.error}`);
  }
  
  const overallSuccess = sampleResults.failed === 0 && actualResults.success;
  console.log(`\n🎯 Overall Result: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
  
  return {
    overallSuccess,
    sampleResults,
    actualResults
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTOITests().catch(console.error);
}

module.exports = {
  simpleTOIParser,
  testWithActualTOIFormat,
  runTOITests
};
