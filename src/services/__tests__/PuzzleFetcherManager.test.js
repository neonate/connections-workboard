/**
 * Unit tests for PuzzleFetcherManager
 */

import { PuzzleFetcherManager } from '../PuzzleFetcherManager.js';
import { BasePuzzleFetcher } from '../fetchers/BasePuzzleFetcher.js';

// Mock fetcher implementations for testing
class MockSuccessfulFetcher extends BasePuzzleFetcher {
  constructor(name = 'SuccessfulFetcher') {
    super(name, { retryAttempts: 1 });
    this.fetchDelay = 0;
  }

  async fetchPuzzle(date) {
    return this._executeFetch(async () => {
      if (this.fetchDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.fetchDelay));
      }
      
      return {
        date,
        gameId: 123,
        groups: [
          { name: 'Test Group 1', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Test Group 2', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
          { name: 'Test Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Test Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ],
        source: this.sourceName
      };
    }, date);
  }

  async isAvailable(date) {
    this._validateDate(date);
    return true;
  }
}

class MockFailingFetcher extends BasePuzzleFetcher {
  constructor(name = 'FailingFetcher') {
    super(name, { retryAttempts: 1 });
    this.errorMessage = 'Mock fetch failure';
  }

  async fetchPuzzle(date) {
    return this._executeFetch(async () => {
      throw new Error(this.errorMessage);
    }, date);
  }

  async isAvailable(date) {
    this._validateDate(date);
    throw new Error(this.errorMessage);
  }
}

class MockPersistentErrorFetcher extends BasePuzzleFetcher {
  constructor(name = 'PersistentErrorFetcher') {
    super(name, { retryAttempts: 1 });
  }

  async fetchPuzzle(date) {
    return this._executeFetch(async () => {
      throw new Error('CORS error');
    }, date);
  }

