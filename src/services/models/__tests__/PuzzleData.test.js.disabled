/**
 * Unit tests for PuzzleDataModel
 */

import { PuzzleDataModel, PUZZLE_LEVELS, LEVEL_NAMES, LEVEL_COLORS } from '../PuzzleData.js';

describe('PuzzleDataModel', () => {
  const validPuzzleData = {
    date: '2025-01-01',
    gameId: 123,
    groups: [
      { name: 'Test Group 1', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
      { name: 'Test Group 2', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
      { name: 'Test Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
      { name: 'Test Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
    ],
    source: 'TestSource'
  };

  describe('validation', () => {
    it('should validate correct puzzle data', () => {
      expect(() => PuzzleDataModel.validate(validPuzzleData)).not.toThrow();
    });

    it('should reject null or undefined data', () => {
      expect(() => PuzzleDataModel.validate(null)).toThrow('Puzzle data must be an object');
      expect(() => PuzzleDataModel.validate(undefined)).toThrow('Puzzle data must be an object');
    });

    it('should reject missing required fields', () => {
      expect(() => PuzzleDataModel.validate({})).toThrow('Missing required field: date');
      
      const missingGameId = { ...validPuzzleData };
      delete missingGameId.gameId;
      expect(() => PuzzleDataModel.validate(missingGameId)).toThrow('Missing required field: gameId');
      
      const missingGroups = { ...validPuzzleData };
      delete missingGroups.groups;
      expect(() => PuzzleDataModel.validate(missingGroups)).toThrow('Missing required field: groups');
    });

    it('should validate date format', () => {
      const invalidDate = { ...validPuzzleData, date: null };
      expect(() => PuzzleDataModel.validate(invalidDate)).toThrow('Date must be a string');
      
      const wrongFormat = { ...validPuzzleData, date: '01-01-2025' };
      expect(() => PuzzleDataModel.validate(wrongFormat)).toThrow('Date must be in YYYY-MM-DD format');
      
      const invalidDateValue = { ...validPuzzleData, date: '2025-02-30' };
      expect(() => PuzzleDataModel.validate(invalidDateValue)).toThrow('Invalid date: 2025-02-30');
    });

    it('should validate game ID', () => {
      const invalidGameId = { ...validPuzzleData, gameId: 'abc' };
      expect(() => PuzzleDataModel.validate(invalidGameId)).toThrow('Invalid game ID: abc. Must be a positive integer.');
      
      const negativeGameId = { ...validPuzzleData, gameId: -1 };
      expect(() => PuzzleDataModel.validate(negativeGameId)).toThrow('Invalid game ID: -1. Must be a positive integer.');
      
      const zeroGameId = { ...validPuzzleData, gameId: 0 };
      expect(() => PuzzleDataModel.validate(zeroGameId)).toThrow('Invalid game ID: 0. Must be a positive integer.');
    });

    it('should validate groups structure', () => {
      const wrongGroupCount = { ...validPuzzleData, groups: [] };
      expect(() => PuzzleDataModel.validate(wrongGroupCount)).toThrow('Must have exactly 4 groups. Found 0.');
      
      const tooManyGroups = { 
        ...validPuzzleData, 
        groups: [...validPuzzleData.groups, { name: 'Extra', level: 0, words: ['A', 'B', 'C', 'D'] }] 
      };
      expect(() => PuzzleDataModel.validate(tooManyGroups)).toThrow('Must have exactly 4 groups. Found 5.');
    });

    it('should validate individual groups', () => {
      const invalidGroupName = {
        ...validPuzzleData,
        groups: [
          { name: '', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          ...validPuzzleData.groups.slice(1)
        ]
      };
      expect(() => PuzzleDataModel.validate(invalidGroupName)).toThrow('Group 1: Missing or invalid name');
      
      const invalidLevel = {
        ...validPuzzleData,
        groups: [
          { name: 'Test', level: 5, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          ...validPuzzleData.groups.slice(1)
        ]
      };
      expect(() => PuzzleDataModel.validate(invalidLevel)).toThrow('Group 1: Invalid level 5. Must be 0, 1, 2, or 3.');
      
      const wrongWordCount = {
        ...validPuzzleData,
        groups: [
          { name: 'Test', level: 0, words: ['WORD1', 'WORD2'] },
          ...validPuzzleData.groups.slice(1)
        ]
      };
      expect(() => PuzzleDataModel.validate(wrongWordCount)).toThrow('Group 1: Must have exactly 4 words. Found 2.');
      
      const emptyWord = {
        ...validPuzzleData,
        groups: [
          { name: 'Test', level: 0, words: ['WORD1', '', 'WORD3', 'WORD4'] },
          ...validPuzzleData.groups.slice(1)
        ]
      };
      expect(() => PuzzleDataModel.validate(emptyWord)).toThrow('Group 1, Word 2: Missing or invalid word');
    });

    it('should detect duplicate words', () => {
      const duplicateWords = {
        ...validPuzzleData,
        groups: [
          { name: 'Test Group 1', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Test Group 2', level: 1, words: ['WORD1', 'WORD6', 'WORD7', 'WORD8'] }, // WORD1 duplicate
          ...validPuzzleData.groups.slice(2)
        ]
      };
      expect(() => PuzzleDataModel.validate(duplicateWords)).toThrow('Duplicate words found: WORD1');
    });

    it('should detect duplicate group names', () => {
      const duplicateNames = {
        ...validPuzzleData,
        groups: [
          { name: 'Test Group', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Test Group', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] }, // Duplicate name
          ...validPuzzleData.groups.slice(2)
        ]
      };
      expect(() => PuzzleDataModel.validate(duplicateNames)).toThrow('Duplicate group names found: Test Group');
    });
  });

  describe('constructor and normalization', () => {
    it('should create instance with valid data', () => {
      const puzzle = new PuzzleDataModel(validPuzzleData);
      const data = puzzle.getData();
      
      expect(data.date).toBe('2025-01-01');
      expect(data.gameId).toBe(123);
      expect(data.groups).toHaveLength(4);
      expect(data.words).toHaveLength(16);
      expect(data.category).toBe('Test Group 1 | Test Group 2 | Test Group 3 | Test Group 4');
    });

    it('should add computed fields', () => {
      const puzzle = new PuzzleDataModel(validPuzzleData);
      const data = puzzle.getData();
      
      expect(data.words).toEqual([
        'WORD1', 'WORD2', 'WORD3', 'WORD4',
        'WORD5', 'WORD6', 'WORD7', 'WORD8',
        'WORD9', 'WORD10', 'WORD11', 'WORD12',
        'WORD13', 'WORD14', 'WORD15', 'WORD16'
      ]);
      
      expect(data.category).toBe('Test Group 1 | Test Group 2 | Test Group 3 | Test Group 4');
    });

    it('should add default metadata', () => {
      const puzzle = new PuzzleDataModel(validPuzzleData);
      const data = puzzle.getData();
      
      expect(data.source).toBe('TestSource');
      expect(data.fetchedAt).toBeDefined();
      expect(new Date(data.fetchedAt)).toBeInstanceOf(Date);
    });

    it('should trim whitespace from strings', () => {
      const dataWithWhitespace = {
        ...validPuzzleData,
        groups: [
          { name: '  Trimmed Group  ', level: 0, words: ['  WORD1  ', '  WORD2  ', 'WORD3', 'WORD4'] },
          ...validPuzzleData.groups.slice(1)
        ]
      };
      
      const puzzle = new PuzzleDataModel(dataWithWhitespace);
      const data = puzzle.getData();
      
      expect(data.groups[0].name).toBe('Trimmed Group');
      expect(data.groups[0].words[0]).toBe('WORD1');
      expect(data.groups[0].words[1]).toBe('WORD2');
    });
  });

  describe('data access methods', () => {
    let puzzle;

    beforeEach(() => {
      puzzle = new PuzzleDataModel(validPuzzleData);
    });

    it('should get words by level', () => {
      expect(puzzle.getWordsByLevel(0)).toEqual(['WORD1', 'WORD2', 'WORD3', 'WORD4']);
      expect(puzzle.getWordsByLevel(1)).toEqual(['WORD5', 'WORD6', 'WORD7', 'WORD8']);
      expect(puzzle.getWordsByLevel(4)).toEqual([]); // Invalid level
    });

    it('should get group by level', () => {
      const group = puzzle.getGroupByLevel(0);
      expect(group).toEqual({
        name: 'Test Group 1',
        level: 0,
        words: ['WORD1', 'WORD2', 'WORD3', 'WORD4']
      });
      
      expect(puzzle.getGroupByLevel(4)).toBeNull(); // Invalid level
    });

    it('should get all words', () => {
      const words = puzzle.getAllWords();
      expect(words).toHaveLength(16);
      expect(words[0]).toBe('WORD1');
      expect(words[15]).toBe('WORD16');
    });

    it('should get category names', () => {
      const categories = puzzle.getCategoryNames();
      expect(categories).toEqual(['Test Group 1', 'Test Group 2', 'Test Group 3', 'Test Group 4']);
    });

    it('should check if puzzle has word', () => {
      expect(puzzle.hasWord('WORD1')).toBe(true);
      expect(puzzle.hasWord('word1')).toBe(true); // Case insensitive
      expect(puzzle.hasWord('NONEXISTENT')).toBe(false);
    });

    it('should find group for word', () => {
      const group = puzzle.findGroupForWord('WORD1');
      expect(group.name).toBe('Test Group 1');
      expect(group.level).toBe(0);
      
      expect(puzzle.findGroupForWord('word5')).toEqual({
        name: 'Test Group 2',
        level: 1,
        words: ['WORD5', 'WORD6', 'WORD7', 'WORD8']
      });
      
      expect(puzzle.findGroupForWord('NONEXISTENT')).toBeNull();
    });
  });

  describe('format conversion', () => {
    let puzzle;

    beforeEach(() => {
      puzzle = new PuzzleDataModel(validPuzzleData);
    });

    it('should convert to legacy format', () => {
      const legacy = puzzle.toLegacyFormat();
      
      expect(legacy.date).toBe('2025-01-01');
      expect(legacy.gameId).toBe(123);
      expect(legacy.groups).toHaveLength(4);
      expect(legacy.words).toHaveLength(16);
      expect(legacy.source).toBe('TestSource');
    });

    it('should convert to JSON', () => {
      const json = puzzle.toJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.date).toBe('2025-01-01');
      expect(parsed.groups).toHaveLength(4);
    });

    it('should convert to pretty JSON', () => {
      const prettyJson = puzzle.toJSON(true);
      expect(prettyJson).toContain('\n');
      expect(prettyJson).toContain('  '); // Indentation
    });

    it('should create from JSON string', () => {
      const json = puzzle.toJSON();
      const newPuzzle = PuzzleDataModel.fromJSON(json);
      
      expect(newPuzzle.getData()).toEqual(puzzle.getData());
    });

    it('should handle invalid JSON', () => {
      expect(() => PuzzleDataModel.fromJSON('invalid json')).toThrow('Failed to parse puzzle data JSON');
    });

    it('should create from legacy format', () => {
      const legacy = puzzle.toLegacyFormat();
      const newPuzzle = PuzzleDataModel.fromLegacyFormat(legacy);
      
      expect(newPuzzle.getData().date).toBe(puzzle.getData().date);
      expect(newPuzzle.getData().gameId).toBe(puzzle.getData().gameId);
    });
  });

  describe('metadata handling', () => {
    let puzzle;

    beforeEach(() => {
      puzzle = new PuzzleDataModel(validPuzzleData);
    });

    it('should merge metadata', () => {
      const metadata = {
        source: 'NewSource',
        sourceUrl: 'https://example.com',
        fetchedAt: '2025-01-01T12:00:00Z'
      };
      
      const updatedPuzzle = puzzle.withMetadata(metadata);
      const data = updatedPuzzle.getData();
      
      expect(data.source).toBe('NewSource');
      expect(data.sourceUrl).toBe('https://example.com');
      expect(data.fetchedAt).toBe('2025-01-01T12:00:00Z');
    });

    it('should preserve existing metadata when not provided', () => {
      const puzzleWithUrl = new PuzzleDataModel({
        ...validPuzzleData,
        sourceUrl: 'https://original.com'
      });
      
      const updated = puzzleWithUrl.withMetadata({ source: 'NewSource' });
      const data = updated.getData();
      
      expect(data.source).toBe('NewSource');
      expect(data.sourceUrl).toBe('https://original.com');
    });

    it('should update fetchedAt when not provided', () => {
      const originalTime = puzzle.getData().fetchedAt;
      
      // Wait a small amount to ensure different timestamp
      setTimeout(() => {
        const updated = puzzle.withMetadata({ source: 'NewSource' });
        const newTime = updated.getData().fetchedAt;
        
        expect(newTime).not.toBe(originalTime);
      }, 1);
    });
  });

  describe('constants', () => {
    it('should define puzzle levels', () => {
      expect(PUZZLE_LEVELS.YELLOW).toBe(0);
      expect(PUZZLE_LEVELS.GREEN).toBe(1);
      expect(PUZZLE_LEVELS.BLUE).toBe(2);
      expect(PUZZLE_LEVELS.PURPLE).toBe(3);
    });

    it('should define level names', () => {
      expect(LEVEL_NAMES[0]).toBe('Yellow (Easiest)');
      expect(LEVEL_NAMES[1]).toBe('Green');
      expect(LEVEL_NAMES[2]).toBe('Blue');
      expect(LEVEL_NAMES[3]).toBe('Purple (Hardest)');
    });

    it('should define level colors', () => {
      expect(LEVEL_COLORS[0]).toBe('#f7dc6f');
      expect(LEVEL_COLORS[1]).toBe('#a9dfbf');
      expect(LEVEL_COLORS[2]).toBe('#85c1e9');
      expect(LEVEL_COLORS[3]).toBe('#d7bde2');
    });
  });
});
