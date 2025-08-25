/**
 * Debug script to test regex patterns against actual TOI content
 */

const actualTOIContent = `
Today's NYT Connections hints
Yellow: Car liquids
Green: Place for hosting events
Blue: Deceptive behavior
Purple: New inventions

Today's NYT Connections answers
Yellow group – BRAKE FLUID, COOLANT, FUEL, OILGreen group – BOWL, COLISEUM, HIPPODROME, STADIUMBlue group – CHICANERY, DECEIT, LEGERDEMAIN, SUBTERFUGE
`;

console.log('🔍 Testing regex patterns against actual TOI content...\n');

// Test 1: Simple pattern
console.log('📋 Test 1: Simple pattern');
const simplePattern = /(Yellow|Green|Blue|Purple)\s+group\s*[–-]\s*([^YGBP]+)/gi;
let match;
let count = 0;

while ((match = simplePattern.exec(actualTOIContent)) !== null) {
  count++;
  console.log(`   Match ${count}: "${match[0]}"`);
  console.log(`   Group: "${match[1]}"`);
  console.log(`   Words: "${match[2]}"`);
}

console.log(`   Total matches: ${count}\n`);

// Test 2: Lookahead pattern
console.log('📋 Test 2: Lookahead pattern');
const lookaheadPattern = /(Yellow|Green|Blue|Purple)\s+group\s*[–-]\s*([^YGBP]+?)(?=(?:Yellow|Green|Blue|Purple)\s+group|$)/gi;
count = 0;

while ((match = lookaheadPattern.exec(actualTOIContent)) !== null) {
  count++;
  console.log(`   Match ${count}: "${match[0]}"`);
  console.log(`   Group: "${match[1]}"`);
  console.log(`   Words: "${match[2]}"`);
}

console.log(`   Total matches: ${count}\n`);

// Test 3: Split by group markers
console.log('📋 Test 3: Split by group markers');
const groupSections = actualTOIContent.split(/(?=(?:Yellow|Green|Blue|Purple)\s+group)/);
console.log(`   Found ${groupSections.length} sections:`);
groupSections.forEach((section, index) => {
  if (section.trim()) {
    console.log(`   Section ${index}: "${section.trim()}"`);
  }
});

// Test 4: Manual parsing approach
console.log('\n📋 Test 4: Manual parsing approach');
const manualGroups = [];
const groupRegex = /(Yellow|Green|Blue|Purple)\s+group\s*[–-]\s*([^YGBP]+)/gi;
let groupMatch;

while ((groupMatch = groupRegex.exec(actualTOIContent)) !== null) {
  const groupName = groupMatch[1];
  const wordsText = groupMatch[2];
  
  // Find where this group ends by looking for the next group or end of string
  const nextGroupIndex = actualTOIContent.indexOf(groupMatch[0], groupMatch.index + groupMatch[0].length);
  let endIndex;
  
  if (nextGroupIndex > 0) {
    // Look for the next group marker
    const nextGroupMatch = actualTOIContent.match(/(?:Yellow|Green|Blue|Purple)\s+group/, nextGroupIndex);
    if (nextGroupMatch) {
      endIndex = nextGroupMatch.index;
    } else {
      endIndex = actualTOIContent.length;
    }
  } else {
    endIndex = actualTOIContent.length;
  }
  
  // Extract the full words text for this group
  const fullWordsText = actualTOIContent.substring(groupMatch.index + groupMatch[0].length, endIndex);
  const words = fullWordsText.split(',').map(w => w.trim()).filter(w => w);
  
  manualGroups.push({
    name: groupName,
    words: words,
    rawMatch: groupMatch[0],
    fullWordsText: fullWordsText
  });
  
  console.log(`   ${groupName}: ${words.join(', ')}`);
}

console.log(`   Total manual groups: ${manualGroups.length}`);
