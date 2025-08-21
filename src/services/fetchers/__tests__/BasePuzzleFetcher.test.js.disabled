/**
 * Unit tests for BasePuzzleFetcher abstract base class
 */

import { BasePuzzleFetcher } from '../BasePuzzleFetcher.js';

// Mock implementation for testing
class MockPuzzleFetcher extends BasePuzzleFetcher {
  constructor(sourceName = 'MockSource', config = {}) {
    super(sourceName, config);
    this.shouldFail = false;
    this.shouldThrowAvailability = false;
  }

  async fetchPuzzle(date) {
    return this._executeFetch(async () => {
      if (this.shouldFail) {
        throw new Error('Mock fetch failure');
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
    
    if (this.shouldThrowAvailability) {
      throw new Error('Mock availability check failure');
    }
    
    return !this.shouldFail;
  }
}

describe('BasePuzzleFetcher', () => {
  let fetcher;

  beforeEach(() => {
    fetcher = new MockPuzzleFetcher('TestSource', {
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultFetcher = new MockPuzzleFetcher('Test');
      
      expect(defaultFetcher.sourceName).toBe('Test');
      expect(defaultFetcher.config.timeout).toBe(10000);
      expect(defaultFetcher.config.retryAttempts).toBe(3);
      expect(defaultFetcher.config.retryDelay).toBe(1000);
    });

    it('should merge custom config with defaults', () => {
      expect(fetcher.config.timeout).toBe(5000);
      expect(fetcher.config.retryAttempts).toBe(2);
      expect(fetcher.config.retryDelay).toBe(100);
    });

    it('should initialize empty stats', () => {
      const stats = fetcher.getStats();
      
      expect(stats.totalAttempts).toBe(0);
      expect(stats.successfulFetches).toBe(0);
      expect(stats.failures).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
    });

    it('should prevent direct instantiation of abstract class', () => {
      expect(() => new BasePuzzleFetcher('Test')).toThrow('BasePuzzleFetcher is abstract and cannot be instantiated directly');
    });
  });

  describe('abstract methods', () => {
    it('should throw error when fetchPuzzle not implemented', async () => {
      const baseFetcher = Object.create(BasePuzzleFetcher.prototype);
      BasePuzzleFetcher.call(baseFetcher, 'Test');
      
      await expect(baseFetcher.fetchPuzzle('2025-01-01')).rejects.toThrow('fetchPuzzle() must be implemented by subclass');
    });

    it('should throw error when isAvailable not implemented', async () => {
      const baseFetcher = Object.create(BasePuzzleFetcher.prototype);
      BasePuzzleFetcher.call(baseFetcher, 'Test');
      
      await expect(baseFetcher.isAvailable('2025-01-01')).rejects.toThrow('isAvailable() must be implemented by subclass');
    });
  });

  describe('getSourceName', () => {
    it('should return the source name', () => {
      expect(fetcher.getSourceName()).toBe('TestSource');
    });
  });

  describe('date validation', () => {
    it('should accept valid dates', async () => {
      await expect(fetcher.fetchPuzzle('2025-01-01')).resolves.toBeDefined();
    });

    it('should reject non-string dates', async () => {
      await expect(fetcher.fetchPuzzle(null)).rejects.toThrow('Date must be a string');
      await expect(fetcher.fetchPuzzle(123)).rejects.toThrow('Date must be a string');
    });

    it('should reject invalid date formats', async () => {
      await expect(fetcher.fetchPuzzle('2025-1-1')).rejects.toThrow('Date must be in YYYY-MM-DD format');
      await expect(fetcher.fetchPuzzle('01-01-2025')).rejects.toThrow('Date must be in YYYY-MM-DD format');
      await expect(fetcher.fetchPuzzle('2025/01/01')).rejects.toThrow('Date must be in YYYY-MM-DD format');
    });

    it('should reject invalid dates', async () => {
      await expect(fetcher.fetchPuzzle('2025-02-30')).rejects.toThrow('Invalid date: 2025-02-30');
      await expect(fetcher.fetchPuzzle('2025-13-01')).rejects.toThrow('Invalid date: 2025-13-01');
    });

    it('should reject future dates', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await expect(fetcher.fetchPuzzle(futureDate)).rejects.toThrow(`Cannot fetch puzzle for future date: ${futureDate}`);
    });

    it('should reject dates before NYT Connections launch', async () => {
      await expect(fetcher.fetchPuzzle('2023-06-11')).rejects.toThrow('Cannot fetch puzzle for dates before NYT Connections launch');
    });

    it('should accept dates from launch onwards', async () => {
      await expect(fetcher.fetchPuzzle('2023-06-12')).resolves.toBeDefined();
    });
  });

  describe('statistics tracking', () => {
    it('should track successful fetch attempts', async () => {
      await fetcher.fetchPuzzle('2025-01-01');
      
      const stats = fetcher.getStats();
      expect(stats.totalAttempts).toBe(1);
      expect(stats.successfulFetches).toBe(1);
      expect(stats.failures).toBe(0);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
      expect(stats.lastSuccessful).toBeDefined();
    });

    it('should track failed fetch attempts', async () => {
      fetcher.shouldFail = true;
      
      await expect(fetcher.fetchPuzzle('2025-01-01')).rejects.toThrow('Mock fetch failure');
      
      const stats = fetcher.getStats();
      expect(stats.totalAttempts).toBe(1);
      expect(stats.successfulFetches).toBe(0);
      expect(stats.failures).toBe(1);
      expect(stats.lastFailure).toBeDefined();
      expect(stats.lastFailure.error).toBe('Mock fetch failure');
    });

    it('should calculate success rate correctly', async () => {
      // One success
      await fetcher.fetchPuzzle('2025-01-01');
      expect(fetcher.getSuccessRate()).toBe(100);
      
      // One failure
      fetcher.shouldFail = true;
      await expect(fetcher.fetchPuzzle('2025-01-02')).rejects.toThrow();
      expect(fetcher.getSuccessRate()).toBe(50);
    });

    it('should return 0 success rate when no attempts', () => {
      expect(fetcher.getSuccessRate()).toBe(0);
    });

    it('should reset statistics', async () => {
      await fetcher.fetchPuzzle('2025-01-01');
      expect(fetcher.getStats().totalAttempts).toBe(1);
      
      fetcher.resetStats();
      
      const stats = fetcher.getStats();
      expect(stats.totalAttempts).toBe(0);
      expect(stats.successfulFetches).toBe(0);
      expect(stats.failures).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
    });

    it('should update average response time correctly', async () => {
      // First fetch
      await fetcher.fetchPuzzle('2025-01-01');
      const firstAverage = fetcher.getStats().averageResponseTime;
      
      // Second fetch
      await fetcher.fetchPuzzle('2025-01-02');
      const secondAverage = fetcher.getStats().averageResponseTime;
      
      expect(firstAverage).toBeGreaterThan(0);
      expect(secondAverage).toBeGreaterThan(0);
      // Average should be calculated from both attempts
      expect(fetcher.getStats().totalAttempts).toBe(2);
    });
  });

  describe('retry logic', () => {
    it('should implement retry with exponential backoff', async () => {
      let attemptCount = 0;
      
      const operation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return 'success';
      });

      const result = await fetcher._withRetry(operation, 'test operation');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(fetcher._withRetry(operation, 'test operation')).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(2); // retryAttempts is set to 2
    });
  });

  describe('isAvailable', () => {
    it('should validate date format in isAvailable', async () => {
      await expect(fetcher.isAvailable('invalid-date')).rejects.toThrow('Date must be in YYYY-MM-DD format');
    });

    it('should return availability status', async () => {
      expect(await fetcher.isAvailable('2025-01-01')).toBe(true);
      
      fetcher.shouldFail = true;
      expect(await fetcher.isAvailable('2025-01-01')).toBe(false);
    });

    it('should handle availability check errors', async () => {
      fetcher.shouldThrowAvailability = true;
      await expect(fetcher.isAvailable('2025-01-01')).rejects.toThrow('Mock availability check failure');
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in _executeFetch', async () => {
      fetcher.shouldFail = true;
      
      await expect(fetcher.fetchPuzzle('2025-01-01')).rejects.toThrow('Mock fetch failure');
      
      const stats = fetcher.getStats();
      expect(stats.failures).toBe(1);
      expect(stats.lastFailure.error).toBe('Mock fetch failure');
    });

    it('should validate date before attempting fetch', async () => {
      fetcher.shouldFail = true; // This shouldn't matter since validation should fail first
      
      await expect(fetcher.fetchPuzzle('invalid-date')).rejects.toThrow('Date must be in YYYY-MM-DD format');
      
      // Should not have updated stats since validation failed
      const stats = fetcher.getStats();
      expect(stats.totalAttempts).toBe(0);
    });
  });
});
