/**
 * Tests for puzzleFetcher service
 * Tests the simplified static data approach
 */

import { 
  fetchPuzzleForDate, 
  fetchTodaysPuzzle, 
  fetchYesterdaysPuzzle 
} from '../puzzleFetcher';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('puzzleFetcher', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    test('rejects invalid date format', async () => {
      await expect(fetchPuzzleForDate('invalid-date')).rejects.toThrow('Date must be in YYYY-MM-DD format');
      await expect(fetchPuzzleForDate('2024/01/01')).rejects.toThrow('Date must be in YYYY-MM-DD format');
      await expect(fetchPuzzleForDate('01-01-2024')).rejects.toThrow('Date must be in YYYY-MM-DD format');
    });

    test('rejects future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await expect(fetchPuzzleForDate(futureDateString)).rejects.toThrow('Cannot fetch puzzle for future dates');
    });

    test('rejects dates before NYT Connections launch', async () => {
      await expect(fetchPuzzleForDate('2023-06-11')).rejects.toThrow('Cannot fetch puzzle for dates before NYT Connections launch');
      await expect(fetchPuzzleForDate('2020-01-01')).rejects.toThrow('Cannot fetch puzzle for dates before NYT Connections launch');
    });

    test('accepts valid dates in range', async () => {
      const result = await fetchPuzzleForDate('2025-08-17');
      
      expect(result).toBeDefined();
      expect(result.date).toBe('2025-08-17');
      expect(result.words).toHaveLength(16);
      expect(result.groups).toHaveLength(4);
      expect(result.source).toBe('static');
    });

    test('rejects dates not in static data', async () => {
      await expect(fetchPuzzleForDate('2024-01-15')).rejects.toThrow('Puzzle for 2024-01-15 not found in static data');
    });
  });

  describe('Static Data Access', () => {
    test('can fetch puzzle from static data', async () => {
      const result = await fetchPuzzleForDate('2025-08-01');
      
      expect(result).toBeDefined();
      expect(result.date).toBe('2025-08-01');
      expect(result.words).toHaveLength(16);
      expect(result.groups).toHaveLength(4);
      expect(result.source).toBe('static');
    });

    test('returns correct puzzle structure', async () => {
      const result = await fetchPuzzleForDate('2025-08-17');
      
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('gameId');
      expect(result).toHaveProperty('groups');
      expect(result).toHaveProperty('words');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('source');
      
      expect(Array.isArray(result.groups)).toBe(true);
      expect(Array.isArray(result.words)).toBe(true);
      expect(typeof result.category).toBe('string');
    });

    test('groups have correct structure', async () => {
      const result = await fetchPuzzleForDate('2025-08-17');
      
      result.groups.forEach(group => {
        expect(group).toHaveProperty('name');
        expect(group).toHaveProperty('level');
        expect(group).toHaveProperty('words');
        expect(Array.isArray(group.words)).toBe(true);
        expect(group.words).toHaveLength(4);
      });
    });
  });

  describe('Helper Functions', () => {
    test('fetchTodaysPuzzle calls fetchPuzzleForDate with today', async () => {
      // Use Jest's fake timers to control the system time
      jest.useFakeTimers();
      const mockDate = new Date(2025, 7, 17); // Month is 0-based, so 7 = August
      jest.setSystemTime(mockDate);
      
      try {
        const result = await fetchTodaysPuzzle();
        expect(result).toBeDefined();
        expect(result.date).toBe('2025-08-17');
      } finally {
        jest.useRealTimers();
      }
    });

    test('fetchYesterdaysPuzzle calls fetchPuzzleForDate with yesterday', async () => {
      // Use Jest's fake timers to control the system time
      jest.useFakeTimers();
      const mockDate = new Date(2025, 7, 17); // Month is 0-based, so 7 = August
      jest.setSystemTime(mockDate);
      
      try {
        const result = await fetchYesterdaysPuzzle();
        expect(result).toBeDefined();
        expect(result.date).toBe('2025-08-16');
      } finally {
        jest.useRealTimers();
      }
    });

    test('handles dates outside available range', async () => {
      // Use Jest's fake timers to control the system time
      jest.useFakeTimers();
      const mockDate = new Date(2025, 8, 1); // Month is 0-based, so 8 = September
      jest.setSystemTime(mockDate);
      
      try {
        await expect(fetchTodaysPuzzle()).rejects.toThrow('Latest puzzle in dataset is 2025-08-17');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('Error Handling', () => {
    test('provides clear error messages for missing puzzles', async () => {
      await expect(fetchPuzzleForDate('2024-01-15')).rejects.toThrow('Puzzle for 2024-01-15 not found in static data');
    });

    test('provides clear error messages for future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      await expect(fetchPuzzleForDate(futureDateString)).rejects.toThrow('Cannot fetch puzzle for future dates');
    });
  });
});
