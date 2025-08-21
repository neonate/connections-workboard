import WebScraperBase from './WebScraperBase.js';

/**
 * Fetcher for Connections Game IO (connectionsgame.io)
 * Primary data source based on evaluation results.
 * 
 * Data Source Analysis:
 * - Reliability: 100% (Perfect success rate)
 * - Response Time: ~300ms (Excellent)
 * - CORS: Requires proxy
 * - Historical Coverage: Limited to news page
 * - Overall Score: 66.5% (Highest rated)
 */
class ConnectionsGameFetcher extends WebScraperBase {
  constructor(config = {}) {
    super('ConnectionsGame', {
      requestDelay: 2000, // Be respectful with requests
      maxRetries: 3,
      retryDelay: 3000,
      timeout: 15000,
      ...config
    });

    this.baseUrl = 'https://connectionsgame.io';
    this.newsUrl = 'https://connectionsgame.io/news/connections-answers';
    
    // Common selectors for parsing
    this.selectors = {
      // Try multiple selectors for different page structures
      date: [
        '[data-date]',
        '.puzzle-date',
        '.date',
        'time[datetime]',
        'h1:contains("connections")',
        'h2:contains("connections")'
      ],
      gameId: [
        '[data-game-id]',
        '.game-id',
        '.puzzle-number'
      ],
      groups: [
        '.connection-group',
        '.puzzle-group', 
        '.category',
        'div:contains("Yellow")',
        'div:contains("Green")',
        'div:contains("Blue")',
        'div:contains("Purple")'
      ],
      words: [
        '.word',
        '.puzzle-word',
        '.connection-word',
        'span.word',
        'li'
      ],
      categories: [
        '.category-name',
        '.group-name',
        'h3',
        'h4',
        '.title'
      ]
    };
  }

  /**
   * Build URL for fetching puzzle data
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {string} URL to fetch
   * @protected
   */
  _buildUrl(date) {
    // For now, we only have the main news URL
    // In the future, this could be enhanced to build date-specific URLs
    return this.newsUrl;
  }

  /**
   * Parse content from Connections Game IO
   * @param {string} html - Raw HTML content
   * @param {string} date - Date being fetched
   * @returns {Object} Parsed puzzle data
   * @protected
   */
  _parseContent(html, date) {
    const doc = this._parseHTML(html);
    
    // Try multiple parsing strategies
    let puzzleData = null;
    
    // Strategy 1: Look for structured JSON data
    puzzleData = this._parseStructuredData(doc, date);
    if (puzzleData) return puzzleData;
    
    // Strategy 2: Parse HTML structure
    puzzleData = this._parseHtmlStructure(doc, date);
    if (puzzleData) return puzzleData;
    
    // Strategy 3: Parse text content
    puzzleData = this._parseTextContent(doc, date);
    if (puzzleData) return puzzleData;
    
    throw new Error('Could not parse puzzle data from any known format');
  }

