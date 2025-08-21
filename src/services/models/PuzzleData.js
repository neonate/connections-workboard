/**
 * Standardized puzzle data models and validation schemas
 * Ensures consistent data format across all sources and components
 */

/**
 * Puzzle group data structure
 * @typedef {Object} PuzzleGroup
 * @property {string} name - Category name (e.g., "TYPES OF PASTA")
 * @property {number} level - Difficulty level (0=yellow, 1=green, 2=blue, 3=purple)
 * @property {string[]} words - Array of 4 words in this group
 */

/**
 * Complete puzzle data structure
 * @typedef {Object} PuzzleData
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {number} gameId - NYT Connections game ID
 * @property {PuzzleGroup[]} groups - Array of 4 puzzle groups
 * @property {string[]} words - Flat array of all 16 words (computed)
 * @property {string} category - Concatenated category names (computed)
 * @property {string} source - Data source name
 * @property {string} [sourceUrl] - Original URL where data was fetched
 * @property {string} fetchedAt - ISO timestamp when data was fetched
 */

/**
 * Utility class for working with puzzle data
 */
export class PuzzleDataModel {
  /**
   * Create a new puzzle data instance
   * @param {Object} rawData - Raw puzzle data from any source
   */
  constructor(rawData = {}) {
    this.data = this._normalize(rawData);
  }

  /**
   * Validate puzzle data structure
   * @param {Object} data - Data to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validate(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Puzzle data must be an object');
    }

    // Required fields
    const requiredFields = ['date', 'gameId', 'groups'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate date format
    if (!data.date || typeof data.date !== 'string') {
      throw new Error('Date must be a string');
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    const parsedDate = new Date(data.date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date: ${data.date}`);
    }

    // Validate game ID
    if (!Number.isInteger(data.gameId) || data.gameId <= 0) {
      throw new Error(`Invalid game ID: ${data.gameId}. Must be a positive integer.`);
    }

    // Validate groups
    if (!Array.isArray(data.groups) || data.groups.length !== 4) {
      throw new Error(`Must have exactly 4 groups. Found ${data.groups?.length || 0}.`);
    }

    // Validate each group
    data.groups.forEach((group, index) => {
      PuzzleDataModel._validateGroup(group, index);
    });

    // Check for duplicate words across all groups
    const allWords = data.groups.flatMap(group => group.words);
    const uniqueWords = new Set(allWords.map(word => word.toLowerCase()));
    if (uniqueWords.size !== allWords.length) {
      const duplicates = allWords.filter((word, index) => 
        allWords.findIndex(w => w.toLowerCase() === word.toLowerCase()) !== index
      );
      throw new Error(`Duplicate words found: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check for duplicate group names
    const groupNames = data.groups.map(group => group.name);
    const uniqueGroupNames = new Set(groupNames.map(name => name.toLowerCase()));
    if (uniqueGroupNames.size !== groupNames.length) {
      const duplicates = groupNames.filter((name, index) => 
        groupNames.findIndex(n => n.toLowerCase() === name.toLowerCase()) !== index
      );
      throw new Error(`Duplicate group names found: ${[...new Set(duplicates)].join(', ')}`);
    }

    return true;
  }

  /**
   * Validate a single puzzle group
   * @private
   * @param {Object} group - Group to validate
   * @param {number} groupIndex - Index for error reporting
   */
  static _validateGroup(group, groupIndex) {
    if (!group || typeof group !== 'object') {
      throw new Error(`Group ${groupIndex + 1}: Must be an object`);
    }

    // Validate name
    if (!group.name || typeof group.name !== 'string' || group.name.trim() === '') {
      throw new Error(`Group ${groupIndex + 1}: Missing or invalid name`);
    }

    // Validate level
    if (!Number.isInteger(group.level) || group.level < 0 || group.level > 3) {
      throw new Error(`Group ${groupIndex + 1}: Invalid level ${group.level}. Must be 0, 1, 2, or 3.`);
    }

    // Validate words
    if (!Array.isArray(group.words) || group.words.length !== 4) {
      throw new Error(`Group ${groupIndex + 1}: Must have exactly 4 words. Found ${group.words?.length || 0}.`);
    }

    group.words.forEach((word, wordIndex) => {
      if (!word || typeof word !== 'string' || word.trim() === '') {
        throw new Error(`Group ${groupIndex + 1}, Word ${wordIndex + 1}: Missing or invalid word`);
      }
    });
  }

  /**
   * Normalize puzzle data to standard format
   * @private
   * @param {Object} rawData - Raw data from any source
   * @returns {Object} Normalized puzzle data
   */
  _normalize(rawData) {
    // Validate first
    PuzzleDataModel.validate(rawData);

    // Create normalized structure
    const normalized = {
      date: rawData.date,
      gameId: rawData.gameId,
      groups: rawData.groups.map(group => ({
        name: group.name.trim(),
        level: group.level,
        words: group.words.map(word => word.trim())
      })),
      source: rawData.source || 'unknown',
      sourceUrl: rawData.sourceUrl || null,
      fetchedAt: rawData.fetchedAt || new Date().toISOString()
    };

    // Add computed fields
    normalized.words = normalized.groups.flatMap(group => group.words);
    normalized.category = normalized.groups.map(group => group.name).join(' | ');

    return normalized;
  }

