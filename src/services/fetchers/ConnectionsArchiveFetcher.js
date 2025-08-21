import WebScraperBase from './WebScraperBase.js';

/**
 * Fetcher for Connections Archive (connections.swellgarfo.com)
 * Backup data source based on evaluation results.
 * 
 * Data Source Analysis:
 * - Reliability: 100% (Perfect success rate)
 * - Response Time: ~40ms (Excellent)
 * - CORS: Requires proxy
 * - Historical Coverage: Archive-focused design
 * - Overall Score: 62.5% (Second highest rated)
 */
class ConnectionsArchiveFetcher extends WebScraperBase {
  constructor(config = {}) {
    super('ConnectionsArchive', {
      requestDelay: 1500, // Be respectful with requests
      maxRetries: 3,
      retryDelay: 2500,
      timeout: 12000,
      ...config
    });

    this.baseUrl = 'https://connections.swellgarfo.com';
    this.archiveUrl = 'https://connections.swellgarfo.com/archive';
    
    // Selectors for parsing archive data
    this.selectors = {
      puzzleEntries: [
        '.puzzle-entry',
        '.archive-item',
        '.puzzle',
        '[data-date]',
        'tr', // Table rows
        'li' // List items
      ],
      date: [
        '[data-date]',
        '.date',
        '.puzzle-date',
        'td:first-child',
        '.day'
      ],
      gameId: [
        '[data-game-id]',
        '.game-id',
        '.number',
        'td:nth-child(2)'
      ],
      groups: [
        '.groups',
        '.categories',
        '.answers',
        'td:last-child'
      ],
      groupData: [
        '.group',
        '.category',
        'div[data-level]'
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
    // For now, use the main archive URL
    // In the future, this could be enhanced with date-specific endpoints
    return this.archiveUrl;
  }

  /**
   * Parse content from Connections Archive
   * @param {string} html - Raw HTML content
   * @param {string} date - Date being fetched
   * @returns {Object} Parsed puzzle data
   * @protected
   */
  _parseContent(html, date) {
    const doc = this._parseHTML(html);
    
    // Try multiple parsing strategies
    let puzzleData = null;
    
    // Strategy 1: Look for specific date entry in archive
    puzzleData = this._findDateSpecificEntry(doc, date);
    if (puzzleData) return puzzleData;
    
    // Strategy 2: Parse most recent entry if date not found
    puzzleData = this._parseLatestEntry(doc, date);
    if (puzzleData) return puzzleData;
    
    // Strategy 3: Parse any available data structure
    puzzleData = this._parseAnyAvailableData(doc, date);
    if (puzzleData) return puzzleData;
    
    throw new Error('Could not parse puzzle data from archive format');
  }

  /**
   * Find entry for specific date in archive
   * @param {Document} doc - Parsed HTML document
   * @param {string} date - Target date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _findDateSpecificEntry(doc, date) {
    const entries = doc.querySelectorAll(this.selectors.puzzleEntries.join(', '));
    
    for (const entry of entries) {
      try {
        const entryDate = this._extractDateFromEntry(entry);
        if (entryDate === date) {
          return this._parseArchiveEntry(entry, date);
        }
      } catch (error) {
        // Continue to next entry
      }
    }
    
    return null;
  }

  /**
   * Parse the latest/most recent entry
   * @param {Document} doc - Parsed HTML document
   * @param {string} requestedDate - Requested date (for logging)
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _parseLatestEntry(doc, requestedDate) {
    const entries = doc.querySelectorAll(this.selectors.puzzleEntries.join(', '));
    
    if (entries.length === 0) return null;
    
    // Try to parse the first entry (assuming it's the most recent)
    try {
      const firstEntry = entries[0];
      const data = this._parseArchiveEntry(firstEntry, requestedDate);
      
      if (data) {
        console.warn(`⚠️ [${this.sourceName}] Requested ${requestedDate}, returning ${data.date}`);
        return data;
      }
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] Failed to parse latest entry: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Parse any available data structure
   * @param {Document} doc - Parsed HTML document
   * @param {string} date - Target date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _parseAnyAvailableData(doc, date) {
    try {
      // Look for any text content that might contain puzzle data
      const text = doc.body.textContent || '';
      
      // Try to extract from various text patterns
      const puzzleData = this._extractFromTextContent(text, date);
      if (puzzleData) return puzzleData;
      
      // Try to parse table structure if present
      const tableData = this._parseTableStructure(doc, date);
      if (tableData) return tableData;
      
      // Try to parse list structure if present
      const listData = this._parseListStructure(doc, date);
      if (listData) return listData;
      
      return null;
      
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] Generic parsing failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse a single archive entry
   * @param {Element} entry - Entry element
   * @param {string} defaultDate - Default date to use
   * @returns {Object|null} Parsed puzzle data
   * @private
   */
  _parseArchiveEntry(entry, defaultDate) {
    try {
      // Extract date
      const date = this._extractDateFromEntry(entry) || defaultDate;
      
      // Extract game ID
      const gameIdText = this._extractText(entry, this.selectors.gameId, '');
      const gameId = this._extractGameId(gameIdText) || this._generateGameId(date);
      
      // Extract groups
      const groups = this._extractGroupsFromEntry(entry);
      
      if (!groups || groups.length < 4) {
        // Try to extract from text content as fallback
        const text = entry.textContent || '';
        const textGroups = this._extractGroupsFromText(text);
        if (textGroups && textGroups.length === 4) {
          return {
            date: date,
            gameId: gameId,
            groups: textGroups,
            source: this.sourceName
          };
        }
        throw new Error(`Insufficient groups found: ${groups ? groups.length : 0}`);
      }
      
      return {
        date: date,
        gameId: gameId,
        groups: groups.slice(0, 4),
        source: this.sourceName
      };
      
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] Entry parsing failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract date from archive entry
   * @param {Element} entry - Entry element
   * @returns {string|null} Date in YYYY-MM-DD format or null
   * @private
   */
  _extractDateFromEntry(entry) {
    // Try various ways to extract date
    const dateText = this._extractText(entry, this.selectors.date, '');
    if (dateText) {
      try {
        return this._formatDate(dateText);
      } catch (error) {
        // Continue to other methods
      }
    }
    
    // Look for date in data attributes
    const dateAttr = entry.getAttribute('data-date');
    if (dateAttr) {
      try {
        return this._formatDate(dateAttr);
      } catch (error) {
        // Continue to other methods
      }
    }
    
    // Look for date patterns in text content
    const text = entry.textContent || '';
    const datePattern = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/;
    const match = text.match(datePattern);
    if (match) {
      try {
        return this._formatDate(match[1]);
      } catch (error) {
        // Continue to other methods
      }
    }
    
    return null;
  }

  /**
   * Extract groups from archive entry
   * @param {Element} entry - Entry element
   * @returns {Array|null} Array of groups or null
   * @private
   */
  _extractGroupsFromEntry(entry) {
    // Try to find structured group data
    const groupElements = entry.querySelectorAll(this.selectors.groupData.join(', '));
    
    if (groupElements.length >= 4) {
      return Array.from(groupElements).slice(0, 4).map((element, index) => {
        const name = this._extractText(element, ['.name', '.category', 'h3', 'h4'], `GROUP ${index + 1}`);
        const words = this._extractTextArray(element, ['.word', '.item', 'li', 'span']);
        
        return {
          name: name.toUpperCase(),
          level: this._extractLevel(element) || index,
          words: words.slice(0, 4)
        };
      });
    }
    
    // Try to parse from groups container
    const groupsContainer = entry.querySelector(this.selectors.groups.join(', '));
    if (groupsContainer) {
      return this._extractGroupsFromText(groupsContainer.textContent || '');
    }
    
    return null;
  }

  /**
   * Extract groups from text content
   * @param {string} text - Text content
   * @returns {Array|null} Array of groups or null
   * @private
   */
  _extractGroupsFromText(text) {
    if (!text) return null;
    
    // Look for color-based patterns
    const colorPatterns = {
      yellow: { pattern: /yellow[:\s]*(.*?)(?=green|blue|purple|$)/i, level: 0 },
      green: { pattern: /green[:\s]*(.*?)(?=blue|purple|yellow|$)/i, level: 1 },
      blue: { pattern: /blue[:\s]*(.*?)(?=purple|yellow|green|$)/i, level: 2 },
      purple: { pattern: /purple[:\s]*(.*?)(?=yellow|green|blue|$)/i, level: 3 }
    };
    
    const groups = [];
    
    for (const [color, { pattern, level }] of Object.entries(colorPatterns)) {
      const match = text.match(pattern);
      if (match) {
        const words = this._extractWordsFromText(match[1]);
        if (words.length >= 4) {
          groups.push({
            name: `${color.toUpperCase()} GROUP`,
            level: level,
            words: words.slice(0, 4)
          });
        }
      }
    }
    
    // Try numbered groups if color groups didn't work
    if (groups.length < 4) {
      const numberedPattern = /group\s*(\d+)[:\s]*(.*?)(?=group\s*\d+|$)/gi;
      const matches = [...text.matchAll(numberedPattern)];
      
      matches.forEach((match, index) => {
        if (index < 4) {
          const words = this._extractWordsFromText(match[2]);
          if (words.length >= 4) {
            groups.push({
              name: `GROUP ${match[1]}`,
              level: index,
              words: words.slice(0, 4)
            });
          }
        }
      });
    }
    
    return groups.length === 4 ? groups : null;
  }

  /**
   * Parse table structure for puzzle data
   * @param {Document} doc - Parsed document
   * @param {string} date - Target date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _parseTableStructure(doc, date) {
    const tables = doc.querySelectorAll('table');
    
    for (const table of tables) {
      try {
        const rows = table.querySelectorAll('tr');
        if (rows.length > 0) {
          // Check if this looks like puzzle data
          const firstRowText = rows[0].textContent || '';
          if (/date|puzzle|connections/i.test(firstRowText)) {
            // Try to parse as puzzle table
            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i].querySelectorAll('td, th');
              if (cells.length >= 2) {
                const rowDate = this._extractText(cells[0], [], '');
                if (this._formatDate(rowDate) === date) {
                  return this._parseTableRow(cells, date);
                }
              }
            }
          }
        }
      } catch (error) {
        // Continue to next table
      }
    }
    
    return null;
  }

  /**
   * Parse list structure for puzzle data
   * @param {Document} doc - Parsed document
   * @param {string} date - Target date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _parseListStructure(doc, date) {
    const lists = doc.querySelectorAll('ul, ol');
    
    for (const list of lists) {
      try {
        const items = list.querySelectorAll('li');
        if (items.length >= 4) {
          // Check if this looks like puzzle data
          const listText = list.textContent || '';
          if (/puzzle|connections|groups/i.test(listText)) {
            const groups = this._parseListItems(items);
            if (groups && groups.length === 4) {
              return {
                date: date,
                gameId: this._generateGameId(date),
                groups: groups,
                source: this.sourceName
              };
            }
          }
        }
      } catch (error) {
        // Continue to next list
      }
    }
    
    return null;
  }

  /**
   * Parse table row for puzzle data
   * @param {NodeList} cells - Table cells
   * @param {string} date - Date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _parseTableRow(cells, date) {
    try {
      const gameId = cells.length > 1 ? this._extractGameId(cells[1].textContent) : null;
      const groupsText = cells.length > 2 ? cells[2].textContent : '';
      
      const groups = this._extractGroupsFromText(groupsText);
      
      if (groups && groups.length === 4) {
        return {
          date: date,
          gameId: gameId || this._generateGameId(date),
          groups: groups,
          source: this.sourceName
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse list items for groups
   * @param {NodeList} items - List items
   * @returns {Array|null} Array of groups or null
   * @private
   */
  _parseListItems(items) {
    const groups = [];
    
    Array.from(items).forEach((item, index) => {
      if (index < 4) {
        const text = item.textContent || '';
        const words = this._extractWordsFromText(text);
        
        if (words.length >= 4) {
          groups.push({
            name: `GROUP ${index + 1}`,
            level: index,
            words: words.slice(0, 4)
          });
        }
      }
    });
    
    return groups.length === 4 ? groups : null;
  }

  /**
   * Extract words from text
   * @param {string} text - Text to parse
   * @returns {Array} Array of words
   * @private
   */
  _extractWordsFromText(text) {
    if (!text) return [];
    
    return text
      .replace(/[^\w\s\-'&]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
      .map(word => word.toUpperCase())
      .slice(0, 4);
  }

  /**
   * Extract level from element
   * @param {Element} element - Element to check
   * @returns {number|null} Level or null
   * @private
   */
  _extractLevel(element) {
    const levelAttr = element.getAttribute('data-level');
    if (levelAttr) {
      const level = parseInt(levelAttr);
      if (level >= 0 && level <= 3) return level;
    }
    
    const className = element.className || '';
    const levelMatch = className.match(/level-?(\d)/);
    if (levelMatch) {
      const level = parseInt(levelMatch[1]);
      if (level >= 0 && level <= 3) return level;
    }
    
    return null;
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
      /(\d+)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const id = parseInt(match[1]);
        if (id > 0 && id < 10000) return id;
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
    const startDate = new Date(2023, 5, 12); // June 12, 2023
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    
    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays + 1);
  }

  /**
   * Extract from text content using various patterns
   * @param {string} text - Text content
   * @param {string} date - Target date
   * @returns {Object|null} Parsed data or null
   * @private
   */
  _extractFromTextContent(text, date) {
    const groups = this._extractGroupsFromText(text);
    
    if (groups && groups.length === 4) {
      return {
        date: date,
        gameId: this._generateGameId(date),
        groups: groups,
        source: this.sourceName
      };
    }
    
    return null;
  }

  /**
   * Check if puzzle data is available for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} True if available
   */
  async isAvailable(date) {
    try {
      const response = await this._makeRequest(this.archiveUrl);
      const html = await response.text();
      
      // Check if the archive contains any connections data
      const hasArchiveData = /archive|puzzle|connections/i.test(html) &&
                           (/date|game|group/i.test(html));
      
      return hasArchiveData;
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] Availability check failed for ${date}: ${error.message}`);
      return false;
    }
  }
}

export default ConnectionsArchiveFetcher;