  /**
   * Parse structured JSON data (if available)
   * @param {Document} doc - Parsed HTML document
   * @param {string} date - Target date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _parseStructuredData(doc, date) {
    // Look for JSON-LD or other structured data
    const scripts = doc.querySelectorAll('script[type="application/ld+json"], script[data-puzzle], script:contains("connections")');
    
    for (const script of scripts) {
      try {
        const jsonData = JSON.parse(script.textContent);
        if (this._isValidPuzzleJson(jsonData, date)) {
          return this._formatPuzzleData(jsonData, date);
        }
      } catch (e) {
        // Continue to next script
      }
    }
    
    return null;
  }

  /**
   * Parse HTML structure for puzzle data
   * @param {Document} doc - Parsed HTML document
   * @param {string} date - Target date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _parseHtmlStructure(doc, date) {
    try {
      // Extract date (use provided date if not found)
      let puzzleDate = this._extractText(doc, this.selectors.date, date);
      puzzleDate = this._formatDate(puzzleDate);
      
      // If found date doesn't match target, try to find the right puzzle
      if (puzzleDate !== date) {
        console.warn(`⚠️ [${this.sourceName}] Found date ${puzzleDate}, looking for ${date}`);
        // For now, use the found date, but log the discrepancy
      }

      // Extract game ID (generate if not found)
      const gameIdText = this._extractText(doc, this.selectors.gameId, '');
      const gameId = this._extractGameId(gameIdText) || this._generateGameId(puzzleDate);

      // Extract groups and categories
      const groups = this._extractGroups(doc);
      
      if (!groups || groups.length !== 4) {
        throw new Error(`Expected 4 groups, found ${groups ? groups.length : 0}`);
      }

      return {
        date: puzzleDate,
        gameId: gameId,
        groups: groups,
        source: this.sourceName
      };
      
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] HTML structure parsing failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse text content for puzzle data (fallback)
   * @param {Document} doc - Parsed HTML document  
   * @param {string} date - Target date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _parseTextContent(doc, date) {
    try {
      const text = doc.body.textContent || '';
      
      // Look for common patterns in text
      const patterns = {
        yellow: /yellow[:\s]*(.*?)(?=green|$)/i,
        green: /green[:\s]*(.*?)(?=blue|$)/i,
        blue: /blue[:\s]*(.*?)(?=purple|$)/i,
        purple: /purple[:\s]*(.*?)$/i
      };

      const groups = [];
      const levels = { yellow: 0, green: 1, blue: 2, purple: 3 };

      for (const [color, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
          const words = this._extractWordsFromText(match[1]);
          if (words.length >= 4) {
            groups.push({
              name: `${color.toUpperCase()} GROUP`,
              level: levels[color],
              words: words.slice(0, 4)
            });
          }
        }
      }

      if (groups.length === 4) {
        return {
          date: date,
          gameId: this._generateGameId(date),
          groups: groups,
          source: this.sourceName
        };
      }

      return null;
      
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] Text content parsing failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract groups from HTML structure
   * @param {Document} doc - Parsed document
   * @returns {Array} Array of group objects
   * @private
   */
  _extractGroups(doc) {
    const groups = [];
    
    // Strategy 1: Look for structured group containers
    const groupContainers = doc.querySelectorAll('.group, .category, .connection-group, .puzzle-section');
    
    if (groupContainers.length >= 4) {
      groupContainers.forEach((container, index) => {
        if (index < 4) {
          const group = this._parseGroupContainer(container, index);
          if (group) groups.push(group);
        }
      });
    }
    
    // Strategy 2: Look for color-based groups
    if (groups.length < 4) {
      groups.length = 0; // Reset
      const colors = ['yellow', 'green', 'blue', 'purple'];
      
      colors.forEach((color, index) => {
        const group = this._findGroupByColor(doc, color, index);
        if (group) groups.push(group);
      });
    }
    
    // Strategy 3: Look for list-based structure
    if (groups.length < 4) {
      groups.length = 0; // Reset
      const lists = doc.querySelectorAll('ul, ol, .word-list');
      
      if (lists.length >= 4) {
        lists.forEach((list, index) => {
          if (index < 4) {
            const words = this._extractTextArray(list, ['li', '.word', 'span']);
            if (words.length >= 4) {
              groups.push({
                name: `GROUP ${index + 1}`,
                level: index,
                words: words.slice(0, 4)
              });
            }
          }
        });
      }
    }

    return groups;
  }

