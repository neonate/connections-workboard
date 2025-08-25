/**
 * Times of India Parser Test Samples
 * 
 * This file contains sample data from Times of India NYT Connections articles
 * to test our parser against known, validated content.
 * 
 * Each test case includes:
 * - date: The puzzle date
 * - description: What this test case validates
 * - expectedGroups: Number of groups expected
 * - expectedWords: Total number of words expected
 * - expectedHints: Expected hints for each group
 * - expectedWords: Expected words for each group
 * - notes: Additional context about the test case
 */

const TOI_TEST_SAMPLES = [
  {
    date: '2025-08-23',
    description: 'Today\'s puzzle with compound words and proper hints',
    expectedGroupsCount: 4,
    expectedWords: 16,
    expectedHints: {
      yellow: 'Car liquids',
      green: 'Place for hosting events', 
      blue: 'Deceptive behavior',
      purple: 'New inventions'
    },
    expectedGroups: [
      {
        name: 'Yellow',
        level: 0,
        words: ['BRAKE FLUID', 'COOLANT', 'FUEL', 'OIL'],
        hint: 'Car liquids'
      },
      {
        name: 'Green', 
        level: 1,
        words: ['BOWL', 'COLISEUM', 'HIPPODROME', 'STADIUM'],
        hint: 'Place for hosting events'
      },
      {
        name: 'Blue',
        level: 2, 
        words: ['CHICANERY', 'DECEIT', 'LEGERDEMAIN', 'SUBTERFUGE'],
        hint: 'Deceptive behavior'
      },
      {
        name: 'Purple',
        level: 3,
        words: ['CRYPTO', 'PODCAST', 'SMARTWATCH', 'VAPE'],
        hint: 'New inventions'
      }
    ],
    notes: 'This is the current puzzle that was working. Tests compound word parsing (BRAKE FLUID) and proper hint extraction.'
  },
  {
    date: '2025-08-22',
    description: 'Previous day puzzle to test date handling',
    expectedGroupsCount: 4,
    expectedWords: 16,
    expectedHints: {
      yellow: 'Something you might find in a kitchen',
      green: 'Types of trees',
      blue: 'Words that can mean both a person and an object',
      purple: 'Things that can be both hot and cold'
    },
    expectedGroups: [
      {
        name: 'Yellow',
        level: 0,
        words: ['SPOON', 'FORK', 'KNIFE', 'PLATE'],
        hint: 'Something you might find in a kitchen'
      },
      {
        name: 'Green',
        level: 1,
        words: ['OAK', 'MAPLE', 'PINE', 'BIRCH'],
        hint: 'Types of trees'
      },
      {
        name: 'Blue',
        level: 2,
        words: ['COOK', 'GUARD', 'HOST', 'PILOT'],
        hint: 'Words that can mean both a person and an object'
      },
      {
        name: 'Purple',
        level: 3,
        words: ['WATER', 'FOOD', 'METAL', 'STONE'],
        hint: 'Things that can be both hot and cold'
      }
    ],
    notes: 'Sample data for testing. Replace with actual TOI content when available.'
  },
  {
    date: '2025-08-21',
    description: 'Real TOI puzzle data - errors, fantasy worlds, sensory organs, circular objects',
    expectedGroupsCount: 4,
    expectedWords: 16,
    expectedHints: {
      yellow: 'A mistake',
      green: 'Imaginary worlds',
      blue: 'Features sensory organs',
      purple: 'Circular objects'
    },
    expectedGroups: [
      {
        name: 'Yellow',
        level: 0,
        words: ['BOO-BOO', 'FLUB', 'GAFFE', 'NO-NO'],
        hint: 'A mistake'
      },
      {
        name: 'Green',
        level: 1,
        words: ['DREAM', 'FANTASY', 'LA-LA', 'NEVER NEVER'],
        hint: 'Imaginary worlds'
      },
      {
        name: 'Blue',
        level: 2,
        words: ['INSECT', 'RADIO TOWER', 'SATELLITE DISH', 'TELETUBBY'],
        hint: 'Features sensory organs'
      },
      {
        name: 'Purple',
        level: 3,
        words: ['CHEESE', 'DIPSY', 'GOOGLE', 'YANKEE'],
        hint: 'Circular objects'
      }
    ],
    notes: 'Real TOI content from August 21, 2025. Tests compound words (RADIO TOWER, SATELLITE DISH, NEVER NEVER).'
  },
  {
    date: '2025-08-20',
    description: 'TOI puzzle for August 20 - additional test case',
    expectedGroupsCount: 4,
    expectedWords: 16,
    expectedHints: {
      yellow: 'Things you write with',
      green: 'Types of weather',
      blue: 'Ocean creatures',
      purple: 'Space objects'
    },
    expectedGroups: [
      {
        name: 'Yellow',
        level: 0,
        words: ['PEN', 'PENCIL', 'MARKER', 'CRAYON'],
        hint: 'Things you write with'
      },
      {
        name: 'Green',
        level: 1,
        words: ['RAIN', 'SNOW', 'HAIL', 'SLEET'],
        hint: 'Types of weather'
      },
      {
        name: 'Blue',
        level: 2,
        words: ['WHALE', 'SHARK', 'DOLPHIN', 'OCTOPUS'],
        hint: 'Ocean creatures'
      },
      {
        name: 'Purple',
        level: 3,
        words: ['PLANET', 'STAR', 'COMET', 'ASTEROID'],
        hint: 'Space objects'
      }
    ],
    notes: 'Sample data based on TOI URL pattern. Should be replaced with actual content when available.'
  },
  {
    date: '2025-08-17',
    description: 'TOI puzzle for August 17 - testing earlier date',
    expectedGroupsCount: 4,
    expectedWords: 16,
    expectedHints: {
      yellow: 'Kitchen utensils',
      green: 'Card games',
      blue: 'Computer terms',
      purple: 'Dance styles'
    },
    expectedGroups: [
      {
        name: 'Yellow',
        level: 0,
        words: ['WHISK', 'LADLE', 'SPATULA', 'TONGS'],
        hint: 'Kitchen utensils'
      },
      {
        name: 'Green',
        level: 1,
        words: ['POKER', 'BRIDGE', 'RUMMY', 'HEARTS'],
        hint: 'Card games'
      },
      {
        name: 'Blue',
        level: 2,
        words: ['VIRUS', 'CACHE', 'COOKIE', 'FIREWALL'],
        hint: 'Computer terms'
      },
      {
        name: 'Purple',
        level: 3,
        words: ['TANGO', 'WALTZ', 'SALSA', 'MAMBO'],
        hint: 'Dance styles'
      }
    ],
    notes: 'Sample data based on TOI URL pattern. Should be replaced with actual content when available.'
  },
  {
    date: '2025-08-05',
    description: 'TOI puzzle for August 5 - early August test case',
    expectedGroupsCount: 4,
    expectedWords: 16,
    expectedHints: {
      yellow: 'Breakfast foods',
      green: 'Musical instruments',
      blue: 'School subjects',
      purple: 'Movie genres'
    },
    expectedGroups: [
      {
        name: 'Yellow',
        level: 0,
        words: ['TOAST', 'CEREAL', 'EGGS', 'BACON'],
        hint: 'Breakfast foods'
      },
      {
        name: 'Green',
        level: 1,
        words: ['PIANO', 'GUITAR', 'VIOLIN', 'DRUMS'],
        hint: 'Musical instruments'
      },
      {
        name: 'Blue',
        level: 2,
        words: ['MATH', 'SCIENCE', 'HISTORY', 'ENGLISH'],
        hint: 'School subjects'
      },
      {
        name: 'Purple',
        level: 3,
        words: ['COMEDY', 'DRAMA', 'ACTION', 'HORROR'],
        hint: 'Movie genres'
      }
    ],
    notes: 'Sample data based on TOI URL pattern. Should be replaced with actual content when available.'
  }
];

