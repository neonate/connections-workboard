/**
 * Puzzle Storage Service
 * Handles saving dynamically fetched puzzles to static data and local storage
 */

import { DataValidator } from './DataValidator.js';

/**
 * Service for managing puzzle data storage and caching
 */
class PuzzleStorageService {
  constructor() {
    this.localStorageKey = 'dynamicPuzzleCache';
    this.maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Save puzzle data to local storage cache
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} puzzleData - Puzzle data to save
   * @returns {boolean} Success status
   */
  savePuzzleToCache(date, puzzleData) {
    try {
      // Validate the puzzle data before saving
      const validation = DataValidator.validatePuzzleData(puzzleData);
      if (!validation.isValid) {
        console.error(`❌ Cannot save invalid puzzle data: ${validation.errors.join(', ')}`);
        return false;
      }

      // Get existing cache
      const cache = this.getLocalCache();
      
      // Add new puzzle with timestamp
      cache[date] = {
        puzzleData,
        savedAt: new Date().toISOString(),
        source: puzzleData.source || 'unknown'
      };

      // Save updated cache
      localStorage.setItem(this.localStorageKey, JSON.stringify(cache));
      console.log(`💾 Saved puzzle for ${date} to local cache`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to save puzzle to cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Get puzzle data from local storage cache
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object|null} Cached puzzle data or null
   */
  getPuzzleFromCache(date) {
    try {
      const cache = this.getLocalCache();
      const entry = cache[date];
      
      if (!entry) {
        return null;
      }

      // Check if cache entry is too old
      const savedAt = new Date(entry.savedAt);
      const now = new Date();
      if (now - savedAt > this.maxCacheAge) {
        console.log(`⏰ Cache entry for ${date} is expired, removing`);
        delete cache[date];
        localStorage.setItem(this.localStorageKey, JSON.stringify(cache));
        return null;
      }

      console.log(`📱 Retrieved puzzle for ${date} from local cache`);
      return {
        ...entry.puzzleData,
        fetchSource: 'cache',
        cachedAt: entry.savedAt
      };
    } catch (error) {
      console.error(`❌ Failed to get puzzle from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all cached puzzle dates
   * @returns {string[]} Array of dates with cached data
   */
  getCachedDates() {
    try {
      const cache = this.getLocalCache();
      return Object.keys(cache).sort();
    } catch (error) {
      console.error(`❌ Failed to get cached dates: ${error.message}`);
      return [];
    }
  }

  /**
   * Clear expired entries from cache
   * @returns {number} Number of entries removed
   */
  clearExpiredCache() {
    try {
      const cache = this.getLocalCache();
      const now = new Date();
      let removedCount = 0;

      Object.keys(cache).forEach(date => {
        const entry = cache[date];
        const savedAt = new Date(entry.savedAt);
        
        if (now - savedAt > this.maxCacheAge) {
          delete cache[date];
          removedCount++;
        }
      });

      if (removedCount > 0) {
        localStorage.setItem(this.localStorageKey, JSON.stringify(cache));
        console.log(`🧹 Removed ${removedCount} expired cache entries`);
      }

      return removedCount;
    } catch (error) {
      console.error(`❌ Failed to clear expired cache: ${error.message}`);
      return 0;
    }
  }

  /**
   * Clear all cached puzzle data
   * @returns {boolean} Success status
   */
  clearAllCache() {
    try {
      localStorage.removeItem(this.localStorageKey);
      console.log('🧹 Cleared all puzzle cache data');
      return true;
    } catch (error) {
      console.error(`❌ Failed to clear cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Export puzzle data in format suitable for static data
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} puzzleData - Puzzle data to export
   * @returns {string} JSON string ready for static data integration
   */
  exportPuzzleForStaticData(date, puzzleData) {
    try {
      // Validate the puzzle data
      const validation = DataValidator.validatePuzzleData(puzzleData);
      if (!validation.isValid) {
        throw new Error(`Invalid puzzle data: ${validation.errors.join(', ')}`);
      }

      // Format for static data (remove metadata)
      const exportData = {
        date: puzzleData.date,
        gameId: puzzleData.gameId,
        groups: puzzleData.groups.map(group => ({
          name: group.name,
          level: group.level,
          words: [...group.words] // Ensure array is copied
        }))
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error(`❌ Failed to export puzzle data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate instructions for manually adding puzzle to static data
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {Object} puzzleData - Puzzle data
   * @returns {string} Instructions text
   */
  generateSaveInstructions(date, puzzleData) {
    try {
      const exportData = this.exportPuzzleForStaticData(date, puzzleData);
      
      return `
📝 Instructions to add puzzle to static data:

1. Run this command in your terminal:
   node scripts/update-puzzle-data.js add --date ${date} --interactive

2. When prompted, paste this puzzle data:
${exportData}

3. Or create a file (e.g., puzzle-${date}.json) with the above content and run:
   node scripts/update-puzzle-data.js add --date ${date} --puzzle-file puzzle-${date}.json

The puzzle will be validated and added to your static dataset.
Source: ${puzzleData.source || 'dynamic fetch'}
Fetched: ${new Date().toLocaleString()}
      `.trim();
    } catch (error) {
      return `❌ Error generating instructions: ${error.message}`;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    try {
      const cache = this.getLocalCache();
      const now = new Date();
      let validEntries = 0;
      let expiredEntries = 0;
      let totalSize = 0;

      Object.values(cache).forEach(entry => {
        const savedAt = new Date(entry.savedAt);
        if (now - savedAt > this.maxCacheAge) {
          expiredEntries++;
        } else {
          validEntries++;
        }
        totalSize += JSON.stringify(entry).length;
      });

      return {
        totalEntries: Object.keys(cache).length,
        validEntries,
        expiredEntries,
        totalSizeBytes: totalSize,
        totalSizeKB: Math.round(totalSize / 1024),
        maxAgeHours: this.maxCacheAge / (60 * 60 * 1000)
      };
    } catch (error) {
      console.error(`❌ Failed to get cache stats: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Get local storage cache
   * @private
   * @returns {Object} Cache object
   */
  getLocalCache() {
    try {
      const cacheData = localStorage.getItem(this.localStorageKey);
      return cacheData ? JSON.parse(cacheData) : {};
    } catch (error) {
      console.warn(`⚠️ Failed to parse cache data, starting fresh: ${error.message}`);
      return {};
    }
  }

  /**
   * Check if browser supports local storage
   * @returns {boolean} True if local storage is available
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const puzzleStorageService = new PuzzleStorageService();
export default puzzleStorageService;

// Named exports for convenience
export const {
  savePuzzleToCache,
  getPuzzleFromCache,
  getCachedDates,
  clearExpiredCache,
  clearAllCache,
  exportPuzzleForStaticData,
  generateSaveInstructions,
  getCacheStats,
  isStorageAvailable
} = puzzleStorageService;
