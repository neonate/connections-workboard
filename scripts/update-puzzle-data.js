#!/usr/bin/env node

/**
 * NYT Connections Puzzle Data Update Script
 * 
 * This script safely updates the puzzleData.js file with new puzzle data.
 * It includes validation, atomic updates, and comprehensive error handling.
 * 
 * USAGE FOR AI AGENTS:
 * 
 * 1. Basic puzzle addition:
 *    node scripts/update-puzzle-data.js add --date 2025-08-21 --puzzle-file new-puzzle.json
 * 
 * 2. Interactive puzzle creation:
 *    node scripts/update-puzzle-data.js add --date 2025-08-21 --interactive
 * 
 * 3. Validate existing data:
 *    node scripts/update-puzzle-data.js validate
 * 
 * 4. Show available dates:
 *    node scripts/update-puzzle-data.js list
 * 
 * 5. Remove a puzzle:
 *    node scripts/update-puzzle-data.js remove --date 2025-08-21
 * 
 * PUZZLE DATA FORMAT (JSON):
 * {
 *   "date": "2025-08-21",
 *   "gameId": 803,
 *   "groups": [
 *     {
 *       "name": "CATEGORY NAME",
 *       "level": 0,
 *       "words": ["WORD1", "WORD2", "WORD3", "WORD4"]
 *     }
 *   ]
 * }
 * 
 * VALIDATION RULES:
 * - Date must be in YYYY-MM-DD format
 * - Game ID must be a positive integer
 * - Exactly 4 groups required
 * - Each group must have exactly 4 words
 * - Level must be 0, 1, 2, or 3 (yellow, green, blue, purple)
 * - Words can contain unicode/emojis
 * - No duplicate words across all groups
 * - No duplicate group names
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const PUZZLE_DATA_PATH = path.join(__dirname, '../src/services/puzzleData.js');
const BACKUP_PATH = path.join(__dirname, '../src/services/puzzleData.js.backup');
const TEMP_PATH = path.join(__dirname, '../src/services/puzzleData.js.tmp');

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

/**
 * Logging utility with colors
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Error logging utility
 */
function logError(message) {
  console.error(`${colors.red}❌ ERROR: ${message}${colors.reset}`);
}

/**
 * Success logging utility
 */
function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

/**
 * Warning logging utility
 */
function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

/**
 * Info logging utility
 */
function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate(date) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD format.`);
  }
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${date}. Date does not exist.`);
  }
  
  // Check if date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsedDate > today) {
    throw new Error(`Date ${date} is in the future. Cannot add future puzzles.`);
  }
  
  return true;
}

/**
 * Validate game ID
 */
function validateGameId(gameId) {
  if (!Number.isInteger(gameId) || gameId <= 0) {
    throw new Error(`Invalid game ID: ${gameId}. Must be a positive integer.`);
  }
  return true;
}

/**
 * Validate group data
 */
function validateGroup(group, groupIndex) {
  if (!group.name || typeof group.name !== 'string' || group.name.trim() === '') {
    throw new Error(`Group ${groupIndex + 1}: Missing or invalid name.`);
  }
  
  if (!Number.isInteger(group.level) || group.level < 0 || group.level > 3) {
    throw new Error(`Group ${groupIndex + 1}: Invalid level ${group.level}. Must be 0, 1, 2, or 3.`);
  }
  
  if (!Array.isArray(group.words) || group.words.length !== 4) {
    throw new Error(`Group ${groupIndex + 1}: Must have exactly 4 words. Found ${group.words?.length || 0}.`);
  }
  
  group.words.forEach((word, wordIndex) => {
    if (!word || typeof word !== 'string' || word.trim() === '') {
      throw new Error(`Group ${groupIndex + 1}, Word ${wordIndex + 1}: Missing or invalid word.`);
    }
  });
  
  return true;
}

/**
 * Validate complete puzzle data
 */
