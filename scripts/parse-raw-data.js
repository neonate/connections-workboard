#!/usr/bin/env node

/**
 * Raw Connections Data Parser
 * Converts the raw text format into JSON format for the puzzle update script
 */

const fs = require('fs');
const path = require('path');

// Configuration
const RAW_DATA_PATH = path.join(__dirname, '../archive/csv-files/raw_connections_data.txt');
const OUTPUT_DIR = path.join(__dirname, 'parsed-puzzles');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  console.error(`${colors.red}❌ ERROR: ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

/**
 * Parse date string to YYYY-MM-DD format
 */
function parseDate(dateStr) {
  // Handle formats like "Jul 31, 2025" or "Jul 31, 2025 #781"
  const dateMatch = dateStr.match(/(\w+)\s+(\d+),\s+(\d{4})/);
  if (!dateMatch) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  
  const month = dateMatch[1];
  const day = dateMatch[2];
  const year = dateMatch[3];
  
  const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const monthNum = monthMap[month];
  if (!monthNum) {
    throw new Error(`Invalid month: ${month}`);
  }
  
  return `${year}-${monthNum}-${day.padStart(2, '0')}`;
}

/**
 * Extract puzzle number from date string
 */
function extractPuzzleNumber(dateStr) {
  const match = dateStr.match(/#(\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Parse the raw data file
 */
function parseRawData() {
  logInfo('Parsing raw connections data...');
  
  if (!fs.existsSync(RAW_DATA_PATH)) {
    throw new Error(`Raw data file not found: ${RAW_DATA_PATH}`);
  }
  
  const content = fs.readFileSync(RAW_DATA_PATH, 'utf8');
  const lines = content.split('\n');
  
  const puzzles = [];
  let currentPuzzle = null;
  let currentCategory = null;
  let currentWords = [];
  
  logInfo(`Processing ${lines.length} lines...`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this is a new puzzle (date line with month, day, year)
    if (line.match(/\*\s+\w{3}\s+\d{1,2},\s+\d{4}\s+#\d+/)) {
      logInfo(`Found date line: "${line}"`);
      
      // Save previous puzzle if exists and complete
      if (currentPuzzle && currentCategory && currentWords.length > 0) {
        logInfo(`Adding group "${currentCategory}" with ${currentWords.length} words: ${currentWords.join(', ')}`);
        currentPuzzle.groups.push({
          name: currentCategory,
          level: currentPuzzle.groups.length,
          words: [...currentWords] // Copy the array
        });
      }
      
      // Check if previous puzzle is complete
      if (currentPuzzle && currentPuzzle.groups.length === 4) {
        puzzles.push(currentPuzzle);
        logInfo(`Completed puzzle for ${currentPuzzle.date} with ${currentPuzzle.groups.length} groups`);
      }
      
      // Start new puzzle
      const dateMatch = line.match(/\*\s+(\w{3}\s+\d{1,2},\s+\d{4})\s+#(\d+)/);
      const dateStr = dateMatch[1];
      const puzzleNumber = parseInt(dateMatch[2]);
      
      try {
        const date = parseDate(dateStr);
        currentPuzzle = {
          date,
          gameId: puzzleNumber,
          groups: []
        };
        
        // Extract the first category from the same line
        const categoryMatch = line.match(/#\d+\s*(.+)$/);
        if (categoryMatch) {
          currentCategory = categoryMatch[1].trim();
          logInfo(`Extracted category: "${currentCategory}"`);
        } else {
          currentCategory = null;
        }
        
        // Reset words for new puzzle
        currentWords = [];
        
      } catch (error) {
        logError(`Failed to parse date: ${dateStr} - ${error.message}`);
        currentPuzzle = null;
        currentCategory = null;
        currentWords = [];
      }
    } else if (line.includes('Jul 30, 2025 #780')) {
      // Debug: Check if this line should be a date line
      logInfo(`DEBUG: Line contains date but regex didn't match: "${line}"`);
      logInfo(`DEBUG: Regex test: ${line.match(/\*\s+\w{3}\s+\d{1,2},\s+\d{4}\s+#\d+/)}`);
    }
    // Check if this looks like a word line (has leading spaces and looks like a word)
    else if (line.startsWith('*') && !line.match(/\w{3} \d{1,2}, \d{4}/)) {
      const trimmedLine = line.replace(/^\*\s*/, '').trim();
      const hasLeadingSpaces = line.match(/^\*\s{3,}/); // At least 3 whitespace characters after *
      
      // If it has leading spaces, it's a word line
      if (hasLeadingSpaces) {
        if (currentCategory) {
          // Extract word from the line and clean trailing commas
          const word = trimmedLine.replace(/,$/, '');
          if (word) {
            currentWords.push(word);
            logInfo(`Added word to "${currentCategory}": ${word}`);
          }
        }
      } else {
        // This is a category line
        logInfo(`Found category line: "${line}"`);
        
        // Save previous category if exists
        if (currentPuzzle && currentCategory && currentWords.length > 0) {
          logInfo(`Adding group "${currentCategory}" with ${currentWords.length} words: ${currentWords.join(', ')}`);
          currentPuzzle.groups.push({
            name: currentCategory,
            level: currentPuzzle.groups.length,
            words: [...currentWords] // Copy the array
          });
          currentWords = []; // Reset for next category
        }
        
        // Extract category name
        currentCategory = trimmedLine;
      }
    }
    // Check if this is a word line (starts with * and has words, but not a date line)
    else if (line.startsWith('*') && !line.match(/\w{3} \d{1,2}, \d{4}/)) {
      if (currentCategory) {
        // Extract words from the line
        const wordMatch = line.match(/\*\s*(.*)/);
        if (wordMatch) {
          const wordsStr = wordMatch[1];
          // Handle both comma-separated words and single words
          if (wordsStr.includes(',')) {
            // Multiple words separated by commas
            const words = wordsStr.split(',').map(w => w.trim().replace(/,$/, '')).filter(w => w);
            currentWords.push(...words);
            logInfo(`Added words to "${currentCategory}": ${words.join(', ')}`);
          } else {
            // Single word (usually the last one in a group)
            const word = wordsStr.trim().replace(/,$/, '');
            if (word) {
              currentWords.push(word);
              logInfo(`Added word to "${currentCategory}": ${word}`);
            }
          }
        }
      }
    }
  }
  
  // Don't forget the last puzzle
  if (currentPuzzle && currentCategory && currentWords.length > 0) {
    logInfo(`Adding final group "${currentCategory}" with ${currentWords.length} words: ${currentWords.join(', ')}`);
    currentPuzzle.groups.push({
      name: currentCategory,
      level: currentPuzzle.groups.length,
      words: [...currentWords] // Copy the array
    });
  }
  
  if (currentPuzzle && currentPuzzle.groups.length === 4) {
    puzzles.push(currentPuzzle);
  }
  
  // Filter out incomplete puzzles and sort by date
  const validPuzzles = puzzles
    .filter(puzzle => puzzle.groups.length === 4)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  logSuccess(`Parsed ${validPuzzles.length} complete puzzles`);
  
  return validPuzzles;
}

