import BasePuzzleFetcher from './BasePuzzleFetcher';
import { getPuzzleByDate, getAvailableDates } from '../puzzleData';
// import { PuzzleData } from '../models/PuzzleData';

/**
 * Static data source adapter that wraps the existing static puzzle data system.
 * Provides backward compatibility while implementing the standard fetcher interface.
 */
class StaticDataFetcher extends BasePuzzleFetcher {
  /**
   * Creates a new StaticDataFetcher instance.
   */
  constructor() {
    super('StaticData');
  }

  /**
   * Fetches puzzle data from the static data source.
   * @param {string} date - Date in YYYY-MM-DD format.
   * @returns {Promise<PuzzleData>} A promise that resolves with the puzzle data.
   * @throws {Error} If the puzzle is not found in static data.
   */
  async _executeFetch(date) {
    try {
      console.log(`🔍 [${this.sourceName}] Looking up static data for ${date}`);
      
      const staticPuzzle = getPuzzleByDate(date);
      
      if (!staticPuzzle) {
        throw new Error(`Puzzle not found in static data for date ${date}`);
      }

      // Convert static data format to standardized format
      const puzzleData = {
        date: staticPuzzle.date,
        gameId: staticPuzzle.gameId,
        groups: staticPuzzle.groups.map(group => ({
          name: group.name,
          level: group.level,
          words: [...group.words], // Ensure array is copied
          hint: group.hint || group.name // Include hint if available, fallback to name
        })),
        source: this.sourceName
      };

      console.log(`✅ [${this.sourceName}] Successfully loaded static data for ${date}`);
      return puzzleData;
    } catch (error) {
      console.error(`❌ [${this.sourceName}] Failed to load static data for ${date}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checks if puzzle data is available in static storage for a specific date.
   * @param {string} date - Date in YYYY-MM-DD format.
   * @returns {Promise<boolean>} A promise that resolves to true if available, false otherwise.
   */
  async isAvailable(date) {
    try {
      const availableDates = getAvailableDates();
      const isAvailable = availableDates.includes(date);
      
      console.log(`🔍 [${this.sourceName}] Availability check for ${date}: ${isAvailable ? 'available' : 'not available'}`);
      return isAvailable;
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] Error checking availability for ${date}: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets all available puzzle dates from static data.
   * @returns {Promise<string[]>} Array of available dates in YYYY-MM-DD format.
   */
  async getAvailableDates() {
    try {
      const dates = getAvailableDates();
      console.log(`📊 [${this.sourceName}] Found ${dates.length} available puzzle dates`);
      return dates;
    } catch (error) {
      console.error(`❌ [${this.sourceName}] Failed to get available dates: ${error.message}`);
      return [];
    }
  }

  /**
   * Gets metadata about the static data source.
   * @returns {Object} Metadata including total puzzles, date range, etc.
   */
  getSourceMetadata() {
    try {
      const availableDates = getAvailableDates();
      const sortedDates = [...availableDates].sort();
      
      return {
        name: this.sourceName,
        type: 'static',
        totalPuzzles: availableDates.length,
        dateRange: {
          earliest: sortedDates[0] || null,
          latest: sortedDates[sortedDates.length - 1] || null
        },
        lastUpdated: new Date().toISOString(),
        reliability: 1.0, // Static data is always reliable
        averageResponseTime: 0 // Instant access
      };
    } catch (error) {
      console.error(`❌ [${this.sourceName}] Failed to get source metadata: ${error.message}`);
      return {
        name: this.sourceName,
        type: 'static',
        totalPuzzles: 0,
        dateRange: { earliest: null, latest: null },
        lastUpdated: new Date().toISOString(),
        reliability: 0,
        averageResponseTime: 0
      };
    }
  }
}

export default StaticDataFetcher;
