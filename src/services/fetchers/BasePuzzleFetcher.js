/**
 * Abstract base class for puzzle data fetchers
 * Defines the standard interface that all data source implementations must follow
 */

/**
 * Base class for all puzzle data fetchers
 * @abstract
 */
export class BasePuzzleFetcher {
  /**
   * Create a new puzzle fetcher instance
   * @param {string} sourceName - Human-readable name for this data source
   * @param {Object} config - Configuration options for this fetcher
   */
  constructor(sourceName, config = {}) {
    if (new.target === BasePuzzleFetcher) {
      throw new Error('BasePuzzleFetcher is abstract and cannot be instantiated directly');
    }
    
    this.sourceName = sourceName;
    this.config = {
      timeout: 10000, // 10 second default timeout
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
    
    // Track fetcher statistics
    this.stats = {
      totalAttempts: 0,
      successfulFetches: 0,
      failures: 0,
      averageResponseTime: 0,
      lastSuccessful: null,
      lastFailure: null
    };
  }

  /**
   * Fetches puzzle data for a specific date.
   * This method performs validation and statistics tracking around the _executeFetch method.
   * @param {string} date - Date in YYYY-MM-DD format.
   * @returns {Promise<Object>} A promise that resolves with the puzzle data.
   * @throws {Error} If the fetch operation fails or data is invalid.
   */
  async fetchPuzzle(date) {
    this._validateDate(date);
    const startTime = performance.now();
    let success = false;
    let error = null;
    let puzzleData = null;

    try {
      puzzleData = await this._executeFetch(date);
      this._validateFetchedData(puzzleData);
      success = true;
      return puzzleData;
    } catch (e) {
      error = e;
      throw e;
    } finally {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this._updateStats(success, responseTime, error);
    }
  }

  /**
   * Abstract method to be implemented by subclasses for the actual fetching logic.
   * @param {string} date - Date in YYYY-MM-DD format.
   * @returns {Promise<Object>} Raw puzzle data from the source.
   * @protected
   * @abstract
   */
  async _executeFetch(_date) {
    throw new Error("Method '_executeFetch()' must be implemented by subclasses.");
  }

  /**
   * Check if this fetcher can provide data for the given date
   * @abstract
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} True if data is available for this date
   */
  async isAvailable(_date) {
    throw new Error('isAvailable() must be implemented by subclass');
  }

  /**
   * Get the human-readable name of this data source
   * @returns {string} Source name
   */
  getSourceName() {
    return this.sourceName;
  }

  /**
   * Get fetcher statistics
   * @returns {Object} Statistics object with performance metrics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get the success rate as a percentage
   * @returns {number} Success rate (0-100)
   */
  getSuccessRate() {
    if (this.stats.totalAttempts === 0) return 0;
    return (this.stats.successfulFetches / this.stats.totalAttempts) * 100;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalAttempts: 0,
      successfulFetches: 0,
      failures: 0,
      averageResponseTime: 0,
      lastSuccessful: null,
      lastFailure: null
    };
  }

  /**
   * Validate date format
   * @protected
   * @param {string} date - Date string to validate
   * @throws {Error} If date format is invalid
   */
  _validateDate(date) {
    if (!date || typeof date !== 'string') {
      throw new Error('Date must be a string');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }

    // Check if date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate > today) {
      throw new Error(`Cannot fetch puzzle for future date: ${date}`);
    }

    // Check if date is before NYT Connections launch (June 12, 2023)
    const launchDate = new Date('2023-06-12');
    if (parsedDate < launchDate) {
      throw new Error(`Cannot fetch puzzle for dates before NYT Connections launch (June 12, 2023): ${date}`);
    }
  }

  /**
   * Update statistics after a fetch attempt
   * @protected
   * @param {boolean} success - Whether the fetch was successful
   * @param {number} responseTime - Response time in milliseconds
   * @param {Error} [error] - Error object if fetch failed
   */
  _updateStats(success, responseTime, error = null) {
    this.stats.totalAttempts++;
    
    if (success) {
      this.stats.successfulFetches++;
      this.stats.lastSuccessful = new Date().toISOString();
    } else {
      this.stats.failures++;
      this.stats.lastFailure = {
        timestamp: new Date().toISOString(),
        error: error ? error.message : 'Unknown error'
      };
    }

    // Update average response time
    const totalTime = this.stats.averageResponseTime * (this.stats.totalAttempts - 1) + responseTime;
    this.stats.averageResponseTime = totalTime / this.stats.totalAttempts;
  }

  /**
   * Validates the structure and content of fetched puzzle data.
   * @param {Object} data - The fetched puzzle data.
   * @protected
   */
  _validateFetchedData(data) {
    // This will be implemented by a separate DataValidator module in Phase 2
    // For now, a basic check
    if (!data || !data.date || !data.gameId || !Array.isArray(data.groups) || data.groups.length !== 4) {
      throw new Error(`Invalid puzzle data structure from ${this.sourceName}.`);
    }
    // Further detailed validation will be done by DataValidator
  }



  /**
   * Implement retry logic with exponential backoff
   * @protected
   * @param {Function} operation - Async operation to retry
   * @param {string} context - Context for logging
   * @returns {Promise<any>} Result of the operation
   */
  async _withRetry(operation, context = 'operation') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.config.retryAttempts) {
          console.error(`❌ [${this.sourceName}] ${context} failed after ${attempt} attempts: ${error.message}`);
          break;
        }
        
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`⚠️ [${this.sourceName}] ${context} attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

export default BasePuzzleFetcher;