/**
 * Create output directory and save puzzles
 */
function savePuzzles(puzzles) {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  logInfo(`Saving ${puzzles.length} puzzles to ${OUTPUT_DIR}...`);
  
  let savedCount = 0;
  
  for (const puzzle of puzzles) {
    try {
      // Validate puzzle has exactly 4 groups
      if (puzzle.groups.length !== 4) {
        logError(`Skipping puzzle ${puzzle.date}: Expected 4 groups, found ${puzzle.groups.length}`);
        continue;
      }
      
      // Validate each group has exactly 4 words
      for (let i = 0; i < puzzle.groups.length; i++) {
        const group = puzzle.groups[i];
        if (group.words.length !== 4) {
          logError(`Skipping puzzle ${puzzle.date}, group ${i + 1}: Expected 4 words, found ${group.words.length}`);
          continue;
        }
      }
      
      // Save individual puzzle file
      const filename = `puzzle-${puzzle.date}.json`;
      const filepath = path.join(OUTPUT_DIR, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(puzzle, null, 2));
      savedCount++;
      
    } catch (error) {
      logError(`Failed to save puzzle ${puzzle.date}: ${error.message}`);
    }
  }
  
  logSuccess(`Saved ${savedCount} puzzle files`);
  
  // Create a summary file
  const summary = {
    totalPuzzles: puzzles.length,
    dateRange: {
      start: puzzles[0]?.date,
      end: puzzles[puzzles.length - 1]?.date
    },
    puzzles: puzzles.map(p => ({
      date: p.date,
      gameId: p.gameId,
      categories: p.groups.map(g => g.name)
    }))
  };
  
  const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  logSuccess(`Summary saved to ${summaryPath}`);
  
  return savedCount;
}

/**
 * Main function
 */
function main() {
  try {
    log('🔍 Starting raw connections data parsing...', 'bright');
    log('');
    
    // Parse the raw data
    const puzzles = parseRawData();
    
    if (puzzles.length === 0) {
      logError('No valid puzzles found in the raw data');
      process.exit(1);
    }
    
    // Save the puzzles
    const savedCount = savePuzzles(puzzles);
    
    log('');
    logSuccess(`🎉 Parsing complete! ${savedCount} puzzles ready for import.`);
    log('');
    logInfo('Next steps:');
    logInfo('1. Review the parsed puzzles in the scripts/parsed-puzzles/ directory');
    logInfo('2. Use the update-puzzle-data.js script to add them:');
    logInfo(`   node scripts/update-puzzle-data.js add --date YYYY-MM-DD --puzzle-file scripts/parsed-puzzles/puzzle-YYYY-MM-DD.json`);
    logInfo('3. Or use the shell wrapper:');
    logInfo(`   ./scripts/update-puzzles add --date YYYY-MM-DD --puzzle-file scripts/parsed-puzzles/puzzle-YYYY-MM-DD.json`);
    
  } catch (error) {
    logError(`Parsing failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { parseRawData, savePuzzles };
