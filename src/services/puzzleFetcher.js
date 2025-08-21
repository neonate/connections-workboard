/**
 * Enhanced service for fetching NYT Connections puzzle data
 * Supports both static data and dynamic fetching from external sources
 */

import { getPuzzleByDate, getLatestPuzzleDate } from './puzzleData.js';
import { PuzzleFetcherManager } from './PuzzleFetcherManager.js';
import StaticDataFetcher from './fetchers/StaticDataFetcher.js';
import BackendApiFetcher from './fetchers/BackendApiFetcher.js';
import DataValidator from './DataValidator.js';

// Initialize the fetcher manager with all available sources
let fetcherManager = null;

/**
 * Initialize the puzzle fetcher manager with all available sources
 * @returns {PuzzleFetcherManager} Configured fetcher manager
 */
function initializeFetcherManager() {
  if (!fetcherManager) {
    console.log('🚀 Initializing PuzzleFetcherManager...');
    
    try {
      fetcherManager = new PuzzleFetcherManager({
        cacheDurationMinutes: 60,
        healthCheckIntervalMinutes: 10,
        maxRetries: 3,
        retryDelayMs: 2000
      });

      // Register sources in priority order
      console.log('📝 Registering StaticDataFetcher...');
      fetcherManager.registerFetcher(new StaticDataFetcher(), 100);           // Highest priority
      
      console.log('📝 Registering BackendApiFetcher...');
      fetcherManager.registerFetcher(new BackendApiFetcher(), 80);            // Dynamic source via backend API

      console.log('🎯 PuzzleFetcherManager initialized with 2 sources');
      console.log('🔍 Registered fetchers:', fetcherManager.getStats().fetchers);
    } catch (error) {
      console.error('❌ Failed to initialize PuzzleFetcherManager:', error);
      throw error;
    }
  }
  return fetcherManager;
}

/**
 * Fetches puzzle data for a specific date using cache-first strategy with dynamic fallback
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} [options] - Fetch options
 * @param {boolean} [options.dynamicOnly=false] - Skip static data and fetch dynamically
 * @param {boolean} [options.skipValidation=false] - Skip data validation
 * @returns {Promise<Object>} Puzzle data object with metadata
 */
export const fetchPuzzleForDate = async (date, options = {}) => {
  const { dynamicOnly = false, skipValidation = false } = options;
  
  // Validate date format first
  const dateValidation = DataValidator.validateDate(date, true); // Allow future dates for dynamic fetching
  if (!dateValidation.isValid) {
    throw new Error(`Invalid date: ${dateValidation.errors.join(', ')}`);
  }

  console.log(`🔄 Fetching puzzle for date: ${date}${dynamicOnly ? ' (dynamic only)' : ''}`);
  
  try {
    const manager = initializeFetcherManager();
    
    // For dynamic-only requests or when static data doesn't exist
    if (dynamicOnly || !getPuzzleByDate(date)) {
      console.log(`🌐 Attempting dynamic fetch for ${date}...`);
      
      try {
        // Use the fetcher manager which will try sources in priority order
        const puzzleData = await manager.fetchPuzzle(date);
        
        // Validate the fetched data
        if (!skipValidation) {
          const validation = DataValidator.validatePuzzleData(puzzleData, { allowFutureDates: true });
          if (!validation.isValid) {
            console.warn(`⚠️ Fetched data validation failed: ${validation.errors.join(', ')}`);
            throw new Error(`Invalid puzzle data: ${validation.errors[0]}`);
          }
          
          if (validation.warnings.length > 0) {
            console.warn(`⚠️ Data validation warnings: ${validation.warnings.join(', ')}`);
          }
        }
        
        console.log(`✅ Successfully fetched puzzle dynamically from ${puzzleData.source}`);
        
        return {
          ...puzzleData,
          fetchSource: 'dynamic',
          fetchedAt: new Date().toISOString(),
          canBeSaved: true // Indicate this can be saved to static data
        };
        
      } catch (dynamicError) {
        console.error(`❌ Dynamic fetch failed: ${dynamicError.message}`);
        
        // If dynamic fetch fails and we're not in dynamic-only mode, try static as fallback
        if (!dynamicOnly) {
          const staticPuzzle = getPuzzleByDate(date);
          if (staticPuzzle) {
            console.log(`📁 Falling back to static data for ${date}`);
            return {
              ...staticPuzzle,
              fetchSource: 'static',
              fetchedAt: new Date().toISOString(),
              canBeSaved: false
            };
          }
        }
        
        // Re-throw the dynamic error with context
        throw new Error(`Dynamic fetch failed: ${dynamicError.message}`);
      }
    }
    
    // Static data path (default behavior)
    const staticPuzzle = getPuzzleByDate(date);
    if (staticPuzzle) {
      console.log(`📁 Found puzzle in static data for ${date}`);
      return {
        ...staticPuzzle,
        fetchSource: 'static',
        fetchedAt: new Date().toISOString(),
        canBeSaved: false
      };
    }
    
    // No static data found - suggest dynamic fetch
    const latestDate = getLatestPuzzleDate();
    console.log(`❌ Puzzle for ${date} not found in static data. Latest available: ${latestDate}`);
    
    throw new Error(`Puzzle for ${date} not found in static data. Try enabling dynamic fetching to get the latest puzzles.`);
    
  } catch (error) {
    console.error(`❌ Failed to fetch puzzle for ${date}: ${error.message}`);
    throw error;
  }
};

/**
 * Fetches today's puzzle
 * @param {Object} [options] - Fetch options
 * @returns {Promise<Object>} Today's puzzle data
 */
export const fetchTodaysPuzzle = async (options = {}) => {
  // Get today's date in local timezone
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayLocal = `${year}-${month}-${day}`;
  return fetchPuzzleForDate(todayLocal, options);
};

/**
 * Fetches yesterday's puzzle
 * @param {Object} [options] - Fetch options
 * @returns {Promise<Object>} Yesterday's puzzle data
 */
export const fetchYesterdaysPuzzle = async (options = {}) => {
  // Get yesterday's date in local timezone
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayLocal = `${year}-${month}-${day}`;
  return fetchPuzzleForDate(yesterdayLocal, options);
};

/**
 * Check if dynamic fetching is available for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>} True if dynamic fetching is available
 */
export const isDynamicFetchAvailable = async (date) => {
  try {
    const manager = initializeFetcherManager();
    return await manager.isAvailable(date);
  } catch (error) {
    console.warn(`Failed to check dynamic availability for ${date}: ${error.message}`);
    return false;
  }
};

/**
 * Get statistics about the fetcher manager
 * @returns {Object} Fetcher manager statistics
 */
export const getFetcherStats = () => {
  if (!fetcherManager) {
    return { error: 'Fetcher manager not initialized' };
  }
  return fetcherManager.getStats();
};

/**
 * Clear the fetcher manager cache
 */
export const clearFetcherCache = () => {
  if (fetcherManager) {
    fetcherManager.clearCache();
    console.log('🧹 Fetcher cache cleared');
  }
};

/**
 * Force refresh of puzzle data for a specific date (bypasses cache)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Fresh puzzle data
 */
export const refreshPuzzleForDate = async (date) => {
  // Clear cache for this specific date first
  if (fetcherManager) {
    fetcherManager.clearExpiredCache();
  }
  
  // Fetch with dynamic-only to force fresh data
  return fetchPuzzleForDate(date, { dynamicOnly: true });
};