/**
 * Capture Times of India Samples
 * 
 * This script fetches actual content from TOI URLs and updates our test samples
 * with real puzzle data for regression testing.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// URLs to capture
const TOI_URLS = [
  {
    date: '2025-08-20',
    url: 'https://timesofindia.indiatimes.com/technology/gaming/nyt-connections-hints-and-answers-for-today-august-20-2025/articleshow/123409782.cms'
  },
  {
    date: '2025-08-17', 
    url: 'https://timesofindia.indiatimes.com/technology/gaming/nyt-connections-hints-and-answers-for-today-august-17-2025/articleshow/123349455.cms'
  },
  {
    date: '2025-08-05',
    url: 'https://timesofindia.indiatimes.com/technology/gaming/nyt-connections-hints-and-answers-for-today-august-5-2025/articleshow/123118190.cms'
  }
];

/**
 * Extract puzzle data from TOI HTML content
 * @param {string} html - HTML content from TOI
 * @param {string} date - Date of the puzzle
 * @returns {Object} Extracted puzzle data
 */
function extractTOIPuzzleData(html, date) {
  const $ = cheerio.load(html);
  
  // Extract hints
  const hints = {};
  const hintSections = $('*:contains("Today\'s NYT Connections hints")').next();
  
  // Look for hint patterns in various formats
  const bodyText = $('body').text();
  const hintMatches = bodyText.match(/\*\*([^:]+):\s*([^*\n]+)\*\*/g);
  
  if (hintMatches) {
    hintMatches.forEach(match => {
      const colorMatch = match.match(/\*\*([^:]+):\s*([^*]+)\*\*/);
      if (colorMatch && ['Yellow', 'Green', 'Blue', 'Purple'].includes(colorMatch[1])) {
        hints[colorMatch[1].toLowerCase()] = colorMatch[2].trim();
      }
    });
  }
  
  // Extract answers
  const groups = [];
  const answerMatches = bodyText.match(/\*\*([^–]+)\s*–\s*([^*]+)\*\*/g);
  
  if (answerMatches) {
    answerMatches.forEach((match, index) => {
      const groupMatch = match.match(/\*\*([^–]+)\s*–\s*([^*]+)\*\*/);
      if (groupMatch) {
        const groupName = groupMatch[1].replace('group', '').trim();
        if (['Yellow', 'Green', 'Blue', 'Purple'].includes(groupName)) {
          const wordsText = groupMatch[2].trim();
          const words = wordsText.split(',').map(word => word.trim());
          
          const colorOrder = ['Yellow', 'Green', 'Blue', 'Purple'];
          const level = colorOrder.indexOf(groupName);
          
          groups.push({
            name: groupName,
            level: level >= 0 ? level : index,
            words: words,
            hint: hints[groupName.toLowerCase()] || `${groupName} hint`
          });
        }
      }
    });
  }
  
  return {
    date,
    hints,
    groups,
    totalWords: groups.reduce((sum, group) => sum + group.words.length, 0)
  };
}

/**
 * Fetch and parse a single TOI URL
 * @param {Object} urlInfo - URL information object
 * @returns {Object} Parsed puzzle data
 */
async function fetchTOIUrl(urlInfo) {
  console.log(`🌐 Fetching ${urlInfo.date}: ${urlInfo.url}`);
  
  try {
    const response = await axios.get(urlInfo.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    
    const puzzleData = extractTOIPuzzleData(response.data, urlInfo.date);
    
    console.log(`✅ Successfully parsed ${urlInfo.date}:`);
    console.log(`   Groups: ${puzzleData.groups.length}`);
    console.log(`   Words: ${puzzleData.totalWords}`);
    console.log(`   Hints: ${Object.keys(puzzleData.hints).length}`);
    
    return puzzleData;
    
  } catch (error) {
    console.log(`❌ Failed to fetch ${urlInfo.date}: ${error.message}`);
    return null;
  }
}

/**
 * Generate test sample object from puzzle data
 * @param {Object} puzzleData - Parsed puzzle data
 * @returns {Object} Test sample object
 */
function generateTestSample(puzzleData) {
  if (!puzzleData || puzzleData.groups.length === 0) {
    return null;
  }
  
  return {
    date: puzzleData.date,
    description: `Real TOI puzzle data from ${puzzleData.date}`,
    expectedGroupsCount: puzzleData.groups.length,
    expectedWords: puzzleData.totalWords,
    expectedHints: puzzleData.hints,
    expectedGroups: puzzleData.groups,
    notes: `Real TOI content captured from live URL. Contains ${puzzleData.groups.length} groups with ${puzzleData.totalWords} total words.`
  };
}

/**
 * Main capture function
 */
async function captureTOISamples() {
  console.log('🔍 Capturing Times of India puzzle samples...\n');
  
  const capturedSamples = [];
  
  for (const urlInfo of TOI_URLS) {
    const puzzleData = await fetchTOIUrl(urlInfo);
    
    if (puzzleData) {
      const testSample = generateTestSample(puzzleData);
      if (testSample) {
        capturedSamples.push(testSample);
        
        // Display captured data
        console.log(`📋 Captured sample for ${testSample.date}:`);
        testSample.expectedGroups.forEach((group, index) => {
          console.log(`   ${group.name}: ${group.words.join(', ')} (${group.hint})`);
        });
        console.log('');
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`📊 Summary: Captured ${capturedSamples.length} out of ${TOI_URLS.length} samples`);
  
  if (capturedSamples.length > 0) {
    // Save captured samples to a file
    const outputPath = path.join(__dirname, 'captured-toi-samples.json');
    fs.writeFileSync(outputPath, JSON.stringify(capturedSamples, null, 2));
    console.log(`💾 Saved captured samples to: ${outputPath}`);
    
    // Display instructions for updating test data
    console.log('\n🔧 To update your test data:');
    console.log('1. Review the captured samples in captured-toi-samples.json');
    console.log('2. Replace the corresponding entries in toi-samples.js');
    console.log('3. Run the test suite to verify the updates');
  }
  
  return capturedSamples;
}

// Run capture if this file is executed directly
if (require.main === module) {
  captureTOISamples().catch(console.error);
}

module.exports = {
  captureTOISamples,
  extractTOIPuzzleData,
  TOI_URLS
};
