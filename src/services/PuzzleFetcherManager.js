/**
 * Central manager for coordinating puzzle data fetching across multiple sources
 * Handles source priority, health checking, automatic failover, and caching
 */

import BasePuzzleFetcher from './fetchers/BasePuzzleFetcher.js';

/**
 * Manager class for coordinating multiple puzzle fetchers
 */
export class PuzzleFetcherManager {
  /**
   * Create a new fetcher manager
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      healthCheckInterval: 5 * 60 * 1000, // 5 minutes
      maxConcurrentFetches: 3,
      enableCaching: true,
      ...config
    };

    /** @type {BasePuzzleFetcher[]} */
    this.fetchers = [];
    
    /** @type {Map<string, Object>} */
    this.cache = new Map();
    
    /** @type {Map<string, boolean>} */
    this.fetcherHealth = new Map();
    
    /** @type {Set<string>} */
    this.activeFetches = new Set();
    
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      successfulFetches: 0,
      failedFetches: 0,
      averageResponseTime: 0
    };

    // Start health checking interval
    if (this.config.healthCheckInterval > 0) {
      this.healthCheckTimer = setInterval(() => {
        this._performHealthChecks();
      }, this.config.healthCheckInterval);
    }
  }

  /**
   * Register a new puzzle fetcher
   * @param {BasePuzzleFetcher} fetcher - Fetcher instance to register
   * @param {number} [priority=100] - Priority level (lower = higher priority)
   */
  registerFetcher(fetcher, priority = 100) {
    if (!(fetcher instanceof BasePuzzleFetcher)) {
      throw new Error('Fetcher must extend BasePuzzleFetcher');
    }

    // Remove existing fetcher with same source name
    this.fetchers = this.fetchers.filter(f => f.fetcher.getSourceName() !== fetcher.getSourceName());
    
    // Add new fetcher with priority
    this.fetchers.push({ fetcher, priority });
    
    // Sort by priority (lower number = higher priority)
    this.fetchers.sort((a, b) => a.priority - b.priority);
    
    // Initialize health status
    this.fetcherHealth.set(fetcher.getSourceName(), true);
    
    console.log(`📝 Registered fetcher: ${fetcher.getSourceName()} with priority ${priority}`);
  }

  /**
   * Unregister a puzzle fetcher
   * @param {string} sourceName - Name of the source to unregister
   */
  unregisterFetcher(sourceName) {
    this.fetchers = this.fetchers.filter(f => f.fetcher.getSourceName() !== sourceName);
    this.fetcherHealth.delete(sourceName);
    console.log(`🗑️ Unregistered fetcher: ${sourceName}`);
  }

  /**
   * Get list of registered fetchers
   * @returns {Array<{fetcher: BasePuzzleFetcher, priority: number}>} Array of fetcher objects
   */
  getFetchers() {
    return [...this.fetchers];
  }

  /**
   * Fetch puzzle data for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Puzzle data in standardized format
   * @throws {Error} When no fetcher can provide the data
   */
  async fetchPuzzle(date) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cachedData = this._getCachedData(date);
        if (cachedData) {
          this.stats.cacheHits++;
          console.log(`🎯 Cache hit for ${date}`);
          return cachedData;
        }
        this.stats.cacheMisses++;
      }

      // Prevent duplicate concurrent fetches for the same date
      if (this.activeFetches.has(date)) {
        throw new Error(`Fetch already in progress for ${date}`);
      }

      this.activeFetches.add(date);

      try {
        const result = await this._fetchFromSources(date);
        
        // Cache the result
        if (this.config.enableCaching && result) {
          this._cacheData(date, result);
        }

        const responseTime = Date.now() - startTime;
        this._updateStats(true, responseTime);
        
        return result;
      } finally {
        this.activeFetches.delete(date);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this._updateStats(false, responseTime);
      throw error;
    }
  }

  /**
   * Check if puzzle data is available for a specific date from any source
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} True if data is available
   */
  async isAvailable(date) {
    // Check cache first
    if (this.config.enableCaching && this._getCachedData(date)) {
      return true;
    }

    // Check with healthy fetchers
    const healthyFetchers = this._getHealthyFetchers();
    
    for (const { fetcher } of healthyFetchers) {
      try {
        if (await fetcher.isAvailable(date)) {
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ Health check failed for ${fetcher.getSourceName()}: ${error.message}`);
        this._markFetcherUnhealthy(fetcher.getSourceName());
      }
    }

    return false;
  }

  /**
   * Get manager statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      registeredFetchers: this.fetchers.length,
      healthyFetchers: Array.from(this.fetcherHealth.values()).filter(healthy => healthy).length,
      cacheSize: this.cache.size,
      activeFetches: this.activeFetches.size,
      fetcherStats: this.fetchers.map(({ fetcher, priority }) => ({
        sourceName: fetcher.getSourceName(),
        priority,
        healthy: this.fetcherHealth.get(fetcher.getSourceName()),
        stats: fetcher.getStats()
      }))
    };
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleared ${removedCount} expired cache entries`);
    }
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    this.clearCache();
    this.fetchers = [];
    this.fetcherHealth.clear();
    this.activeFetches.clear();
    
    console.log('🗑️ PuzzleFetcherManager destroyed');
  }

  /**
   * Attempt to fetch from available sources in priority order
   * @private
   * @param {string} date - Date to fetch
   * @returns {Promise<Object>} Puzzle data
   */
  async _fetchFromSources(date) {
    const healthyFetchers = this._getHealthyFetchers();
    
    if (healthyFetchers.length === 0) {
      throw new Error('No healthy fetchers available');
    }

    let lastError;

    for (const { fetcher } of healthyFetchers) {
      try {
        console.log(`🔄 Attempting to fetch ${date} from ${fetcher.getSourceName()}`);
        const result = await fetcher.fetchPuzzle(date);
        
        console.log(`✅ Successfully fetched ${date} from ${fetcher.getSourceName()}`);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Failed to fetch ${date} from ${fetcher.getSourceName()}: ${error.message}`);
        
        // Mark fetcher as unhealthy if it's a persistent error
        if (this._isPersistentError(error)) {
          this._markFetcherUnhealthy(fetcher.getSourceName());
        }
      }
    }

    throw new Error(`All fetchers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Get list of healthy fetchers in priority order
   * @private
   * @returns {Array} Array of healthy fetcher objects
   */
  _getHealthyFetchers() {
    return this.fetchers.filter(({ fetcher }) => 
      this.fetcherHealth.get(fetcher.getSourceName()) === true
    );
  }

  /**
   * Get cached data for a date
   * @private
   * @param {string} date - Date to look up
   * @returns {Object|null} Cached data or null
   */
  _getCachedData(date) {
    const entry = this.cache.get(date);
    if (!entry) return null;

    // Check if cache entry is still valid
    const now = Date.now();
    if (now - entry.timestamp > this.config.cacheTTL) {
      this.cache.delete(date);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache puzzle data
   * @private
   * @param {string} date - Date key
   * @param {Object} data - Puzzle data to cache
   */
  _cacheData(date, data) {
    this.cache.set(date, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cached puzzle data for ${date}`);
  }

  /**
   * Mark a fetcher as unhealthy
   * @private
   * @param {string} sourceName - Name of the source
   */
  _markFetcherUnhealthy(sourceName) {
    this.fetcherHealth.set(sourceName, false);
    console.warn(`🚨 Marked ${sourceName} as unhealthy`);
  }

  /**
   * Mark a fetcher as healthy
   * @private
   * @param {string} sourceName - Name of the source
   */
  _markFetcherHealthy(sourceName) {
    this.fetcherHealth.set(sourceName, true);
    console.log(`✅ Marked ${sourceName} as healthy`);
  }

  /**
   * Determine if an error indicates a persistent problem
   * @private
   * @param {Error} error - Error to analyze
   * @returns {boolean} True if error is persistent
   */
  _isPersistentError(error) {
    const persistentErrorPatterns = [
      /CORS/i,
      /Network Error/i,
      /Failed to fetch/i,
      /404/,
      /403/,
      /500/,
      /timeout/i
    ];

    return persistentErrorPatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Perform health checks on all registered fetchers
   * @private
   */
  async _performHealthChecks() {
    console.log('🏥 Performing health checks...');
    
    for (const { fetcher } of this.fetchers) {
      const sourceName = fetcher.getSourceName();
      
      try {
        // Use a recent date for health check
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const testDate = yesterday.toISOString().split('T')[0];
        
        const isAvailable = await fetcher.isAvailable(testDate);
        
        if (isAvailable && !this.fetcherHealth.get(sourceName)) {
          this._markFetcherHealthy(sourceName);
        } else if (!isAvailable && this.fetcherHealth.get(sourceName)) {
          this._markFetcherUnhealthy(sourceName);
        }
      } catch (error) {
        if (this.fetcherHealth.get(sourceName)) {
          console.warn(`⚠️ Health check failed for ${sourceName}: ${error.message}`);
          this._markFetcherUnhealthy(sourceName);
        }
      }
    }
  }

  /**
   * Update manager statistics
   * @private
   * @param {boolean} success - Whether the operation was successful
   * @param {number} responseTime - Response time in milliseconds
   */
  _updateStats(success, responseTime) {
    if (success) {
      this.stats.successfulFetches++;
    } else {
      this.stats.failedFetches++;
    }

    // Update average response time
    const totalRequests = this.stats.successfulFetches + this.stats.failedFetches;
    if (totalRequests === 1) {
      this.stats.averageResponseTime = responseTime;
    } else {
      const totalTime = this.stats.averageResponseTime * (totalRequests - 1) + responseTime;
      this.stats.averageResponseTime = totalTime / totalRequests;
    }
  }
}
