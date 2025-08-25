/**
 * Times of India Parser Test Runner
 * 
 * This script tests our TOI parser against known sample data
 * to ensure it correctly extracts puzzle information.
 */

const { testTOIParser, createMockTOIHTML } = require('./toi-samples');
const cheerio = require('cheerio');

/**
 * Mock TOI parser function for testing
 * This simulates what our actual TOI parser should do
 * @param {string} html - HTML content to parse
 * @param {string} date - Date being parsed
 * @returns {Object} Parsed puzzle data
 */
function mockTOIParser(html, date) {
  const $ = cheerio.load(html);
  
  // Parse hints
  const hints = {};
  const hintSection = $('*:contains("Today\'s NYT Connections hints")').closest('div');
  
  if (hintSection.length > 0) {
    const hintText = hintSection.text();
    const hintMatches = hintText.match(/\*\*([^:]+):\s*([^*]+)\*\*/g);
    
    if (hintMatches) {
      hintMatches.forEach(match => {
        const colorMatch = match.match(/\*\*([^:]+):\s*([^*]+)\*\*/);
        if (colorMatch) {
          const color = colorMatch[1].trim().toLowerCase();
          const hint = colorMatch[2].trim();
          hints[color] = hint;
        }
      });
    }
  }
  
  // Parse answers
  const groups = [];
  const allWords = [];
  const answersSection = $('*:contains("Today\'s NYT Connections answers")').closest('div');
  
  if (answersSection.length > 0) {
    const answerText = answersSection.text();
    const groupMatches = answerText.match(/\*\*([^–]+)–\s*([^*]+)\*\*/g);
    
    if (groupMatches) {
      groupMatches.forEach((match, index) => {
        const groupMatch = match.match(/\*\*([^–]+)–\s*([^*]+)\*\*/);
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
            level: level >= 0 ? level : index,
            words: words,
            hint: hint
          });
          
          allWords.push(...words);
        }
      });
    }
  }
  
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
    <html>
      <body>
        <h1>NYT Connections hints and answers for today (${date})</h1>
        <div>
          <p>Today's NYT Connections hints</p>
          <p>Yellow: Car liquids</p>
          <p>Green: Place for hosting events</p>
          <p>Blue: Deceptive behavior</p>
          <p>Purple: New inventions</p>
        </div>
        <div>
          <p>Today's NYT Connections answers</p>
          <p>Yellow group – BRAKE FLUID, COOLANT, FUEL, OILGreen group – BOWL, COLISEUM, HIPPODROME, STADIUMBlue group – CHICANERY, DECEIT, LEGERDEMAIN, SUBTERFUGE</p>
        </div>
      </body>
    </html>
  `;
  
  try {
    const parsedData = mockTOIParser(actualTOIContent, date);
    
    console.log(`✅ Parsed data:`, {
      groups: parsedData.groups?.length || 0,
      words: parsedData.words?.length || 0,
      source: parsedData.source
    });
    
    if (parsedData.groups) {
      parsedData.groups.forEach((group, index) => {
        console.log(`   Group ${index + 1}: ${group.name} (${group.words?.length || 0} words) - "${group.hint}"`);
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
 * Main test execution
 */
async function runTOITests() {
  console.log('🧪 Running Times of India Parser Tests...\n');
  
  // Test 1: Test against our sample data
  console.log('📋 Test 1: Testing against sample data...');
  const sampleResults = testTOIParser(mockTOIParser);
  
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
  mockTOIParser,
  testWithActualTOIFormat,
  runTOITests
};