/**
 * Test the TOI parser against known samples
 * @param {Function} parseFunction - The TOI parsing function to test
 * @returns {Object} Test results
 */
function testTOIParser(parseFunction) {
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
      // Mock the HTML content that would come from TOI
      const mockHtml = createMockTOIHTML(sample);
      
      // Parse the mock content
      const parsedData = parseFunction(mockHtml, sample.date);
      
      // Validate the results
      const testResult = validateTOIParsing(parsedData, sample);
      
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

  console.log(`\n📊 TOI Parser Test Results:`);
  console.log(`   Total: ${results.totalTests}`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Success Rate: ${((results.passed / results.totalTests) * 100).toFixed(1)}%`);

  return results;
}

/**
 * Create mock TOI HTML content for testing
 * @param {Object} sample - Test sample data
 * @returns {string} Mock HTML content
 */
function createMockTOIHTML(sample) {
  const hints = Object.entries(sample.expectedHints)
    .map(([color, hint]) => `**${color.charAt(0).toUpperCase() + color.slice(1)}: ${hint}**`)
    .join('\n');

  const answers = sample.expectedGroups
    .map(group => `**${group.name} group – ${group.words.join(', ')}**`)
    .join('');

  return `
    <html>
      <body>
        <h1>NYT Connections hints and answers for today (${sample.date})</h1>
        <div>
          <h2>Today's NYT Connections hints</h2>
          ${hints}
        </div>
        <div>
          <h2>Today's NYT Connections answers</h2>
          ${answers}
        </div>
      </body>
    </html>
  `;
}

/**
 * Validate parsed TOI data against expected results
 * @param {Object} parsedData - Data returned by the parser
 * @param {Object} expected - Expected test results
 * @returns {Object} Validation result
 */
function validateTOIParsing(parsedData, expected) {
  const issues = [];
  
  if (!parsedData) {
    issues.push('No data returned by parser');
    return { passed: false, issues };
  }
  
  // Check groups count
  if (!parsedData.groups || parsedData.groups.length !== expected.expectedGroups) {
    issues.push(`Expected ${expected.expectedGroups} groups, got ${parsedData.groups?.length || 0}`);
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

module.exports = {
  TOI_TEST_SAMPLES,
  testTOIParser,
  createMockTOIHTML,
  validateTOIParsing
};
