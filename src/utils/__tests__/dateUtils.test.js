import {
  validateDate,
  getTodaysDate,
  getYesterdaysDate,
  formatDate,
  parseDate,
  isFutureDate,
  isBeforeLaunch,
  getDateRange,
  getDaysAgo,
  addDays,
  formatDateForDisplay
} from '../dateUtils.js';

describe('dateUtils', () => {
  describe('validateDate', () => {
    it('should validate correct date format', () => {
      expect(validateDate('2025-01-01')).toBe(true);
      expect(validateDate('2023-12-31')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateDate('2025/01/01')).toBe(false);
      expect(validateDate('01-01-2025')).toBe(false);
      expect(validateDate('2025-1-1')).toBe(false);
      expect(validateDate('not-a-date')).toBe(false);
      expect(validateDate('')).toBe(false);
      expect(validateDate(null)).toBe(false);
      expect(validateDate(undefined)).toBe(false);
      expect(validateDate(123)).toBe(false);
    });

    it('should reject non-existent dates', () => {
      expect(validateDate('2025-02-30')).toBe(false);
      expect(validateDate('2025-13-01')).toBe(false);
      expect(validateDate('2025-00-01')).toBe(false);
      expect(validateDate('2025-01-00')).toBe(false);
    });
  });

  describe('getTodaysDate', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const today = new Date();
      const expected = formatDate(today);
      const result = getTodaysDate();
      
      expect(result).toBe(expected);
      expect(validateDate(result)).toBe(true);
    });
  });

  describe('getYesterdaysDate', () => {
    it('should return yesterday\'s date in YYYY-MM-DD format', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expected = formatDate(yesterday);
      const result = getYesterdaysDate();
      
      expect(result).toBe(expected);
      expect(validateDate(result)).toBe(true);
    });
  });

  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date(2025, 0, 1); // January 1, 2025
      expect(formatDate(date)).toBe('2025-01-01');
    });

    it('should handle edge cases', () => {
      const date1 = new Date(2025, 1, 5); // February 5, 2025
      expect(formatDate(date1)).toBe('2025-02-05');

      const date2 = new Date(2025, 11, 31); // December 31, 2025
      expect(formatDate(date2)).toBe('2025-12-31');
    });

    it('should pad single digits with zeros', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(formatDate(date)).toBe('2025-01-05');
    });
  });

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const result = parseDate('2025-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(1);
    });

    it('should throw error for invalid dates', () => {
      expect(() => parseDate('invalid-date')).toThrow('Invalid date string');
      expect(() => parseDate('2025/01/01')).toThrow('Invalid date string');
      expect(() => parseDate('')).toThrow('Invalid date string');
    });
  });

  describe('isFutureDate', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = formatDate(futureDate);
      
      expect(isFutureDate(futureDateStr)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateStr = formatDate(pastDate);
      
      expect(isFutureDate(pastDateStr)).toBe(false);
    });

    it('should return false for today', () => {
      const today = getTodaysDate();
      expect(isFutureDate(today)).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isFutureDate('invalid-date')).toBe(false);
      expect(isFutureDate('')).toBe(false);
    });
  });

  describe('isBeforeLaunch', () => {
    it('should return true for dates before 2023-06-12', () => {
      expect(isBeforeLaunch('2023-06-11')).toBe(true);
      expect(isBeforeLaunch('2023-01-01')).toBe(true);
      expect(isBeforeLaunch('2022-12-31')).toBe(true);
    });

    it('should return false for dates on or after 2023-06-12', () => {
      expect(isBeforeLaunch('2023-06-12')).toBe(false);
      expect(isBeforeLaunch('2023-06-13')).toBe(false);
      expect(isBeforeLaunch('2025-01-01')).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isBeforeLaunch('invalid-date')).toBe(false);
      expect(isBeforeLaunch('')).toBe(false);
    });
  });

  describe('getDateRange', () => {
    it('should generate date range correctly', () => {
      const range = getDateRange('2025-01-01', '2025-01-03');
      expect(range).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
    });

    it('should handle single day range', () => {
      const range = getDateRange('2025-01-01', '2025-01-01');
      expect(range).toEqual(['2025-01-01']);
    });

    it('should handle month boundaries', () => {
      const range = getDateRange('2025-01-30', '2025-02-02');
      expect(range).toEqual(['2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02']);
    });

    it('should handle year boundaries', () => {
      const range = getDateRange('2024-12-30', '2025-01-02');
      expect(range).toEqual(['2024-12-30', '2024-12-31', '2025-01-01', '2025-01-02']);
    });

    it('should throw error for invalid dates', () => {
      expect(() => getDateRange('invalid', '2025-01-01')).toThrow('Invalid date range');
      expect(() => getDateRange('2025-01-01', 'invalid')).toThrow('Invalid date range');
    });

    it('should throw error when start date is after end date', () => {
      expect(() => getDateRange('2025-01-02', '2025-01-01')).toThrow(
        'Start date must be before or equal to end date'
      );
    });
  });

  describe('getDaysAgo', () => {
    it('should return date N days ago', () => {
      const result = getDaysAgo(1);
      const expected = getYesterdaysDate();
      expect(result).toBe(expected);
    });

    it('should handle different numbers of days', () => {
      const result7 = getDaysAgo(7);
      const result30 = getDaysAgo(30);
      
      expect(validateDate(result7)).toBe(true);
      expect(validateDate(result30)).toBe(true);
      
      // Verify 7 days ago is actually 7 days before today
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      expect(result7).toBe(formatDate(sevenDaysAgo));
    });

    it('should handle zero days', () => {
      const result = getDaysAgo(0);
      const expected = getTodaysDate();
      expect(result).toBe(expected);
    });
  });

  describe('addDays', () => {
    it('should add positive days', () => {
      const result = addDays('2025-01-01', 5);
      expect(result).toBe('2025-01-06');
    });

    it('should subtract negative days', () => {
      const result = addDays('2025-01-06', -5);
      expect(result).toBe('2025-01-01');
    });

    it('should handle zero days', () => {
      const result = addDays('2025-01-01', 0);
      expect(result).toBe('2025-01-01');
    });

    it('should handle month boundaries', () => {
      const result = addDays('2025-01-30', 5);
      expect(result).toBe('2025-02-04');
    });

    it('should handle year boundaries', () => {
      const result = addDays('2024-12-30', 5);
      expect(result).toBe('2025-01-04');
    });

    it('should throw error for invalid from date', () => {
      expect(() => addDays('invalid-date', 1)).toThrow('Invalid date');
      expect(() => addDays('2025/01/01', 1)).toThrow('Invalid date');
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format dates for display', () => {
      const result = formatDateForDisplay('2025-01-01');
      expect(result).toContain('January');
      expect(result).toContain('1');
      expect(result).toContain('2025');
    });

    it('should include weekday when requested', () => {
      const result = formatDateForDisplay('2025-01-01', { includeWeekday: true });
      expect(result).toContain('Wednesday'); // 2025-01-01 is a Wednesday
    });

    it('should handle different locales', () => {
      const result = formatDateForDisplay('2025-01-01', { locale: 'es-ES' });
      expect(result).toContain('enero'); // January in Spanish
    });

    it('should return "Invalid Date" for invalid input', () => {
      const result = formatDateForDisplay('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    it('should handle edge cases', () => {
      expect(formatDateForDisplay('')).toBe('Invalid Date');
      expect(formatDateForDisplay('2025/01/01')).toBe('Invalid Date');
    });
  });

  describe('integration tests', () => {
    it('should work together for common workflows', () => {
      // Get today and yesterday
      const today = getTodaysDate();
      const yesterday = getYesterdaysDate();
      
      // Verify they are valid
      expect(validateDate(today)).toBe(true);
      expect(validateDate(yesterday)).toBe(true);
      
      // Verify yesterday is before today
      expect(isFutureDate(yesterday)).toBe(false);
      
      // Get a range including both
      const range = getDateRange(yesterday, today);
      expect(range).toHaveLength(2);
      expect(range[0]).toBe(yesterday);
      expect(range[1]).toBe(today);
      
      // Format for display
      const displayToday = formatDateForDisplay(today);
      expect(displayToday).toContain(new Date().getFullYear().toString());
    });

    it('should handle leap years correctly', () => {
      // 2024 is a leap year
      expect(validateDate('2024-02-29')).toBe(true);
      
      // 2025 is not a leap year
      expect(validateDate('2025-02-29')).toBe(false);
      
      // Adding days across leap year boundary
      const result = addDays('2024-02-28', 1);
      expect(result).toBe('2024-02-29');
    });
  });
});
