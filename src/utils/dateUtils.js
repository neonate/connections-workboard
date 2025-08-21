/**
 * Date utility functions for the NYT Connections puzzle fetcher system.
 */

/**
 * Validates a date string in YYYY-MM-DD format.
 * @param {string} date - The date string to validate.
 * @returns {boolean} True if the date is valid, false otherwise.
 */
export function validateDate(date) {
  if (typeof date !== 'string') return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  // Parse components to avoid timezone issues
  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);
  
  // Check if the date actually exists (handles invalid dates like Feb 30)
  return parsedDate.getFullYear() === year && 
         parsedDate.getMonth() === month - 1 && 
         parsedDate.getDate() === day;
}

/**
 * Gets today's date in YYYY-MM-DD format.
 * @returns {string} Today's date.
 */
export function getTodaysDate() {
  const today = new Date();
  return formatDate(today);
}

/**
 * Gets yesterday's date in YYYY-MM-DD format.
 * @returns {string} Yesterday's date.
 */
export function getYesterdaysDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

/**
 * Formats a Date object to YYYY-MM-DD string.
 * @param {Date} date - The date to format.
 * @returns {string} Formatted date string.
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string into a Date object.
 * @param {string} dateString - Date string in YYYY-MM-DD format.
 * @returns {Date} Parsed date object.
 * @throws {Error} If the date string is invalid.
 */
export function parseDate(dateString) {
  if (!validateDate(dateString)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Checks if a date is in the future.
 * @param {string} date - Date string in YYYY-MM-DD format.
 * @returns {boolean} True if the date is in the future.
 */
export function isFutureDate(date) {
  if (!validateDate(date)) return false;
  
  const [year, month, day] = date.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return targetDate > today;
}

/**
 * Checks if a date is before NYT Connections was launched.
 * @param {string} date - Date string in YYYY-MM-DD format.
 * @returns {boolean} True if the date is before the launch.
 */
export function isBeforeLaunch(date) {
  if (!validateDate(date)) return false;
  
  const [year, month, day] = date.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const launchDate = new Date(2023, 5, 12); // June 12, 2023
  
  return targetDate < launchDate;
}

/**
 * Generates a range of dates between two dates.
 * @param {string} startDate - Start date in YYYY-MM-DD format.
 * @param {string} endDate - End date in YYYY-MM-DD format.
 * @returns {string[]} Array of date strings in YYYY-MM-DD format.
 */
export function getDateRange(startDate, endDate) {
  if (!validateDate(startDate) || !validateDate(endDate)) {
    throw new Error('Invalid date range provided');
  }
  
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const dates = [];
  
  if (start > end) {
    throw new Error('Start date must be before or equal to end date');
  }
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Gets the date N days ago from today.
 * @param {number} daysAgo - Number of days ago.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
export function getDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDate(date);
}

/**
 * Gets the date N days from a given date.
 * @param {string} fromDate - Base date in YYYY-MM-DD format.
 * @param {number} days - Number of days to add (positive) or subtract (negative).
 * @returns {string} Resulting date string in YYYY-MM-DD format.
 */
export function addDays(fromDate, days) {
  if (!validateDate(fromDate)) {
    throw new Error(`Invalid date: ${fromDate}`);
  }
  
  const [year, month, day] = fromDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Formats a date for display in human-readable format.
 * @param {string} date - Date string in YYYY-MM-DD format.
 * @param {Object} [options] - Formatting options.
 * @param {string} [options.locale='en-US'] - Locale for formatting.
 * @param {boolean} [options.includeWeekday=false] - Whether to include weekday.
 * @returns {string} Formatted date string.
 */
export function formatDateForDisplay(date, options = {}) {
  if (!validateDate(date)) {
    return 'Invalid Date';
  }
  
  const { locale = 'en-US', includeWeekday = false } = options;
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const formatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  if (includeWeekday) {
    formatOptions.weekday = 'long';
  }
  
  return dateObj.toLocaleDateString(locale, formatOptions);
}
