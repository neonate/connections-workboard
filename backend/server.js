// Node.js 18 compatibility fix for undici/cheerio
if (typeof global.File === 'undefined') {
  global.File = class File {
    constructor(bits, name, options = {}) {
      this.bits = bits;
      this.name = name;
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const axios = require('axios');
const cheerio = require('cheerio');

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_TEST_ENV = NODE_ENV === 'test';
const IS_PRODUCTION = NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://lionfish-app-swahh.ondigitalocean.app'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// CSV file path
const CSV_FILE_PATH = path.join(__dirname, '../data/puzzles.csv');

// Ensure data directory exists
fs.ensureDirSync(path.dirname(CSV_FILE_PATH));

// Initialize CSV if it doesn't exist
if (!fs.existsSync(CSV_FILE_PATH)) {
  const initialCsv = 'GameID,Date,Word,GroupName,GroupLevel,GroupIndex,WordIndex\n';
  fs.writeFileSync(CSV_FILE_PATH, initialCsv);
}

/**
 * Read all puzzles from CSV file
 * @returns {Promise<Array>} Array of puzzle entries
 */
async function readPuzzlesFromCSV() {
  try {
    const results = [];
    
    if (fs.existsSync(CSV_FILE_PATH)) {
      const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
      if (fileContent.trim()) {
        const lines = fileContent.trim().split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const entry = {};
          headers.forEach((header, index) => {
            entry[header.trim()] = values[index] ? values[index].trim() : '';
          });
          results.push(entry);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error reading CSV:', error);
    throw new Error('Failed to read puzzle data');
  }
}

/**
 * Write puzzles to CSV file
 * @param {Array} puzzles - Array of puzzle entries
 */
async function writePuzzlesToCSV(puzzles) {
  try {
    if (puzzles.length === 0) {
      fs.writeFileSync(CSV_FILE_PATH, 'GameID,Date,Word,GroupName,GroupLevel,GroupIndex,WordIndex\n');
      return;
    }
    
    const csvWriter = createCsvWriter({
      path: CSV_FILE_PATH,
      header: [
        { id: 'GameID', title: 'GameID' },
        { id: 'Date', title: 'Date' },
        { id: 'Word', title: 'Word' },
        { id: 'GroupName', title: 'GroupName' },
        { id: 'GroupLevel', title: 'GroupLevel' },
        { id: 'GroupIndex', title: 'GroupIndex' },
        { id: 'WordIndex', title: 'WordIndex' }
      ]
    });
    
    await csvWriter.writeRecords(puzzles);
  } catch (error) {
    console.error('Error writing CSV:', error);
    throw new Error('Failed to write puzzle data');
  }
}

/**
 * Validate puzzle data
 * @param {Object} puzzleData - Puzzle data to validate
 * @returns {Object} Validation result
 */
function validatePuzzleData(puzzleData) {
  const errors = [];
  
  if (!puzzleData.date || !puzzleData.date.trim()) {
    errors.push('Date is required');
  }
  
  if (!puzzleData.groups || !Array.isArray(puzzleData.groups) || puzzleData.groups.length !== 4) {
    errors.push('Exactly 4 groups are required');
  }
  
  let totalWords = 0;
  puzzleData.groups.forEach((group, groupIndex) => {
    if (!group.name || !group.name.trim()) {
      errors.push(`Group ${groupIndex + 1} name is required`);
    }
    
    if (!group.words || !Array.isArray(group.words) || group.words.length !== 4) {
      errors.push(`Group ${groupIndex + 1} must have exactly 4 words`);
    } else {
      totalWords += group.words.length;
      group.words.forEach((word, wordIndex) => {
        if (!word || !word.trim()) {
          errors.push(`Word ${wordIndex + 1} in Group ${groupIndex + 1} is required`);
        }
      });
    }
  });
  
  if (totalWords !== 16) {
    errors.push(`Total words must be 16, got ${totalWords}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate Game ID based on date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {number} Calculated Game ID
 */
function calculateGameId(date) {
  const targetDate = new Date(date);
  const baseDate = new Date('2025-07-27'); // July 27, 2025 = Game ID 777
  const baseGameId = 777;
  
  const timeDiff = targetDate.getTime() - baseDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return baseGameId + daysDiff;
}

// API Routes

/**
 * GET /api/puzzles - Get all puzzles
 */
app.get('/api/puzzles', async (req, res) => {
  try {
    const puzzles = await readPuzzlesFromCSV();
    res.json({ success: true, data: puzzles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/puzzles/:date - Get puzzle by date
 */
app.get('/api/puzzles/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const puzzles = await readPuzzlesFromCSV();
    
    // Group words by date and organize into groups
    const datePuzzles = puzzles.filter(p => p.Date === date);
    
    if (datePuzzles.length === 0) {
      return res.status(404).json({ success: false, error: 'Puzzle not found for this date' });
    }
    
    // Organize into groups
    const groups = [];
    const words = [];
    
    for (let groupIndex = 1; groupIndex <= 4; groupIndex++) {
      const groupWords = datePuzzles.filter(p => p.GroupIndex === groupIndex.toString());
      if (groupWords.length > 0) {
        const groupName = groupWords[0].GroupName;
        const groupLevel = parseInt(groupWords[0].GroupLevel);
        const words = groupWords.map(p => p.Word);
        
        groups.push({
          name: groupName,
          level: groupLevel,
          words: words
        });
        
        words.push(...words);
      }
    }
    
    const puzzleData = {
      date: date,
      gameId: parseInt(datePuzzles[0].GameID),
      groups: groups,
      words: words,
      source: 'csv'
    };
    
    res.json({ success: true, data: puzzleData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/puzzles - Add new puzzle
 */
app.post('/api/puzzles', async (req, res) => {
  try {
    const puzzleData = req.body;
    
    // Validate input
    const validation = validatePuzzleData(puzzleData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }
    
    // Check if puzzle already exists for this date
    const existingPuzzles = await readPuzzlesFromCSV();
    const existingDate = existingPuzzles.find(p => p.Date === puzzleData.date);
    if (existingDate) {
      return res.status(409).json({ 
        success: false, 
        error: 'Puzzle already exists for this date' 
      });
    }
    
    // Calculate Game ID
    const gameId = calculateGameId(puzzleData.date);
    
    // Convert to CSV format
    const newPuzzles = [];
    puzzleData.groups.forEach((group, groupIndex) => {
      group.words.forEach((word, wordIndex) => {
        newPuzzles.push({
          GameID: gameId.toString(),
          Date: puzzleData.date,
          Word: word,
          GroupName: group.name,
          GroupLevel: group.level.toString(),
          GroupIndex: (groupIndex + 1).toString(),
          WordIndex: (wordIndex + 1).toString()
        });
      });
    });
    
    // Add to existing puzzles
    const allPuzzles = [...existingPuzzles, ...newPuzzles];
    
    // Write back to CSV
    await writePuzzlesToCSV(allPuzzles);
    
    res.json({ 
      success: true, 
      message: 'Puzzle added successfully',
      data: {
        gameId,
        date: puzzleData.date,
        totalWords: newPuzzles.length
      }
    });
    
  } catch (error) {
    console.error('Error adding puzzle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/puzzles/:date - Delete puzzle by date
 */
app.delete('/api/puzzles/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const puzzles = await readPuzzlesFromCSV();
    
    const filteredPuzzles = puzzles.filter(p => p.Date !== date);
    
    if (filteredPuzzles.length === puzzles.length) {
      return res.status(404).json({ success: false, error: 'Puzzle not found for this date' });
    }
    
    await writePuzzlesToCSV(filteredPuzzles);
    
    res.json({ 
      success: true, 
      message: 'Puzzle deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting puzzle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/fetch-puzzle/:date - Fetch puzzle data from external sources
 */
app.get('/api/fetch-puzzle/:date', async (req, res) => {
  console.log(`🚀 ROUTE HIT: /api/fetch-puzzle/${req.params.date}`);
  try {
    const { date } = req.params;
    console.log(`🔄 Backend: Attempting to fetch puzzle for ${date}`);
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }
    
            let puzzleData = null;
        let source = null;

        // Try TechRadar first (most reliable format)
        try {
          console.log(`🌐 Backend: Trying TechRadar for ${date}`);
          puzzleData = await fetchFromTechRadar(date);
          source = 'TechRadar';
          console.log(`✅ Backend: Successfully fetched from TechRadar`);
        } catch (error) {
          console.log(`❌ Backend: TechRadar failed: ${error.message}`);
        }

        // Try Times of India if TechRadar failed
        if (!puzzleData) {
          try {
            console.log(`🌐 Backend: Trying Times of India for ${date}`);
            puzzleData = await fetchFromTimesOfIndia(date);
            source = 'Times of India';
            console.log(`✅ Backend: Successfully fetched from Times of India`);
          } catch (error) {
            console.log(`❌ Backend: Times of India failed: ${error.message}`);
          }
        }

        // Try Connections Archive as fallback (custom puzzles)
        if (!puzzleData) {
          try {
            console.log(`🌐 Backend: Trying Connections Archive for ${date}`);
            puzzleData = await fetchFromConnectionsArchive(date);
            source = 'Connections Archive (Custom)';
            console.log(`✅ Backend: Successfully fetched from Connections Archive`);
          } catch (error) {
            console.log(`❌ Backend: Connections Archive failed: ${error.message}`);
          }
        }
    
    if (!puzzleData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Puzzle data not found from any source' 
      });
    }
    
    // Validate the fetched data
    const validation = validatePuzzleData(puzzleData);
    if (!validation.isValid) {
      return res.status(500).json({ 
        success: false, 
        error: 'Fetched data is invalid', 
        details: validation.errors 
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...puzzleData,
        source: source,
        fetchedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Backend fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error while fetching puzzle data' 
    });
  }
});

/**
 * Fetch puzzle data from TechRadar
 */
async function fetchFromTechRadar(date) {
  // Convert date to TechRadar URL format: nyt-connections-today-answers-hints-21-august-2025
  // Parse date as YYYY-MM-DD and construct date object with components to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const monthNames = ["january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"];
  const monthName = monthNames[month - 1]; // month is 1-based, array is 0-based

  const url = `https://www.techradar.com/gaming/nyt-connections-today-answers-hints-${day}-${monthName}-${year}`;
  console.log(`🌐 Backend: Fetching from ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

            const html = response.data;

        // Parse the HTML to extract categories and words using the structural clues
        // The HTML structure is: <strong>YELLOW: CATEGORY_NAME </strong>WORD1, WORD2, WORD3, WORD4
        const $ = cheerio.load(html);
        
        // Find the main answers list (usually the first ul after the "the answers" heading)
        let answersList = $('ul').filter((i, el) => {
          const prevHeading = $(el).prev('h2');
          return prevHeading.text().toLowerCase().includes('the answers');
        }).first();
        
        if (answersList.length === 0) {
          // Try alternative selector - look for ul with li elements containing strong tags with color names
          const alternativeList = $('ul').filter((i, el) => {
            const $ul = $(el);
            const hasColorItems = $ul.find('li strong').filter((j, strongEl) => {
              const text = $(strongEl).text();
              return text.match(/^(YELLOW|GREEN|BLUE|PURPLE):/);
            }).length > 0;
            return hasColorItems;
          }).first();
          
          if (alternativeList.length === 0) {
            throw new Error('Could not find answers list in HTML');
          }
          
          console.log('🔍 Using alternative selector to find answers list');
          answersList = alternativeList;
        }
        
        // Now find the specific ul that contains the actual answers (not just hints)
        // First, try to find the "the answers" heading and get the ul that follows it
        let actualAnswersList = null;
        
        // Look for the "the answers" heading
        const answersHeading = $('h2').filter((i, el) => {
          const text = $(el).text().toLowerCase();
          return text.includes('the answers');
        }).first();
        
        console.log(`🔍 Debug: Found ${answersHeading.length} headings with "the answers"`);
        
        if (answersHeading.length > 0) {
          // Look for the ul that comes after this heading
          const answersListAfterHeading = answersHeading.nextAll('ul').first();
          if (answersListAfterHeading.length > 0) {
            console.log('🔍 Found answers list after "the answers" heading');
            actualAnswersList = answersListAfterHeading;
          }
        }
        
        // If no heading found, try to find any element containing "the answers" text
        if (!actualAnswersList) {
          const answersTextElement = $('*:contains("the answers")').filter((i, el) => {
            const text = $(el).text().toLowerCase();
            return text.includes('the answers') && text.length < 100; // Avoid body text
          }).first();
          
          console.log(`🔍 Debug: Found ${answersTextElement.length} elements with "the answers" text`);
          
          if (answersTextElement.length > 0) {
            // Find the ul that comes after this element
            const answersListAfterText = answersTextElement.nextAll('ul').first();
            if (answersListAfterText.length > 0) {
              console.log('🔍 Found answers list after "the answers" text');
              actualAnswersList = answersListAfterText;
            }
          }
        }
        
        // If still no answers list, try to find the ul with the most words
        if (!actualAnswersList) {
          let maxWords = 0;
          let bestList = null;
          
          $('ul').each((i, el) => {
            const $ul = $(el);
            const totalWords = $ul.find('li').toArray().reduce((count, liEl) => {
              const text = $(liEl).text();
              const wordCount = (text.match(/,/g) || []).length + 1; // Count commas + 1 for words
              return count + wordCount;
            }, 0);
            
            if (totalWords > maxWords) {
              maxWords = totalWords;
              bestList = $ul;
            }
          });
          
          console.log(`🔍 Debug: Best list has ${maxWords} total words`);
          
          if (bestList && maxWords >= 16) { // Should have at least 16 words total
            console.log(`🔍 Found answers list with ${maxWords} total words`);
            actualAnswersList = bestList;
          }
        }
        
        // If still no answers list, try to find the one that comes after "the answers" text
        if (!actualAnswersList) {
          // Look for any element containing "the answers" text
          const answersTextElement = $('*:contains("the answers")').filter((i, el) => {
            const text = $(el).text().toLowerCase();
            return text.includes('the answers') && text.length < 100; // Avoid body text
          }).first();
          
          console.log(`🔍 Debug: Found ${answersTextElement.length} elements with "the answers" text`);
          
          if (answersTextElement.length > 0) {
            // Find the ul that comes after this element
            const answersListAfterText = answersTextElement.nextAll('ul').first();
            if (answersListAfterText.length > 0) {
              console.log('🔍 Found answers list after "the answers" text');
              actualAnswersList = answersListAfterText;
            }
          }
        }
        
        if (!actualAnswersList) {
          throw new Error('Could not find answers list with actual puzzle words');
        }
        
        console.log('🔍 Found answers list with actual puzzle words');
        answersList = actualAnswersList;
        
        const groups = [];
        const words = [];
        const seenGroups = new Map();
        
        // Define color levels for difficulty
        const colorLevels = { 'YELLOW': 0, 'GREEN': 1, 'BLUE': 2, 'PURPLE': 3 };
        
        // First, extract the hints from the "group hints" section
        const hints = {};
        
        // Look for the specific section with hint text (not the answers)
        // The hints are in a section that comes before the answers and doesn't contain commas
        const hintItems = $('ul li').filter((i, el) => {
          const text = $(el).text();
          // Must start with color name but NOT contain commas (which indicates answers)
          return text.match(/^(YELLOW|GREEN|BLUE|PURPLE):\s*/) && !text.includes(',');
        });
        
        console.log(`🔍 Found ${hintItems.length} hint items`);
        
        // Process hints and prioritize descriptive ones (not the group names)
        hintItems.each((i, el) => {
          const $li = $(el);
          const fullText = $li.text().trim();
          const match = fullText.match(/^(YELLOW|GREEN|BLUE|PURPLE):\s*(.+)$/);
          if (match) {
            const color = match[1];
            const hint = match[2].trim();
            
            // Only store if we don't already have a hint for this color,
            // or if this one looks more descriptive (has lowercase words)
            if (!hints[color] || hint.match(/[a-z]/)) {
              hints[color] = hint;
              console.log(`   💡 ${color}: ${hint}`);
            }
          }
        });
        
        // Parse each list item
        answersList.find('li').each((index, element) => {
          const $li = $(element);
          const text = $li.html(); // Get HTML content to preserve <strong> tags
          
          // Extract category name from <strong> tags
          const strongMatch = text.match(/<strong>([^<]+)<\/strong>/);
          if (!strongMatch) {
            console.log(`⚠️ Skipping list item without strong tags: ${text}`);
            return;
          }
          
          const categoryText = strongMatch[1].trim(); // e.g., "YELLOW: LIQUIDS YOU PUT INTO CARS"
          
          // Extract color and category name
          const colorMatch = categoryText.match(/^([A-Z]+):\s*(.+)$/);
          if (!colorMatch) {
            console.log(`⚠️ Skipping list item with invalid format: ${categoryText}`);
            return;
          }
          
          const color = colorMatch[1];
          const categoryName = colorMatch[2].trim();
          
          // Extract words from after the </strong> tag
          let wordsText = text.replace(/<strong>[^<]+<\/strong>/, '').trim();
          
          // If no words found after </strong>, check if words are inside the <strong> tag
          if (!wordsText || wordsText.length === 0) {
            // Extract content from inside <strong> tags
            const strongContent = text.match(/<strong>([^<]+)<\/strong>/);
            if (strongContent) {
              const fullContent = strongContent[1];
              // Look for comma-separated words in the strong content
              if (fullContent.includes(',')) {
                // Extract the part after the color and category
                const afterColor = fullContent.replace(/^(YELLOW|GREEN|BLUE|PURPLE):\s*/, '');
                if (afterColor.includes(',')) {
                  wordsText = afterColor;
                  console.log(`🔍 Found words inside <strong> tag: "${wordsText}"`);
                }
              }
            }
          }
          
          const wordList = wordsText.split(',').map(word => word.trim().toUpperCase()).filter(word => word.length > 0);
          
          // Debug logging to see what's happening
          console.log(`🔍 Debug ${color}: text="${text}", wordsText="${wordsText}", wordList=[${wordList.join(', ')}]`);
          
          if (wordList.length !== 4) {
            console.log(`⚠️ Expected 4 words for ${color}, got ${wordList.length}: ${wordList.join(', ')}`);
            return;
          }
          
          // Skip if we already have this color (deduplication)
          if (seenGroups.has(color)) {
            console.log(`⏭️ Skipping duplicate ${color} group`);
            return;
          }
          
          console.log(`✅ Parsed ${color}: ${categoryName} - [${wordList.join(', ')}]`);
          
          const groupData = {
            name: categoryName,
            level: colorLevels[color],
            words: wordList,
            hint: hints[color] || categoryName
          };
          
          seenGroups.set(color, groupData);
          groups.push(groupData);
          words.push(...wordList);
        });

    // Ensure we have exactly 4 groups
    if (groups.length !== 4) {
      throw new Error(`Expected exactly 4 groups after deduplication, got ${groups.length}`);
    }

    if (words.length !== 16) {
      throw new Error(`Expected 16 total words, got ${words.length}`);
    }

    // Calculate game ID (days since NYT Connections launch: June 12, 2023)
    const gameId = calculateGameId(date);

    return {
      date: date,
      gameId: gameId,
      words: words,
      groups: groups
    };

  } catch (error) {
    console.error(`❌ Backend: Error fetching from TechRadar: ${error.message}`);
    
    // Check if this is a 404/503 (TechRadar doesn't have this date)
    if (error.response && (error.response.status === 404 || error.response.status === 503)) {
      // Parse date to check if it's before TechRadar coverage
      const [year, month] = date.split('-').map(Number);
      const puzzleDate = new Date(year, month - 1, 1); // First day of the month
      const techRadarStartDate = new Date(2024, 5, 1); // June 1, 2024
      
      if (puzzleDate < techRadarStartDate) {
        throw new Error(`❌ No reliable web sources available for ${date}. Web coverage began in June 2024.\n\n💡 Try these reliable dates:\n• June 12, 2024 (known working)\n• July 18, 2024 (popular date)\n• Any date from August 2024 onwards`);
      } else {
        throw new Error(`TechRadar article not found for ${date} (HTTP ${error.response.status}). This date might not be covered or may have a different URL format.`);
      }
    }
    
    throw error;
  }
}

/**
 * Fetch puzzle data from Times of India
 */
async function fetchFromTimesOfIndia(date) {
  // Times of India uses format: nyt-connections-hints-and-answers-for-today-august-19-2025
  // Parse date as YYYY-MM-DD and construct date object with components to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const monthNames = ["january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"];
  const monthName = monthNames[month - 1]; // month is 1-based, array is 0-based

  // Note: TOI uses dynamic article IDs, so we can't predict the full URL
  // We'll search for articles with the expected title pattern
  const searchQuery = `nyt connections hints answers ${monthName} ${day} ${year}`;
  const searchUrl = `https://www.google.com/search?q=site:timesofindia.indiatimes.com+${encodeURIComponent(searchQuery)}`;
  
  console.log(`🌐 Backend: Searching for Times of India article for ${date}`);

  try {
    // For now, we'll implement a direct approach using a known pattern
    // This is a limitation that would need to be addressed with a proper search mechanism
    
    // Try common article ID patterns or search approach
    // For testing, we'll use a more direct content-based search
    const baseUrl = 'https://timesofindia.indiatimes.com/technology/gaming/';
    
    // Since TOI articles have unpredictable IDs, we'll throw an error for now
    // and rely on TechRadar as the primary source
    throw new Error(`Times of India articles have dynamic IDs - cannot predict URL for ${date}. Consider implementing search-based discovery.`);

  } catch (error) {
    console.error(`❌ Backend: Error fetching from Times of India: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch puzzle data from Connections Archive
 */
async function fetchFromConnectionsArchive(date) {
  const url = 'https://connections.swellgarfo.com/archive';
  console.log(`🌐 Backend: Fetching from ${url}`);
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    timeout: 10000
  });
  
  const $ = cheerio.load(response.data);
  
  // Look for the specific date in the archive
  const targetDate = new Date(date);
  const dateString = targetDate.toLocaleDateString('en-US');
  
  // Find the puzzle entry (this would need refinement based on actual structure)
  const puzzleRow = $(`*:contains("${dateString}")`).closest('tr, .puzzle-entry');
  
  if (puzzleRow.length === 0) {
    throw new Error(`Puzzle for ${date} not found in Connections Archive`);
  }
  
  // Extract puzzle data (placeholder implementation)
  const groups = [];
  const words = [];
  
  // This would need to be implemented based on the actual archive structure
  throw new Error('Connections Archive parser not yet implemented');
}

/**
 * GET /api/health - Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Production: Serve React app from build directory
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  console.log('📦 Serving frontend from build directory...');
  
  // Serve static files from the React build directory
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Handle React Router - send all non-API requests to React app
  app.get('/*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 CSV file: ${CSV_FILE_PATH}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
