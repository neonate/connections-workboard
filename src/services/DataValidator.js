/**
 * Browser-compatible data validation module for NYT Connections puzzle data.
 * Extracted from scripts/update-puzzle-data.js for use in the fetcher system.
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the data passed validation.
 * @property {string[]} errors - Array of validation error messages.
 * @property {string[]} warnings - Array of validation warning messages.
 */

/**
 * @typedef {Object} PuzzleGroup
 * @property {string} name - The category name of the group.
 * @property {number} level - The difficulty level of the group (0-3).
 * @property {string[]} words - An array of 4 words belonging to the group.
 */

/**
 * @typedef {Object} PuzzleDataInput
 * @property {string} date - The date of the puzzle in YYYY-MM-DD format.
 * @property {number} gameId - The unique game ID for the puzzle.
 * @property {PuzzleGroup[]} groups - An array of 4 puzzle groups.
 * @property {string} [source] - The source from which the puzzle data was fetched.
 */

/**
 * Data validator for NYT Connections puzzle data.
 * Provides comprehensive validation with detailed error reporting.
 */
export class DataValidator {
  /**
   * Validates a date string in YYYY-MM-DD format.
   * @param {string} date - The date string to validate.
   * @param {boolean} [allowFuture=false] - Whether to allow future dates.
   * @returns {ValidationResult} Validation result.
   */
  static validateDate(date, allowFuture = false) {
    const errors = [];
    const warnings = [];

    try {
      // Check format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        errors.push(`Invalid date format: "${date}". Expected YYYY-MM-DD format.`);
        return { isValid: false, errors, warnings };
      }

      // Check if date exists (avoid timezone issues)
      const [year, month, day] = date.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      
      // Verify the date is what we expect (handles invalid dates like Feb 30)
      if (parsedDate.getFullYear() !== year || 
          parsedDate.getMonth() !== month - 1 || 
          parsedDate.getDate() !== day) {
        errors.push(`Invalid date: "${date}". Date does not exist.`);
        return { isValid: false, errors, warnings };
      }

      // Check if date is in the future (optional)
      if (!allowFuture) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const testDate = new Date(year, month - 1, day);
        if (testDate > today) {
          errors.push(`Date "${date}" is in the future. Future puzzles are not typically available.`);
        }
      }

      // Check if date is too old (NYT Connections started in June 2023)
      const earliestDate = new Date(2023, 5, 12); // June 12, 2023
      if (parsedDate < earliestDate) {
        warnings.push(`Date "${date}" is before NYT Connections launched (June 12, 2023). Data may not be available.`);
      }