function validatePuzzleData(puzzleData) {
  logInfo('Validating puzzle data...');
  
  // Basic structure validation
  if (!puzzleData.date || !puzzleData.gameId || !puzzleData.groups) {
    throw new Error('Missing required fields: date, gameId, or groups.');
  }
  
  // Validate date
  validateDate(puzzleData.date);
  
  // Validate game ID
  validateGameId(puzzleData.gameId);
  
  // Validate groups
  if (!Array.isArray(puzzleData.groups) || puzzleData.groups.length !== 4) {
    throw new Error(`Must have exactly 4 groups. Found ${puzzleData.groups?.length || 0}.`);
  }
  
  // Validate each group
  puzzleData.groups.forEach((group, index) => {
    validateGroup(group, index);
  });
  
  // Check for duplicate words across all groups
  const allWords = puzzleData.groups.flatMap(group => group.words);
  const uniqueWords = new Set(allWords.map(word => word.toLowerCase()));
  if (uniqueWords.size !== allWords.length) {
    const duplicates = allWords.filter((word, index) => 
      allWords.findIndex(w => w.toLowerCase() === word.toLowerCase()) !== index
    );
    throw new Error(`Duplicate words found: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  // Check for duplicate group names
  const groupNames = puzzleData.groups.map(group => group.name);
  const uniqueGroupNames = new Set(groupNames.map(name => name.toLowerCase()));
  if (uniqueGroupNames.size !== groupNames.length) {
    const duplicates = groupNames.filter((name, index) => 
      groupNames.findIndex(n => n.toLowerCase() === name.toLowerCase()) !== index
    );
    throw new Error(`Duplicate group names found: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  logSuccess('Puzzle data validation passed!');
  return true;
}

/**
 * Read existing puzzle data from the JS file
 */
function readExistingPuzzleData() {
  try {
    const content = fs.readFileSync(PUZZLE_DATA_PATH, 'utf8');
    
    // Extract the EXTENDED_PUZZLES object content
    const startMarker = 'const EXTENDED_PUZZLES = {';
    const endMarker = '};';
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker, startIndex);
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Could not find EXTENDED_PUZZLES object in puzzleData.js');
    }
    
    // Extract the object content and evaluate it
    const objectContent = content.substring(startIndex + startMarker.length, endIndex);
    const puzzleData = eval(`({${objectContent}})`);
    
    return puzzleData;
  } catch (error) {
    throw new Error(`Failed to read existing puzzle data: ${error.message}`);
  }
}

/**
 * Generate the updated JS file content
 */
function generateJSContent(puzzleData) {
  const sortedDates = Object.keys(puzzleData).sort().reverse(); // Most recent first
  
  let content = `/**
 * Static NYT Connections puzzle data
 * All puzzle data is managed out-of-band and hardcoded here
 */

// Puzzle data from ${sortedDates[sortedDates.length - 1]} to ${sortedDates[0]}
const EXTENDED_PUZZLES = {
`;
  
  sortedDates.forEach((date, dateIndex) => {
    const puzzle = puzzleData[date];
    content += `  '${date}': {
    date: '${date}',
    gameId: ${puzzle.gameId},
    groups: [
`;
    
    puzzle.groups.forEach((group, groupIndex) => {
      content += `      { name: '${group.name.replace(/'/g, "\\'")}', level: ${group.level}, words: [${group.words.map(word => `'${word.replace(/'/g, "\\'")}'`).join(', ')}] }`;
      if (groupIndex < puzzle.groups.length - 1) {
        content += ',';
      }
      content += '\n';
    });
    
    content += `    ],
    source: 'static'
  }`;
    
    if (dateIndex < sortedDates.length - 1) {
      content += ',';
    }
    content += '\n';
  });
  
  content += `};

// Process the puzzle data to include computed fields
Object.keys(EXTENDED_PUZZLES).forEach(date => {
  const puzzle = EXTENDED_PUZZLES[date];
  puzzle.words = puzzle.groups.flatMap(group => group.words);
  puzzle.category = puzzle.groups.map(g => g.name).join(' | ');
});

/**
 * Gets a puzzle by date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object|null} Puzzle data or null if not found
 */
export const getPuzzleByDate = (date) => {
  return EXTENDED_PUZZLES[date] || null;
};

/**
 * Gets all available puzzle dates
 * @returns {string[]} Array of dates in YYYY-MM-DD format
 */
export const getAvailableDates = () => {
  return Object.keys(EXTENDED_PUZZLES).sort();
};

/**
 * Gets the latest available puzzle date
 * @returns {string|null} Latest puzzle date or null
 */
export const getLatestPuzzleDate = () => {
  const dates = getAvailableDates();
  return dates[dates.length - 1] || null;
};

/**
 * Gets the available date range
 * @returns {{minDate: string, maxDate: string}} Date range object
 */
export const getAvailableDateRange = () => {
  const dates = getAvailableDates();
  
  if (dates.length === 0) {
    return { minDate: null, maxDate: null };
  }
  
  return {
    minDate: dates[0],
    maxDate: dates[dates.length - 1]
  };
};

/**
 * Gets all puzzle data
 * @returns {Object} All puzzle data indexed by date
 */
export const getAllPuzzles = () => {
  return EXTENDED_PUZZLES;
};
`;
  
  return content;
}