  /**
   * Parse a group container element
   * @param {Element} container - Group container element
   * @param {number} index - Group index
   * @returns {Object|null} Group object or null
   * @private
   */
  _parseGroupContainer(container, index) {
    try {
      const name = this._extractText(container, this.selectors.categories, `GROUP ${index + 1}`);
      const words = this._extractTextArray(container, this.selectors.words);
      
      if (words.length >= 4) {
        return {
          name: name.toUpperCase(),
          level: index,
          words: words.slice(0, 4)
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find group by color identifier
   * @param {Document} doc - Parsed document
   * @param {string} color - Color name
   * @param {number} level - Difficulty level
   * @returns {Object|null} Group object or null
   * @private
   */
  _findGroupByColor(doc, color, level) {
    const colorSelectors = [
      `[data-color="${color}"]`,
      `.${color}`,
      `[class*="${color}"]`,
      `*:contains("${color}")`
    ];

    for (const selector of colorSelectors) {
      try {
        const elements = doc.querySelectorAll(selector);
        for (const element of elements) {
          const words = this._extractTextArray(element, this.selectors.words);
          if (words.length >= 4) {
            const name = this._extractText(element, this.selectors.categories, `${color.toUpperCase()} GROUP`);
            return {
              name: name.toUpperCase(),
              level: level,
              words: words.slice(0, 4)
            };
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return null;
  }

  /**
   * Extract words from text content
   * @param {string} text - Text to parse
   * @returns {Array} Array of words
   * @private
   */
  _extractWordsFromText(text) {
    if (!text) return [];
    
    // Clean up text and split into words
    const cleaned = text
      .replace(/[^\w\s\-'&]/g, ' ') // Keep letters, numbers, hyphens, apostrophes, ampersands
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleaned.split(' ')
      .filter(word => word.length > 1) // Filter out single characters
      .map(word => word.toUpperCase())
      .slice(0, 4); // Take first 4 words
    
    return words;
  }

  /**
   * Extract game ID from text
   * @param {string} text - Text containing game ID
   * @returns {number|null} Game ID or null
   * @private
   */
  _extractGameId(text) {
    if (!text) return null;
    
    const patterns = [
      /game\s*#?(\d+)/i,
      /puzzle\s*#?(\d+)/i,
      /connections\s*#?(\d+)/i,
      /#(\d+)/,
      /(\d+)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const id = parseInt(match[1]);
        if (id > 0 && id < 10000) { // Reasonable range
          return id;
        }
      }
    }

    return null;
  }

  /**
   * Generate game ID based on date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {number} Generated game ID
   * @private
   */
  _generateGameId(date) {
    // NYT Connections started on June 12, 2023
    const startDate = new Date(2023, 5, 12); // June 12, 2023
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    
    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays + 1); // Start from game 1
  }

  /**
   * Check if JSON data contains valid puzzle information
   * @param {Object} data - JSON data to validate
   * @param {string} date - Target date
   * @returns {boolean} True if valid puzzle data
   * @private
   */
  _isValidPuzzleJson(data, date) {
    return data && 
           (data.date || data.puzzle_date) &&
           (data.groups || data.categories || data.answers) &&
           Array.isArray(data.groups || data.categories || data.answers);
  }

  /**
   * Format puzzle data to standard structure
   * @param {Object} data - Raw puzzle data
   * @param {string} date - Target date
   * @returns {Object} Formatted puzzle data
   * @private
   */
  _formatPuzzleData(data, date) {
    const groups = data.groups || data.categories || data.answers || [];
    
    return {
      date: date,
      gameId: data.gameId || data.puzzle_id || this._generateGameId(date),
      groups: groups.slice(0, 4).map((group, index) => ({
        name: (group.name || group.category || `GROUP ${index + 1}`).toUpperCase(),
        level: group.level !== undefined ? group.level : index,
        words: (group.words || group.items || []).slice(0, 4)
      })),
      source: this.sourceName
    };
  }

  /**
   * Check if puzzle data is available for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} True if available
   */
  async isAvailable(date) {
    try {
      // For Connections Game, we can only check the main news page
      const response = await this._makeRequest(this.newsUrl);
      
      // If we can access the page and it contains connections content, consider it available
      const html = await response.text();
      const hasConnectionsContent = /connections/i.test(html) && 
                                  (/yellow|green|blue|purple/i.test(html) || 
                                   /group|category|word/i.test(html));
      
      return hasConnectionsContent;
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] Availability check failed for ${date}: ${error.message}`);
      return false;
    }
  }
}

export default ConnectionsGameFetcher;
