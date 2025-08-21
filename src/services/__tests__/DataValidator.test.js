import { DataValidator } from '../DataValidator.js';

describe('DataValidator', () => {
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

  describe('validateDate', () => {
    it('should validate correct date format', () => {
      const result = DataValidator.validateDate('2025-01-01');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid date format', () => {
      const result = DataValidator.validateDate('2025/01/01');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid date format');
    });

    it('should reject non-existent dates', () => {
      const result = DataValidator.validateDate('2025-02-30');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Date does not exist');
    });

    it('should reject future dates by default', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const result = DataValidator.validateDate(futureDateStr);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('in the future');
    });

    it('should allow future dates when specified', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const result = DataValidator.validateDate(futureDateStr, true);
      expect(result.isValid).toBe(true);
    });

    it('should warn about dates before NYT Connections launch', () => {
      const result = DataValidator.validateDate('2023-01-01');
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain('before NYT Connections launched');
    });
  });

  describe('validateGameId', () => {
    it('should validate positive integers', () => {
      const result = DataValidator.validateGameId(123);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative numbers', () => {
      const result = DataValidator.validateGameId(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('positive integer');
    });

    it('should reject zero', () => {
      const result = DataValidator.validateGameId(0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('positive integer');
    });

    it('should reject non-integers', () => {
      const result = DataValidator.validateGameId(123.5);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('positive integer');
    });

    it('should reject non-numbers', () => {
      const result = DataValidator.validateGameId('123');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('positive integer');
    });

    it('should warn about unusually high game IDs', () => {
      const result = DataValidator.validateGameId(15000);
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain('unusually high');
    });
  });

  describe('validateGroup', () => {
    const validGroup = { 
      name: 'Test Group', 
      level: 0, 
      words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] 
    };

    it('should validate correct group', () => {
      const result = DataValidator.validateGroup(validGroup, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null/undefined group', () => {
      const result = DataValidator.validateGroup(null, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Must be an object');
    });

    it('should reject missing name', () => {
      const group = { ...validGroup, name: '' };
      const result = DataValidator.validateGroup(group, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Missing or invalid name');
    });

    it('should reject invalid level', () => {
      const group = { ...validGroup, level: 5 };
      const result = DataValidator.validateGroup(group, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid level');
    });

    it('should reject non-array words', () => {
      const group = { ...validGroup, words: 'not an array' };
      const result = DataValidator.validateGroup(group, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Words must be an array');
    });

    it('should reject wrong number of words', () => {
      const group = { ...validGroup, words: ['WORD1', 'WORD2'] };
      const result = DataValidator.validateGroup(group, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exactly 4 words');
    });

    it('should reject empty words', () => {
      const group = { ...validGroup, words: ['WORD1', '', 'WORD3', 'WORD4'] };
      const result = DataValidator.validateGroup(group, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Missing or invalid word');
    });

    it('should warn about long names', () => {
      const group = { ...validGroup, name: 'A'.repeat(60) };
      const result = DataValidator.validateGroup(group, 0);
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain('quite long');
    });

    it('should warn about long words', () => {
      const group = { ...validGroup, words: ['A'.repeat(40), 'WORD2', 'WORD3', 'WORD4'] };
      const result = DataValidator.validateGroup(group, 0);
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain('quite long');
    });

    it('should warn about unusual characters', () => {
      const group = { ...validGroup, words: ['W@RD1', 'WORD2', 'WORD3', 'WORD4'] };
      const result = DataValidator.validateGroup(group, 0);
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain('unusual characters');
    });
  });

  describe('validatePuzzleData', () => {
    it('should validate correct puzzle data', () => {
      const result = DataValidator.validatePuzzleData(validPuzzleData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null puzzle data', () => {
      const result = DataValidator.validatePuzzleData(null);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be an object');
    });

    it('should reject missing required fields', () => {
      const puzzleData = { date: '2025-01-01' };
      const result = DataValidator.validatePuzzleData(puzzleData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Missing required fields');
    });

    it('should reject non-array groups', () => {
      const puzzleData = { ...validPuzzleData, groups: 'not an array' };
      const result = DataValidator.validatePuzzleData(puzzleData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Groups must be an array');
    });

    it('should reject wrong number of groups', () => {
      const puzzleData = { 
        ...validPuzzleData, 
        groups: validPuzzleData.groups.slice(0, 3) 
      };
      const result = DataValidator.validatePuzzleData(puzzleData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exactly 4 groups');
    });

    it('should detect duplicate words', () => {
      const puzzleData = {
        ...validPuzzleData,
        groups: [
          { name: 'Group 1', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Group 2', level: 1, words: ['WORD1', 'WORD6', 'WORD7', 'WORD8'] }, // WORD1 duplicated
          { name: 'Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ]
      };
      const result = DataValidator.validatePuzzleData(puzzleData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Duplicate words found');
    });

    it('should detect duplicate group names', () => {
      const puzzleData = {
        ...validPuzzleData,
        groups: [
          { name: 'Same Name', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Same Name', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] }, // Duplicate name
          { name: 'Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ]
      };
      const result = DataValidator.validatePuzzleData(puzzleData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Duplicate group names');
    });

    it('should warn about unusual level distribution', () => {
      const puzzleData = {
        ...validPuzzleData,
        groups: [
          { name: 'Group 1', level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Group 2', level: 0, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] }, // Unusual: two level 0
          { name: 'Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ]
      };
      const result = DataValidator.validatePuzzleData(puzzleData);
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain('Unusual level distribution');
    });

    it('should validate with strict mode', () => {
      const puzzleData = {
        ...validPuzzleData,
        groups: [
          { name: 'A'.repeat(60), level: 0, words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] }, // Long name (warning)
          { name: 'Group 2', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
          { name: 'Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ]
      };
      
      const normalResult = DataValidator.validatePuzzleData(puzzleData);
      expect(normalResult.isValid).toBe(true);
      
      const strictResult = DataValidator.validatePuzzleData(puzzleData, { strict: true });
      expect(strictResult.isValid).toBe(false);
    });
  });

  describe('sanitizePuzzleData', () => {
    it('should sanitize valid data', () => {
      const result = DataValidator.sanitizePuzzleData(validPuzzleData);
      expect(result).toEqual(validPuzzleData);
    });

    it('should trim strings', () => {
      const dirtyData = {
        date: '  2025-01-01  ',
        gameId: '123',
        groups: [
          { 
            name: '  Test Group  ', 
            level: '0', 
            words: ['  WORD1  ', 'WORD2', 'WORD3', 'WORD4'] 
          },
          { name: 'Group 2', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
          { name: 'Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ],
        source: '  TestSource  '
      };
      
      const result = DataValidator.sanitizePuzzleData(dirtyData);
      expect(result.date).toBe('2025-01-01');
      expect(result.gameId).toBe(123);
      expect(result.groups[0].name).toBe('Test Group');
      expect(result.groups[0].words[0]).toBe('WORD1');
      expect(result.source).toBe('TestSource');
    });

    it('should convert string numbers to integers', () => {
      const data = {
        date: '2025-01-01',
        gameId: '123',
        groups: [
          { name: 'Group 1', level: '0', words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Group 2', level: '1', words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
          { name: 'Group 3', level: '2', words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Group 4', level: '3', words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ]
      };
      
      const result = DataValidator.sanitizePuzzleData(data);
      expect(typeof result.gameId).toBe('number');
      expect(result.gameId).toBe(123);
      expect(typeof result.groups[0].level).toBe('number');
      expect(result.groups[0].level).toBe(0);
    });

    it('should handle undefined source', () => {
      const data = { ...validPuzzleData };
      delete data.source;
      
      const result = DataValidator.sanitizePuzzleData(data);
      expect(result.source).toBeUndefined();
    });

    it('should throw error for invalid group', () => {
      const data = {
        date: '2025-01-01',
        gameId: 123,
        groups: [null]
      };
      
      expect(() => DataValidator.sanitizePuzzleData(data)).toThrow('Group 1 is invalid');
    });
  });

  describe('validateAndSanitize', () => {
    it('should sanitize and validate in one operation', () => {
      const dirtyData = {
        date: '  2025-01-01  ',
        gameId: '123',
        groups: [
          { name: '  Group 1  ', level: '0', words: ['WORD1', 'WORD2', 'WORD3', 'WORD4'] },
          { name: 'Group 2', level: 1, words: ['WORD5', 'WORD6', 'WORD7', 'WORD8'] },
          { name: 'Group 3', level: 2, words: ['WORD9', 'WORD10', 'WORD11', 'WORD12'] },
          { name: 'Group 4', level: 3, words: ['WORD13', 'WORD14', 'WORD15', 'WORD16'] }
        ]
      };
      
      const result = DataValidator.validateAndSanitize(dirtyData);
      expect(result.isValid).toBe(true);
      expect(result.data.date).toBe('2025-01-01');
      expect(result.data.gameId).toBe(123);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle sanitization errors', () => {
      const invalidData = {
        date: '2025-01-01',
        gameId: 123,
        groups: [null] // Will cause sanitization error
      };
      
      const result = DataValidator.validateAndSanitize(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors[0]).toContain('Group 1 is invalid');
    });
  });

  describe('createValidationReport', () => {
    it('should create report for valid data', () => {
      const result = { isValid: true, errors: [], warnings: [] };
      const report = DataValidator.createValidationReport(result);
      
      expect(report).toContain('✅ VALID');
      expect(report).toContain('Perfect! No issues found');
    });

    it('should create report for invalid data with errors', () => {
      const result = { 
        isValid: false, 
        errors: ['Error 1', 'Error 2'], 
        warnings: ['Warning 1'] 
      };
      const report = DataValidator.createValidationReport(result);
      
      expect(report).toContain('❌ INVALID');
      expect(report).toContain('🚨 ERRORS:');
      expect(report).toContain('Error 1');
      expect(report).toContain('⚠️ WARNINGS:');
      expect(report).toContain('Warning 1');
    });
  });
});
