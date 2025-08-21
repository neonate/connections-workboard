import StaticDataFetcher from '../StaticDataFetcher.js';
import * as puzzleData from '../../puzzleData.js';

// Mock the puzzleData module
jest.mock('../../puzzleData.js', () => ({
  getPuzzleByDate: jest.fn(),
  getAllAvailableDates: jest.fn()
}));

describe('StaticDataFetcher', () => {
  let fetcher;
  const mockPuzzleData = {
    date: '2025-01-01',
    gameId: 123,
    groups: [
      { name: 'Test Group 1', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
      { name: 'Test Group 2', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
      { name: 'Test Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
      { name: 'Test Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
    ]
  };

  beforeEach(() => {
    fetcher = new StaticDataFetcher();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with correct source name', () => {
      expect(fetcher.getSourceName()).toBe('StaticData');
    });
  });

  describe('fetchPuzzle', () => {
    it('should successfully fetch puzzle from static data', async () => {
      puzzleData.getPuzzleByDate.mockReturnValue(mockPuzzleData);

      const result = await fetcher.fetchPuzzle('2025-01-01');

      expect(puzzleData.getPuzzleByDate).toHaveBeenCalledWith('2025-01-01');
      expect(result).toEqual({
        date: '2025-01-01',
        gameId: 123,
        groups: [
          { name: 'Test Group 1', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Test Group 2', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
          { name: 'Test Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Test Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ],
        source: 'StaticData'
      });
    });

    it('should throw error when puzzle not found', async () => {
      puzzleData.getPuzzleByDate.mockReturnValue(null);

      await expect(fetcher.fetchPuzzle('2025-01-01')).rejects.toThrow(
        'Puzzle not found in static data for date 2025-01-01'
      );
    });

    it('should throw error when static data throws', async () => {
      puzzleData.getPuzzleByDate.mockImplementation(() => {
        throw new Error('Static data error');
      });

      await expect(fetcher.fetchPuzzle('2025-01-01')).rejects.toThrow('Static data error');
    });

    it('should properly copy word arrays', async () => {
      puzzleData.getPuzzleByDate.mockReturnValue(mockPuzzleData);

      const result = await fetcher.fetchPuzzle('2025-01-01');

      // Verify arrays are copies, not references
      expect(result.groups[0].words).not.toBe(mockPuzzleData.groups[0].words);
      expect(result.groups[0].words).toEqual(mockPuzzleData.groups[0].words);
    });
  });

  describe('isAvailable', () => {
    it('should return true when date is available', async () => {
      puzzleData.getAllAvailableDates.mockReturnValue(['2025-01-01', '2025-01-02']);

      const result = await fetcher.isAvailable('2025-01-01');

      expect(result).toBe(true);
      expect(puzzleData.getAllAvailableDates).toHaveBeenCalled();
    });

    it('should return false when date is not available', async () => {
      puzzleData.getAllAvailableDates.mockReturnValue(['2025-01-02', '2025-01-03']);

      const result = await fetcher.isAvailable('2025-01-01');

      expect(result).toBe(false);
    });

    it('should return false when getAllAvailableDates throws', async () => {
      puzzleData.getAllAvailableDates.mockImplementation(() => {
        throw new Error('Data access error');
      });

      const result = await fetcher.isAvailable('2025-01-01');

      expect(result).toBe(false);
    });
  });

  describe('getAvailableDates', () => {
    it('should return array of available dates', async () => {
      const mockDates = ['2025-01-01', '2025-01-02', '2025-01-03'];
      puzzleData.getAllAvailableDates.mockReturnValue(mockDates);

      const result = await fetcher.getAvailableDates();

      expect(result).toEqual(mockDates);
      expect(puzzleData.getAllAvailableDates).toHaveBeenCalled();
    });

    it('should return empty array when error occurs', async () => {
      puzzleData.getAllAvailableDates.mockImplementation(() => {
        throw new Error('Data access error');
      });

      const result = await fetcher.getAvailableDates();

      expect(result).toEqual([]);
    });
  });

  describe('getSourceMetadata', () => {
    it('should return comprehensive metadata', () => {
      const mockDates = ['2025-01-01', '2025-01-03', '2025-01-02'];
      puzzleData.getAllAvailableDates.mockReturnValue(mockDates);

      const metadata = fetcher.getSourceMetadata();

      expect(metadata).toEqual({
        name: 'StaticData',
        type: 'static',
        totalPuzzles: 3,
        dateRange: {
          earliest: '2025-01-01',
          latest: '2025-01-03'
        },
        lastUpdated: expect.any(String),
        reliability: 1.0,
        averageResponseTime: 0
      });
    });

    it('should handle empty date array', () => {
      puzzleData.getAllAvailableDates.mockReturnValue([]);

      const metadata = fetcher.getSourceMetadata();

      expect(metadata.totalPuzzles).toBe(0);
      expect(metadata.dateRange.earliest).toBeNull();
      expect(metadata.dateRange.latest).toBeNull();
    });

    it('should handle errors gracefully', () => {
      puzzleData.getAllAvailableDates.mockImplementation(() => {
        throw new Error('Data access error');
      });

      const metadata = fetcher.getSourceMetadata();

      expect(metadata).toEqual({
        name: 'StaticData',
        type: 'static',
        totalPuzzles: 0,
        dateRange: { earliest: null, latest: null },
        lastUpdated: expect.any(String),
        reliability: 0,
        averageResponseTime: 0
      });
    });
  });

  describe('statistics tracking', () => {
    it('should track successful fetch statistics', async () => {
      puzzleData.getPuzzleByDate.mockReturnValue(mockPuzzleData);

      await fetcher.fetchPuzzle('2025-01-01');

      const stats = fetcher.getStats();
      expect(stats.successfulFetches).toBe(1);
      expect(stats.failedFetches).toBe(0);
    });

    it('should track failed fetch statistics', async () => {
      puzzleData.getPuzzleByDate.mockReturnValue(null);

      await expect(fetcher.fetchPuzzle('2025-01-01')).rejects.toThrow();

      const stats = fetcher.getStats();
      expect(stats.successfulFetches).toBe(0);
      expect(stats.failedFetches).toBe(1);
    });
  });

  describe('inheritance from BasePuzzleFetcher', () => {
    it('should inherit validation methods', async () => {
      // Invalid date format should be caught by base class
      await expect(fetcher.fetchPuzzle('invalid-date')).rejects.toThrow();
    });

    it('should have proper source name', () => {
      expect(fetcher.getSourceName()).toBe('StaticData');
    });
  });
});