/**
 * Perform atomic update of the puzzle data file
 */
function atomicUpdate(newPuzzleData) {
  logInfo('Performing atomic update...');
  
  // Create backup
  fs.copyFileSync(PUZZLE_DATA_PATH, BACKUP_PATH);
  logInfo(`Backup created: ${BACKUP_PATH}`);
  
  try {
    // Generate new content
    const newContent = generateJSContent(newPuzzleData);
    
    // Write to temporary file
    fs.writeFileSync(TEMP_PATH, newContent, 'utf8');
    
    // Simple validation: try to require the file
    try {
      // Create a temporary validation file
      const validationPath = '/tmp/validation-test.js';
      fs.writeFileSync(validationPath, newContent, 'utf8');
      
      // Try to require it (this will catch syntax errors)
      require(validationPath);
      
      // Clean up validation file
      fs.unlinkSync(validationPath);
      
    } catch (parseError) {
      throw new Error(`Generated content validation failed: ${parseError.message}`);
    }
    
    // Atomic move (rename) from temp to actual file
    fs.renameSync(TEMP_PATH, PUZZLE_DATA_PATH);
    
    logSuccess('Puzzle data file updated successfully!');
    
    // Clean up backup after successful update
    fs.unlinkSync(BACKUP_PATH);
    logInfo('Backup cleaned up.');
    
  } catch (error) {
    // Restore from backup on failure
    logError(`Update failed: ${error.message}`);
    logInfo('Restoring from backup...');
    
    if (fs.existsSync(TEMP_PATH)) {
      fs.unlinkSync(TEMP_PATH);
    }
    
    fs.copyFileSync(BACKUP_PATH, PUZZLE_DATA_PATH);
    logSuccess('Backup restored successfully.');
    
    throw error;
  }
}

/**
 * Add a new puzzle
 */
function addPuzzle(puzzleData, force = false) {
  logInfo('Adding new puzzle...');
  
  // Validate the new puzzle data
  validatePuzzleData(puzzleData);
  
  // Read existing data
  const existingData = readExistingPuzzleData();
  
  // Check if puzzle already exists for this date
  if (existingData[puzzleData.date] && !force) {
    throw new Error(`Puzzle for date ${puzzleData.date} already exists. Use --force to overwrite.`);
  }
  
  // Add new puzzle (or overwrite if force is true)
  existingData[puzzleData.date] = puzzleData;
  
  // Perform atomic update
  atomicUpdate(existingData);
  
  if (force && existingData[puzzleData.date] !== puzzleData) {
    logSuccess(`Puzzle for ${puzzleData.date} updated successfully!`);
  } else {
    logSuccess(`Puzzle for ${puzzleData.date} added successfully!`);
  }
}

/**
 * Remove a puzzle
 */
function removePuzzle(date) {
  logInfo(`Removing puzzle for ${date}...`);
  
  // Validate date format
  validateDate(date);
  
  // Read existing data
  const existingData = readExistingPuzzleData();
  
  // Check if puzzle exists
  if (!existingData[date]) {
    throw new Error(`No puzzle found for date ${date}.`);
  }
  
  // Remove puzzle
  delete existingData[date];
  
  // Perform atomic update
  atomicUpdate(existingData);
  
  logSuccess(`Puzzle for ${date} removed successfully!`);
}

