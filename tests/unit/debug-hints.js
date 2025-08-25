/**
 * Debug script to test hint parsing
 */

const testContent = `
Today's NYT Connections hints
Yellow: Car liquids
Green: Place for hosting events
Blue: Deceptive behavior
Purple: New inventions

Today's NYT Connections answers
Yellow group – BRAKE FLUID, COOLANT, FUEL, OILGreen group – BOWL, COLISEUM, HIPPODROME, STADIUMBlue group – CHICANERY, DECEIT, LEGERDEMAIN, SUBTERFUGEPurple group – CRYPTO, PODCAST, SMARTWATCH, VAPE
`;

console.log('🔍 Testing hint parsing...\n');

// Test 1: Simple pattern
console.log('📋 Test 1: Simple pattern');
const simplePattern = /(Yellow|Green|Blue|Purple):\s*([^\n]+)/gi;
let match;
let count = 0;

while ((match = simplePattern.exec(testContent)) !== null) {
  count++;
  console.log(`   Match ${count}: "${match[0]}"`);
  console.log(`   Color: "${match[1]}"`);
  console.log(`   Hint: "${match[2]}"`);
}

console.log(`   Total matches: ${count}\n`);

// Test 2: Complex pattern
console.log('📋 Test 2: Complex pattern');
const complexPattern = /(?:^|\*\*)(Yellow|Green|Blue|Purple):\s*([^\n*]+)(?:\*\*|$)/gi;
count = 0;

while ((match = complexPattern.exec(testContent)) !== null) {
  count++;
  console.log(`   Match ${count}: "${match[0]}"`);
  console.log(`   Color: "${match[1]}"`);
  console.log(`   Hint: "${match[2]}"`);
}

console.log(`   Total matches: ${count}\n`);

// Test 3: Manual parsing
console.log('📋 Test 3: Manual parsing');
const lines = testContent.split('\n');
const hints = {};

lines.forEach(line => {
  const hintMatch = line.match(/^(Yellow|Green|Blue|Purple):\s*(.+)$/i);
  if (hintMatch) {
    const color = hintMatch[1].toLowerCase();
    const hint = hintMatch[2].trim();
    hints[color] = hint;
    console.log(`   ${color}: "${hint}"`);
  }
});

console.log(`   Total hints found: ${Object.keys(hints).length}`);
console.log(`   Hints:`, hints);