      return { isValid: errors.length === 0, errors, warnings };
    } catch (error) {
      errors.push(`Date validation error: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validates a game ID.
   * @param {any} gameId - The game ID to validate.
   * @returns {ValidationResult} Validation result.
   */
  static validateGameId(gameId) {
    const errors = [];
    const warnings = [];

    if (typeof gameId !== 'number' || !Number.isInteger(gameId) || gameId <= 0) {
      errors.push(`Invalid game ID: "${gameId}". Must be a positive integer.`);
      return { isValid: false, errors, warnings };
    }

    // Check reasonable range (NYT Connections started around game ID 1)
    if (gameId > 10000) {
      warnings.push(`Game ID ${gameId} seems unusually high. Please verify.`);
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * Validates a single puzzle group.
   * @param {any} group - The group to validate.
   * @param {number} groupIndex - The index of the group (for error messages).
   * @returns {ValidationResult} Validation result.
   */
  static validateGroup(group, groupIndex) {
    const errors = [];
    const warnings = [];

    if (!group || typeof group !== 'object') {
      errors.push(`Group ${groupIndex + 1}: Must be an object.`);
      return { isValid: false, errors, warnings };
    }

    // Validate name
    if (!group.name || typeof group.name !== 'string' || group.name.trim() === '') {
      errors.push(`Group ${groupIndex + 1}: Missing or invalid name.`);
    } else {
      // Check name length
      if (group.name.length > 50) {
        warnings.push(`Group ${groupIndex + 1}: Name is quite long (${group.name.length} characters).`);
      }
    }

    // Validate level
    if (typeof group.level !== 'number' || !Number.isInteger(group.level) || group.level < 0 || group.level > 3) {
      errors.push(`Group ${groupIndex + 1}: Invalid level "${group.level}". Must be 0, 1, 2, or 3.`);
    }

    // Validate words array
    if (!Array.isArray(group.words)) {
      errors.push(`Group ${groupIndex + 1}: Words must be an array.`);
    } else if (group.words.length !== 4) {
      errors.push(`Group ${groupIndex + 1}: Must have exactly 4 words. Found ${group.words.length}.`);
    } else {
      // Validate each word
      group.words.forEach((word, wordIndex) => {
        if (!word || typeof word !== 'string' || word.trim() === '') {
          errors.push(`Group ${groupIndex + 1}, Word ${wordIndex + 1}: Missing or invalid word.`);
        } else {
          // Check word length
          if (word.length > 30) {
            warnings.push(`Group ${groupIndex + 1}, Word ${wordIndex + 1}: Word is quite long (${word.length} characters).`);
          }
          // Check for unusual characters
          if (/[^\w\s\-'&]/.test(word)) {
            warnings.push(`Group ${groupIndex + 1}, Word ${wordIndex + 1}: Contains unusual characters: "${word}".`);
          }
        }
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates complete puzzle data.
   * @param {any} puzzleData - The puzzle data to validate.
   * @param {Object} [options] - Validation options.
   * @param {boolean} [options.allowFutureDates=false] - Whether to allow future dates.
   * @param {boolean} [options.strict=false] - Whether to treat warnings as errors.
   * @returns {ValidationResult} Comprehensive validation result.
   */
  static validatePuzzleData(puzzleData, options = {}) {
    const { allowFutureDates = false, strict = false } = options;
    const errors = [];
    const warnings = [];

    // Basic structure validation
    if (!puzzleData || typeof puzzleData !== 'object') {
      errors.push('Puzzle data must be an object.');
      return { isValid: false, errors, warnings };
    }

    if (!puzzleData.date || !puzzleData.gameId || !puzzleData.groups) {
      errors.push('Missing required fields: date, gameId, or groups.');
      return { isValid: false, errors, warnings };
    }

    // Validate date
    const dateResult = this.validateDate(puzzleData.date, allowFutureDates);
    errors.push(...dateResult.errors);
    warnings.push(...dateResult.warnings);

    // Validate game ID
    const gameIdResult = this.validateGameId(puzzleData.gameId);
    errors.push(...gameIdResult.errors);
    warnings.push(...gameIdResult.warnings);

    // Validate groups array
    if (!Array.isArray(puzzleData.groups)) {
      errors.push('Groups must be an array.');
    } else if (puzzleData.groups.length !== 4) {
      errors.push(`Must have exactly 4 groups. Found ${puzzleData.groups.length}.`);
    } else {
      // Validate each group
      puzzleData.groups.forEach((group, index) => {
        const groupResult = this.validateGroup(group, index);
        errors.push(...groupResult.errors);
        warnings.push(...groupResult.warnings);
      });

      // Check for duplicate words across all groups
      if (errors.length === 0) { // Only check if groups are valid
        const allWords = puzzleData.groups.flatMap(group => group.words || []);
        const uniqueWords = new Set(allWords.map(word => word.toLowerCase()));
        if (uniqueWords.size !== allWords.length) {
          const duplicates = allWords.filter((word, index) => 
            allWords.findIndex(w => w.toLowerCase() === word.toLowerCase()) !== index
          );
          errors.push(`Duplicate words found: ${[...new Set(duplicates)].join(', ')}`);
        }

        // Check for duplicate group names
        const groupNames = puzzleData.groups.map(group => group.name || '');
        const uniqueGroupNames = new Set(groupNames.map(name => name.toLowerCase()));
        if (uniqueGroupNames.size !== groupNames.length) {
          const duplicates = groupNames.filter((name, index) => 
            groupNames.findIndex(n => n.toLowerCase() === name.toLowerCase()) !== index
          );
          errors.push(`Duplicate group names found: ${[...new Set(duplicates)].join(', ')}`);
        }

        // Check level distribution (should be 0, 1, 2, 3)
        const levels = puzzleData.groups.map(group => group.level).sort();
        const expectedLevels = [0, 1, 2, 3];
        if (JSON.stringify(levels) !== JSON.stringify(expectedLevels)) {
          warnings.push(`Unusual level distribution: [${levels.join(', ')}]. Expected: [0, 1, 2, 3].`);
        }
      }
    }

    // Validate source (optional field)
    if (puzzleData.source && typeof puzzleData.source !== 'string') {
      warnings.push('Source field should be a string if provided.');
    }

    const finalErrors = strict ? [...errors, ...warnings] : errors;
    return { 
      isValid: finalErrors.length === 0, 
      errors: finalErrors,
      warnings: strict ? [] : warnings 
    };
  }

  /**
   * Sanitizes and normalizes puzzle data.
   * @param {any} puzzleData - The puzzle data to sanitize.
   * @returns {PuzzleDataInput} Sanitized puzzle data.
   */
  static sanitizePuzzleData(puzzleData) {
    if (!puzzleData || typeof puzzleData !== 'object') {
      throw new Error('Invalid puzzle data provided for sanitization.');
    }

    return {
      date: String(puzzleData.date || '').trim(),
      gameId: parseInt(puzzleData.gameId) || 0,
      groups: (puzzleData.groups || []).map((group, index) => {
        if (!group || typeof group !== 'object') {
          throw new Error(`Group ${index + 1} is invalid.`);
        }
        return {
          name: String(group.name || '').trim(),
          level: parseInt(group.level) || 0,
          words: (group.words || []).map(word => String(word || '').trim())
        };
      }),
      source: puzzleData.source ? String(puzzleData.source).trim() : undefined
    };
  }

  /**
   * Validates and sanitizes puzzle data in one operation.
   * @param {any} puzzleData - The puzzle data to validate and sanitize.
   * @param {Object} [options] - Validation options.
   * @returns {{isValid: boolean, data: PuzzleDataInput, errors: string[], warnings: string[]}} 
   */
  static validateAndSanitize(puzzleData, options = {}) {
    try {
      const sanitized = this.sanitizePuzzleData(puzzleData);
      const validation = this.validatePuzzleData(sanitized, options);
      
      return {
        isValid: validation.isValid,
        data: sanitized,
        errors: validation.errors,
        warnings: validation.warnings
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        errors: [error.message],
        warnings: []
      };
    }
  }

  /**
   * Creates a detailed validation report.
   * @param {ValidationResult} result - The validation result.
   * @returns {string} A formatted validation report.
   */
  static createValidationReport(result) {
    const lines = [];
    
    lines.push(`Validation Result: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (result.errors.length > 0) {
      lines.push('\n🚨 ERRORS:');
      result.errors.forEach(error => lines.push(`  • ${error}`));
    }
    
    if (result.warnings.length > 0) {
      lines.push('\n⚠️ WARNINGS:');
      result.warnings.forEach(warning => lines.push(`  • ${warning}`));
    }
    
    if (result.isValid && result.errors.length === 0 && result.warnings.length === 0) {
      lines.push('\n🎉 Perfect! No issues found.');
    }
    
    return lines.join('\n');
  }
}

export default DataValidator;