/**
 * List all available dates
 */
function listDates() {
  try {
    const existingData = readExistingPuzzleData();
    const dates = Object.keys(existingData).sort();
    
    logInfo(`Available puzzle dates (${dates.length} total):`);
    dates.forEach(date => {
      const puzzle = existingData[date];
      log(`  ${date} - Game ID: ${puzzle.gameId} - ${puzzle.groups.map(g => g.name).join(' | ')}`);
    });
  } catch (error) {
    logError(`Failed to list dates: ${error.message}`);
  }
}

/**
 * Validate existing data
 */
function validateExistingData() {
  logInfo('Validating existing puzzle data...');
  
  try {
    const existingData = readExistingPuzzleData();
    const dates = Object.keys(existingData);
    
    let totalErrors = 0;
    
    dates.forEach(date => {
      try {
        validatePuzzleData(existingData[date]);
      } catch (error) {
        logError(`Validation failed for ${date}: ${error.message}`);
        totalErrors++;
      }
    });
    
    if (totalErrors === 0) {
      logSuccess(`All ${dates.length} puzzles validated successfully!`);
    } else {
      logError(`${totalErrors} puzzles have validation errors.`);
      process.exit(1);
    }
  } catch (error) {
    logError(`Failed to validate existing data: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Interactive puzzle creation
 */
async function interactivePuzzleCreation(date) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  try {
    logInfo(`Creating puzzle for ${date} interactively...`);
    
    const gameId = parseInt(await question('Enter Game ID (e.g., 803): '));
    if (isNaN(gameId) || gameId <= 0) {
      throw new Error('Invalid Game ID');
    }
    
    const groups = [];
    const groupNames = ['Yellow (easiest)', 'Green', 'Blue', 'Purple (hardest)'];
    
    for (let i = 0; i < 4; i++) {
      logInfo(`\nGroup ${i + 1} - ${groupNames[i]} (Level ${i}):`);
      
      const name = await question('Category name: ');
      if (!name.trim()) {
        throw new Error(`Category name for group ${i + 1} cannot be empty`);
      }
      
      const words = [];
      for (let j = 0; j < 4; j++) {
        const word = await question(`Word ${j + 1}: `);
        if (!word.trim()) {
          throw new Error(`Word ${j + 1} for group ${i + 1} cannot be empty`);
        }
        words.push(word.trim());
      }
      
      groups.push({
        name: name.trim(),
        level: i,
        words: words
      });
    }
    
    const puzzleData = {
      date,
      gameId,
      groups
    };
    
    rl.close();
    
    // Validate and add the puzzle
    addPuzzle(puzzleData);
    
  } catch (error) {
    rl.close();
    throw error;
  }
}

/**
 * Search puzzles by content
 */
function searchPuzzles(query) {
  try {
    const existingData = readExistingPuzzleData();
    const results = [];
    
    Object.keys(existingData).forEach(date => {
      const puzzle = existingData[date];
      let matchFound = false;
      let matchDetails = [];
      
      // Search in words
      puzzle.groups.forEach(group => {
        group.words.forEach(word => {
          if (word.toLowerCase().includes(query.toLowerCase())) {
            matchFound = true;
            matchDetails.push(`"${word}" in ${group.name}`);
          }
        });
        
        // Search in category names
        if (group.name.toLowerCase().includes(query.toLowerCase())) {
          matchFound = true;
          matchDetails.push(`Category: ${group.name}`);
        }
      });
      
      if (matchFound) {
        results.push({
          date,
          gameId: puzzle.gameId,
          matches: matchDetails,
          categories: puzzle.groups.map(g => g.name).join(' | ')
        });
      }
    });
    
    if (results.length === 0) {
      logInfo(`No puzzles found containing "${query}"`);
      return;
    }
    
    logInfo(`Found ${results.length} puzzle(s) containing "${query}":`);
    results.forEach(result => {
      log(`  ${result.date} - Game ID: ${result.gameId}`);
      log(`    Categories: ${result.categories}`);
      log(`    Matches: ${result.matches.join(', ')}`);
      log('');
    });
    
  } catch (error) {
    logError(`Failed to search puzzles: ${error.message}`);
  }
}

/**
 * Show puzzle statistics
 */
function showStats() {
  try {
    const existingData = readExistingPuzzleData();
    const dates = Object.keys(existingData);
    
    if (dates.length === 0) {
      logInfo('No puzzles found.');
      return;
    }
    
    // Basic stats
    const totalPuzzles = dates.length;
    const dateRange = {
      min: dates[0],
      max: dates[dates.length - 1]
    };
    
    // Word frequency analysis
    const wordFrequency = {};
    const categoryFrequency = {};
    let totalWords = 0;
    
    dates.forEach(date => {
      const puzzle = existingData[date];
      totalWords += puzzle.groups.length * 4; // 4 words per group
      
      puzzle.groups.forEach(group => {
        // Count category frequency
        categoryFrequency[group.name] = (categoryFrequency[group.name] || 0) + 1;
        
        // Count word frequency
        group.words.forEach(word => {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
      });
    });
    
    // Level distribution
    const levelDistribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
    dates.forEach(date => {
      const puzzle = existingData[date];
      puzzle.groups.forEach(group => {
        levelDistribution[group.level]++;
      });
    });
    
    // Display stats
    logInfo(`📊 Puzzle Statistics`);
    log(`Total puzzles: ${totalPuzzles}`);
    log(`Date range: ${dateRange.min} to ${dateRange.max}`);
    log(`Total words: ${totalWords}`);
    log(`Average words per puzzle: ${(totalWords / totalPuzzles).toFixed(1)}`);
    log('');
    
    logInfo(`🎯 Difficulty Level Distribution:`);
    log(`  Yellow (Level 0): ${levelDistribution[0]} groups`);
    log(`  Green (Level 1): ${levelDistribution[1]} groups`);
    log(`  Blue (Level 2): ${levelDistribution[2]} groups`);
    log(`  Purple (Level 3): ${levelDistribution[3]} groups`);
    log('');
    
    // Most common categories
    const sortedCategories = Object.entries(categoryFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    logInfo(`🏷️  Top 5 Most Common Categories:`);
    sortedCategories.forEach(([category, count]) => {
      log(`  ${category}: ${count} occurrences`);
    });
    log('');
    
    // Most common words
    const sortedWords = Object.entries(wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    logInfo(`📝 Top 10 Most Common Words:`);
    sortedWords.forEach(([word, count]) => {
      log(`  ${word}: ${count} occurrences`);
    });
    
  } catch (error) {
    logError(`Failed to show stats: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command) {
      showUsage();
      process.exit(1);
    }
    
    switch (command) {
      case 'add':
        const addIndex = args.indexOf('--date');
        const date = args[addIndex + 1];
        const force = args.includes('--force');
        
        if (!date) {
          logError('--date parameter is required for add command');
          process.exit(1);
        }
        
        if (args.includes('--interactive')) {
          await interactivePuzzleCreation(date);
        } else {
          const puzzleFileIndex = args.indexOf('--puzzle-file');
          if (puzzleFileIndex === -1) {
            logError('Either --interactive or --puzzle-file is required for add command');
            process.exit(1);
          }
          
          const puzzleFile = args[puzzleFileIndex + 1];
          const puzzleData = JSON.parse(fs.readFileSync(puzzleFile, 'utf8'));
          addPuzzle(puzzleData, force);
        }
        break;
        
      case 'remove':
        const removeIndex = args.indexOf('--date');
        const removeDate = args[removeIndex + 1];
        
        if (!removeDate) {
          logError('--date parameter is required for remove command');
          process.exit(1);
        }
        
        removePuzzle(removeDate);
        break;
        
      case 'list':
        listDates();
        break;
        
      case 'validate':
        validateExistingData();
        break;
        
      case 'stats':
        showStats();
        break;
        
      case 'search':
        const searchQuery = args[1];
        if (!searchQuery) {
          logError('Search query is required for search command');
          process.exit(1);
        }
        searchPuzzles(searchQuery);
        break;
        
      case 'backup':
        createBackup();
        break;
        
      case 'restore':
        restoreFromBackup();
        break;
        
      default:
        logError(`Unknown command: ${command}`);
        showUsage();
        process.exit(1);
    }
    
  } catch (error) {
    logError(error.message);
    process.exit(1);
  }
}