  /**
   * Get the puzzle data
   * @returns {Object} Normalized puzzle data
   */
  getData() {
    return { ...this.data };
  }

  /**
   * Get words for a specific difficulty level
   * @param {number} level - Difficulty level (0-3)
   * @returns {string[]} Words at that level
   */
  getWordsByLevel(level) {
    const group = this.data.groups.find(g => g.level === level);
    return group ? [...group.words] : [];
  }

  /**
   * Get group by level
   * @param {number} level - Difficulty level (0-3)
   * @returns {Object|null} Group object or null
   */
  getGroupByLevel(level) {
    const group = this.data.groups.find(g => g.level === level);
    return group ? { ...group } : null;
  }

  /**
   * Get all words as a flat array
   * @returns {string[]} Array of all 16 words
   */
  getAllWords() {
    return [...this.data.words];
  }

  /**
   * Get all category names
   * @returns {string[]} Array of category names
   */
  getCategoryNames() {
    return this.data.groups.map(group => group.name);
  }

  /**
   * Check if this puzzle has a specific word
   * @param {string} word - Word to search for
   * @returns {boolean} True if word exists in puzzle
   */
  hasWord(word) {
    const searchTerm = word.toLowerCase();
    return this.data.words.some(w => w.toLowerCase() === searchTerm);
  }

  /**
   * Find which group a word belongs to
   * @param {string} word - Word to search for
   * @returns {Object|null} Group object or null if not found
   */
  findGroupForWord(word) {
    const searchTerm = word.toLowerCase();
    
    for (const group of this.data.groups) {
      if (group.words.some(w => w.toLowerCase() === searchTerm)) {
        return { ...group };
      }
    }
    
    return null;
  }

  /**
   * Convert to format compatible with existing puzzleData.js
   * @returns {Object} Data in legacy format
   */
  toLegacyFormat() {
    return {
      date: this.data.date,
      gameId: this.data.gameId,
      groups: this.data.groups.map(group => ({
        name: group.name,
        level: group.level,
        words: [...group.words]
      })),
      words: [...this.data.words],
      category: this.data.category,
      source: this.data.source
    };
  }

  /**
   * Convert to JSON string
   * @param {boolean} [pretty=false] - Whether to format with indentation
   * @returns {string} JSON representation
   */
  toJSON(pretty = false) {
    return JSON.stringify(this.data, null, pretty ? 2 : 0);
  }

  /**
   * Create PuzzleDataModel from JSON string
   * @param {string} jsonString - JSON string to parse
   * @returns {PuzzleDataModel} New instance
   */
  static fromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return new PuzzleDataModel(data);
    } catch (error) {
      throw new Error(`Failed to parse puzzle data JSON: ${error.message}`);
    }
  }

  /**
   * Create PuzzleDataModel from legacy format (existing puzzleData.js)
   * @param {Object} legacyData - Data in legacy format
   * @returns {PuzzleDataModel} New instance
   */
  static fromLegacyFormat(legacyData) {
    // Legacy format is actually the same as our standard format
    return new PuzzleDataModel(legacyData);
  }

  /**
   * Merge metadata from a fetch operation
   * @param {Object} metadata - Metadata to merge
   * @param {string} metadata.source - Source name
   * @param {string} [metadata.sourceUrl] - Source URL
   * @param {string} [metadata.fetchedAt] - Fetch timestamp
   * @returns {PuzzleDataModel} New instance with merged metadata
   */
  withMetadata(metadata) {
    const updatedData = {
      ...this.data,
      source: metadata.source,
      sourceUrl: metadata.sourceUrl || this.data.sourceUrl,
      fetchedAt: metadata.fetchedAt || new Date().toISOString()
    };
    
    return new PuzzleDataModel(updatedData);
  }
}

/**
 * Level constants for puzzle difficulty
 */
export const PUZZLE_LEVELS = {
  YELLOW: 0,
  GREEN: 1,
  BLUE: 2,
  PURPLE: 3
};

/**
 * Level names for display
 */
export const LEVEL_NAMES = {
  [PUZZLE_LEVELS.YELLOW]: 'Yellow (Easiest)',
  [PUZZLE_LEVELS.GREEN]: 'Green',
  [PUZZLE_LEVELS.BLUE]: 'Blue',
  [PUZZLE_LEVELS.PURPLE]: 'Purple (Hardest)'
};

/**
 * Level colors for UI
 */
export const LEVEL_COLORS = {
  [PUZZLE_LEVELS.YELLOW]: '#f7dc6f',
  [PUZZLE_LEVELS.GREEN]: '#a9dfbf',
  [PUZZLE_LEVELS.BLUE]: '#85c1e9',
  [PUZZLE_LEVELS.PURPLE]: '#d7bde2'
};