  async isAvailable(date) {
    this._validateDate(date);
    return false;
  }
}

describe('PuzzleFetcherManager', () => {
  let manager;
  let successfulFetcher;
  let failingFetcher;

  beforeEach(() => {
    manager = new PuzzleFetcherManager({
      cacheTTL: 1000, // 1 second for testing
      healthCheckInterval: 0, // Disable automatic health checks
      enableCaching: true
    });
    
    successfulFetcher = new MockSuccessfulFetcher('TestSuccess');
    failingFetcher = new MockFailingFetcher('TestFailing');
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('constructor', () => {
    it('should create manager with default config', () => {
      const defaultManager = new PuzzleFetcherManager();
      
      expect(defaultManager.config.cacheTTL).toBe(24 * 60 * 60 * 1000);
      expect(defaultManager.config.enableCaching).toBe(true);
      expect(defaultManager.config.maxConcurrentFetches).toBe(3);
      
      defaultManager.destroy();
    });

    it('should merge custom config with defaults', () => {
      expect(manager.config.cacheTTL).toBe(1000);
      expect(manager.config.enableCaching).toBe(true);
    });

    it('should initialize empty state', () => {
      expect(manager.getFetchers()).toHaveLength(0);
      expect(manager.getStats().registeredFetchers).toBe(0);
    });
  });

  describe('fetcher registration', () => {
    it('should register fetcher with default priority', () => {
      manager.registerFetcher(successfulFetcher);
      
      const fetchers = manager.getFetchers();
      expect(fetchers).toHaveLength(1);
      expect(fetchers[0].fetcher).toBe(successfulFetcher);
      expect(fetchers[0].priority).toBe(100);
    });

    it('should register fetcher with custom priority', () => {
      manager.registerFetcher(successfulFetcher, 50);
      
      const fetchers = manager.getFetchers();
      expect(fetchers[0].priority).toBe(50);
    });

    it('should sort fetchers by priority', () => {
      const highPriorityFetcher = new MockSuccessfulFetcher('HighPriority');
      const lowPriorityFetcher = new MockSuccessfulFetcher('LowPriority');
      
      manager.registerFetcher(lowPriorityFetcher, 200);
      manager.registerFetcher(highPriorityFetcher, 50);
      
      const fetchers = manager.getFetchers();
      expect(fetchers[0].fetcher.getSourceName()).toBe('HighPriority');
      expect(fetchers[1].fetcher.getSourceName()).toBe('LowPriority');
    });

    it('should replace existing fetcher with same name', () => {
      const fetcher1 = new MockSuccessfulFetcher('SameName');
      const fetcher2 = new MockSuccessfulFetcher('SameName');
      
      manager.registerFetcher(fetcher1, 100);
      manager.registerFetcher(fetcher2, 50);
      
      const fetchers = manager.getFetchers();
      expect(fetchers).toHaveLength(1);
      expect(fetchers[0].fetcher).toBe(fetcher2);
      expect(fetchers[0].priority).toBe(50);
    });

    it('should reject non-BasePuzzleFetcher instances', () => {
      expect(() => manager.registerFetcher({})).toThrow('Fetcher must extend BasePuzzleFetcher');
    });

    it('should unregister fetcher by name', () => {
      manager.registerFetcher(successfulFetcher);
      expect(manager.getFetchers()).toHaveLength(1);
      
      manager.unregisterFetcher('TestSuccess');
      expect(manager.getFetchers()).toHaveLength(0);
    });
  });

  describe('puzzle fetching', () => {
    beforeEach(() => {
      manager.registerFetcher(successfulFetcher, 100);
    });

    it('should fetch puzzle successfully', async () => {
      const result = await manager.fetchPuzzle('2025-01-01');
      
      expect(result).toBeDefined();
      expect(result.date).toBe('2025-01-01');
      expect(result.gameId).toBe(123);
      expect(result.groups).toHaveLength(4);
    });

    it('should cache successful results', async () => {
      const result1 = await manager.fetchPuzzle('2025-01-01');
      const result2 = await manager.fetchPuzzle('2025-01-01');
      
      expect(result1).toEqual(result2);
      
      const stats = manager.getStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });

    it('should not use expired cache', async () => {
      await manager.fetchPuzzle('2025-01-01');
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      await manager.fetchPuzzle('2025-01-01');
      
      const stats = manager.getStats();
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(2);
    });

    it('should prevent concurrent fetches for same date', async () => {
      // Create a fetcher that takes longer to complete
      class SlowMockFetcher extends MockSuccessfulFetcher {
        async fetchPuzzle(date) {
          return this._executeFetch(async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            
            return {
              date,
              gameId: 123,
              groups: [
                { name: 'Test Group 1', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
                { name: 'Test Group 2', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
                { name: 'Test Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
                { name: 'Test Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
              ],
              source: this.sourceName
            };
          }, date);
        }
      }
      
      const slowFetcher = new SlowMockFetcher('SlowFetcher');
      manager.unregisterFetcher('TestSuccess');
      manager.registerFetcher(slowFetcher);
      
      // Start first fetch
      const promise1 = manager.fetchPuzzle('2025-01-01');
      
      // Wait a small amount to ensure first fetch has started
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Try to start second fetch - should be rejected immediately
      await expect(manager.fetchPuzzle('2025-01-01')).rejects.toThrow('Fetch already in progress for 2025-01-01');
      
      // First fetch should still complete successfully
      await expect(promise1).resolves.toBeDefined();
    });

    it('should handle fetcher failures with fallback', async () => {
      const backupFetcher = new MockSuccessfulFetcher('BackupFetcher');
      
      manager.unregisterFetcher('TestSuccess'); // Remove default successful fetcher
      manager.registerFetcher(failingFetcher, 50); // Higher priority
      manager.registerFetcher(backupFetcher, 100);
      
      const result = await manager.fetchPuzzle('2025-01-01');
      
      expect(result).toBeDefined();
      expect(result.source).toBe('BackupFetcher');
    });

    it('should fail when all fetchers fail', async () => {
      manager.unregisterFetcher('TestSuccess');
      manager.registerFetcher(failingFetcher);
      
      await expect(manager.fetchPuzzle('2025-01-01')).rejects.toThrow('All fetchers failed');
    });

    it('should fail when no fetchers registered', async () => {
      manager.unregisterFetcher('TestSuccess');
      
      await expect(manager.fetchPuzzle('2025-01-01')).rejects.toThrow('No healthy fetchers available');
    });

    it('should mark fetchers unhealthy on persistent errors', async () => {
      const persistentErrorFetcher = new MockPersistentErrorFetcher();
      manager.registerFetcher(persistentErrorFetcher, 50);
      
      await expect(manager.fetchPuzzle('2025-01-01')).resolves.toBeDefined(); // Should fallback to successful fetcher
      
      const stats = manager.getStats();
      const unhealthyFetcher = stats.fetcherStats.find(f => f.sourceName === 'PersistentErrorFetcher');
      expect(unhealthyFetcher.healthy).toBe(false);
    });
  });

  describe('availability checking', () => {
    beforeEach(() => {
      manager.registerFetcher(successfulFetcher);
    });

    it('should check cache first for availability', async () => {
      await manager.fetchPuzzle('2025-01-01');
      
      const isAvailable = await manager.isAvailable('2025-01-01');
      expect(isAvailable).toBe(true);
    });

    it('should check with fetchers when not cached', async () => {
      const isAvailable = await manager.isAvailable('2025-01-01');
      expect(isAvailable).toBe(true);
    });

    it('should return false when no fetchers can provide data', async () => {
      manager.unregisterFetcher('TestSuccess');
      manager.registerFetcher(failingFetcher);
      
      const isAvailable = await manager.isAvailable('2025-01-01');
      expect(isAvailable).toBe(false);
    });

    it('should mark fetchers unhealthy during availability checks', async () => {
      manager.registerFetcher(failingFetcher, 50);
      
      await manager.isAvailable('2025-01-01');
      
      const stats = manager.getStats();
      const unhealthyFetcher = stats.fetcherStats.find(f => f.sourceName === 'TestFailing');
      expect(unhealthyFetcher.healthy).toBe(false);
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      manager.registerFetcher(successfulFetcher);
    });

    it('should track basic statistics', async () => {
      await manager.fetchPuzzle('2025-01-01');
      
      const stats = manager.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulFetches).toBe(1);
      expect(stats.failedFetches).toBe(0);
      expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should include fetcher statistics', async () => {
      await manager.fetchPuzzle('2025-01-01');
      
      const stats = manager.getStats();
      expect(stats.fetcherStats).toHaveLength(1);
      expect(stats.fetcherStats[0].sourceName).toBe('TestSuccess');
      expect(stats.fetcherStats[0].healthy).toBe(true);
    });

    it('should track cache statistics', async () => {
      await manager.fetchPuzzle('2025-01-01'); // Cache miss
      await manager.fetchPuzzle('2025-01-01'); // Cache hit
      
      const stats = manager.getStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.cacheSize).toBe(1);
    });
  });

  describe('cache management', () => {
    beforeEach(() => {
      manager.registerFetcher(successfulFetcher);
    });

    it('should clear all cache', async () => {
      await manager.fetchPuzzle('2025-01-01');
      expect(manager.getStats().cacheSize).toBe(1);
      
      manager.clearCache();
      expect(manager.getStats().cacheSize).toBe(0);
    });

    it('should clear expired cache entries', async () => {
      await manager.fetchPuzzle('2025-01-01');
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      manager.clearExpiredCache();
      expect(manager.getStats().cacheSize).toBe(0);
    });

    it('should not clear non-expired cache entries', async () => {
      await manager.fetchPuzzle('2025-01-01');
      
      manager.clearExpiredCache();
      expect(manager.getStats().cacheSize).toBe(1);
    });
  });

  describe('health management', () => {
    it('should perform health checks on fetchers', async () => {
      manager.registerFetcher(successfulFetcher);
      manager.registerFetcher(failingFetcher);
      
      await manager._performHealthChecks();
      
      const stats = manager.getStats();
      expect(stats.healthyFetchers).toBe(1); // Only successful fetcher should be healthy
    });

    it('should restore health to recovered fetchers', async () => {
      manager.registerFetcher(failingFetcher);
      
      // First health check should mark as unhealthy
      await manager._performHealthChecks();
      expect(manager.getStats().healthyFetchers).toBe(0);
      
      // Fix the fetcher by making it return true for isAvailable
      const originalIsAvailable = failingFetcher.isAvailable;
      failingFetcher.isAvailable = async (date) => {
        failingFetcher._validateDate(date);
        return true;
      };
      
      // Second health check should restore health
      await manager._performHealthChecks();
      expect(manager.getStats().healthyFetchers).toBe(1);
      
      // Restore original method
      failingFetcher.isAvailable = originalIsAvailable;
    });
  });

  describe('destruction', () => {
    it('should clean up resources on destroy', () => {
      manager.registerFetcher(successfulFetcher);
      
      expect(manager.getFetchers()).toHaveLength(1);
      expect(manager.getStats().cacheSize).toBe(0);
      
      manager.destroy();
      
      expect(manager.getFetchers()).toHaveLength(0);
      expect(manager.getStats().cacheSize).toBe(0);
    });

    it('should clear health check timer', () => {
      const managerWithTimer = new PuzzleFetcherManager({
        healthCheckInterval: 1000
      });
      
      expect(managerWithTimer.healthCheckTimer).toBeDefined();
      
      managerWithTimer.destroy();
      
      expect(managerWithTimer.healthCheckTimer).toBeNull();
    });
  });
});