/**
 * Show usage information
 */
function showUsage() {
  log(`
${colors.bright}NYT Connections Puzzle Data Update Script${colors.reset}

${colors.cyan}USAGE:${colors.reset}
  node scripts/update-puzzle-data.js <command> [options]

${colors.cyan}COMMANDS:${colors.reset}
  add       Add a new puzzle
  remove    Remove an existing puzzle
  list      List all available puzzle dates
  validate  Validate all existing puzzle data
  search    Search puzzles by words or categories
  stats     Show puzzle statistics and analytics
  backup    Create a manual backup of the current puzzleData.js
  restore   Restore puzzleData.js from the latest backup

${colors.cyan}EXAMPLES:${colors.reset}
  # Add puzzle from JSON file
  node scripts/update-puzzle-data.js add --date 2025-08-21 --puzzle-file new-puzzle.json

  # Add puzzle interactively
  node scripts/update-puzzle-data.js add --date 2025-08-21 --interactive

  # Force update existing puzzle
  node scripts/update-puzzle-data.js add --date 2025-08-21 --puzzle-file new-puzzle.json --force

  # Remove a puzzle
  node scripts/update-puzzle-data.js remove --date 2025-08-21

  # List all dates
  node scripts/update-puzzle-data.js list

  # Validate existing data
  node scripts/update-puzzle-data.js validate

  # Search for puzzles containing a word
  node scripts/update-puzzle-data.js search "ZEBRA"

  # Show puzzle statistics
  node scripts/update-puzzle-data.js stats

  # Create a manual backup
  node scripts/update-puzzle-data.js backup

  # Restore from backup
  node scripts/update-puzzle-data.js restore

${colors.cyan}PUZZLE DATA FORMAT (JSON):${colors.reset}
  {
    "date": "2025-08-21",
    "gameId": 803,
    "groups": [
      {
        "name": "CATEGORY NAME",
        "level": 0,
        "words": ["WORD1", "WORD2", "WORD3", "WORD4"]
      }
    ]
  }

${colors.cyan}VALIDATION RULES:${colors.reset}
  - Date must be in YYYY-MM-DD format
  - Game ID must be a positive integer
  - Exactly 4 groups required
  - Each group must have exactly 4 words
  - Level must be 0, 1, 2, or 3 (yellow, green, blue, purple)
  - Words can contain unicode/emojis
  - No duplicate words across all groups
  - No duplicate group names
  - No future dates allowed

${colors.cyan}SAFETY FEATURES:${colors.reset}
  - Atomic updates with rollback on failure
  - Automatic backup creation
  - Full data validation before writing
  - Syntax validation of generated JavaScript
  - Force update option for overwriting existing puzzles
  - Manual backup and restore commands
`, 'cyan');
}

/**
 * Create a manual backup
 */
function createBackup() {
  logInfo('Creating manual backup...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${BACKUP_PATH}.${timestamp}`;
  
  try {
    fs.copyFileSync(PUZZLE_DATA_PATH, backupPath);
    logSuccess(`Manual backup created: ${backupPath}`);
  } catch (error) {
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Restore from backup
 */
function restoreFromBackup() {
  logInfo('Restoring from backup...');
  
  if (!fs.existsSync(BACKUP_PATH)) {
    throw new Error('No backup file found. Cannot restore.');
  }
  
  try {
    fs.copyFileSync(BACKUP_PATH, PUZZLE_DATA_PATH);
    logSuccess('Backup restored successfully!');
  } catch (error) {
    throw new Error(`Failed to restore backup: ${error.message}`);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validatePuzzleData,
  addPuzzle,
  removePuzzle,
  readExistingPuzzleData,
  generateJSContent
};
