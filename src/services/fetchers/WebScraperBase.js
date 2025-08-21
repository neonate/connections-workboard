import BasePuzzleFetcher from './BasePuzzleFetcher';

/**
 * @typedef {Object} ScrapingConfig
 * @property {string[]} userAgents - Array of user agents to rotate through.
 * @property {number} requestDelay - Delay between requests in milliseconds.
 * @property {number} maxRetries - Maximum number of retry attempts.
 * @property {number} retryDelay - Delay between retries in milliseconds.
 * @property {string} corsProxy - CORS proxy URL template.
 * @property {number} timeout - Request timeout in milliseconds.
 */

/**
 * Base class for web scraping puzzle fetchers.
 * Provides common utilities for HTTP requests, HTML parsing, and error handling.
 */
class WebScraperBase extends BasePuzzleFetcher {
  /**
   * @param {string} sourceName - The name of the data source.
   * @param {ScrapingConfig} [config] - Configuration options for scraping.
   */
  constructor(sourceName, config = {}) {
    super(sourceName);
    
    /** @type {ScrapingConfig} */
    this.config = {
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ],
      requestDelay: 1000,
      maxRetries: 3,
      retryDelay: 2000,
      corsProxy: 'https://api.allorigins.win/get?url=',
      timeout: 10000,
      ...config
    };

    this.lastRequestTime = 0;
    this.userAgentIndex = 0;
  }

  /**
   * Makes an HTTP request with CORS proxy fallback and rate limiting.
   * @param {string} url - The URL to fetch.
   * @param {Object} [options] - Additional fetch options.
   * @returns {Promise<Response>} The fetch response.
   * @protected
   */
  async _makeRequest(url, options = {}) {
    await this._enforceRateLimit();
    
    const headers = {
      'User-Agent': this._getNextUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...options.headers
    };

    const fetchOptions = {
      method: 'GET',
      headers,
      timeout: this.config.timeout,
      ...options
    };

    console.log(`🌐 [${this.sourceName}] Making request to: ${url}`);

    try {
      // Try direct request first
      const response = await this._fetchWithTimeout(url, fetchOptions);
      if (response.ok) {
        console.log(`✅ [${this.sourceName}] Direct request successful`);
        return response;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn(`⚠️ [${this.sourceName}] Direct request failed: ${error.message}, trying CORS proxy`);
      
      // Fallback to CORS proxy
      try {
        const proxyUrl = this.config.corsProxy + encodeURIComponent(url);
        const proxyResponse = await this._fetchWithTimeout(proxyUrl, {
          ...fetchOptions,
          headers: { ...fetchOptions.headers, 'User-Agent': undefined } // Remove User-Agent for proxy
        });
        
        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          console.log(`✅ [${this.sourceName}] CORS proxy request successful`);
          
          // Return a Response-like object with the proxied content
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            text: () => Promise.resolve(data.contents),
            json: () => Promise.resolve(JSON.parse(data.contents))
          };
        }
        throw new Error(`Proxy HTTP ${proxyResponse.status}: ${proxyResponse.statusText}`);
      } catch (proxyError) {
        console.error(`❌ [${this.sourceName}] CORS proxy also failed: ${proxyError.message}`);
        throw new Error(`Both direct request and CORS proxy failed. Direct: ${error.message}, Proxy: ${proxyError.message}`);
      }
    }
  }

  /**
   * Fetch with timeout support.
   * @param {string} url - The URL to fetch.
   * @param {Object} options - Fetch options.
   * @returns {Promise<Response>} The fetch response.
   * @private
   */
  async _fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  /**
   * Enforces rate limiting between requests.
   * @private
   */
  async _enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.requestDelay) {
      const waitTime = this.config.requestDelay - timeSinceLastRequest;
      console.log(`⏱️ [${this.sourceName}] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Gets the next user agent in rotation.
   * @returns {string} A user agent string.
   * @private
   */
  _getNextUserAgent() {
    const userAgent = this.config.userAgents[this.userAgentIndex];
    this.userAgentIndex = (this.userAgentIndex + 1) % this.config.userAgents.length;
    return userAgent;
  }

  /**
   * Parses HTML content and extracts text using basic DOM methods.
   * Note: This is a simplified parser for browser environments.
   * @param {string} html - HTML content to parse.
   * @returns {Document} A DOM document for querying.
   * @protected
   */
  _parseHTML(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      if (doc.querySelector('parsererror')) {
        throw new Error('HTML parsing failed');
      }
      
      return doc;
    } catch (error) {
      console.error(`❌ [${this.sourceName}] HTML parsing error: ${error.message}`);
      throw new Error(`Failed to parse HTML: ${error.message}`);
    }
  }

  /**
   * Extracts text content from an element, with fallback selectors.
   * @param {Document} doc - The parsed document.
   * @param {string[]} selectors - CSS selectors to try in order.
   * @param {string} [defaultValue=''] - Default value if nothing found.
   * @returns {string} The extracted text content.
   * @protected
   */
  _extractText(doc, selectors, defaultValue = '') {
    for (const selector of selectors) {
      try {
        const element = doc.querySelector(selector);
        if (element && element.textContent) {
          const text = element.textContent.trim();
          if (text) {
            console.log(`📄 [${this.sourceName}] Extracted text using selector: ${selector}`);
            return text;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [${this.sourceName}] Selector failed: ${selector} - ${error.message}`);
      }
    }
    
    console.warn(`⚠️ [${this.sourceName}] No text found with any selector, using default: "${defaultValue}"`);
    return defaultValue;
  }

  /**
   * Extracts multiple text elements from the document.
   * @param {Document} doc - The parsed document.
   * @param {string[]} selectors - CSS selectors to try in order.
   * @returns {string[]} Array of extracted text content.
   * @protected
   */
  _extractTextArray(doc, selectors) {
    for (const selector of selectors) {
      try {
        const elements = doc.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          const texts = Array.from(elements)
            .map(el => el.textContent ? el.textContent.trim() : '')
            .filter(text => text.length > 0);
          
          if (texts.length > 0) {
            console.log(`📄 [${this.sourceName}] Extracted ${texts.length} items using selector: ${selector}`);
            return texts;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [${this.sourceName}] Selector failed: ${selector} - ${error.message}`);
      }
    }
    
    console.warn(`⚠️ [${this.sourceName}] No items found with any selector`);
    return [];
  }

  /**
   * Formats a date string to YYYY-MM-DD format.
   * @param {string} dateString - Input date string in various formats.
   * @returns {string} Formatted date string.
   * @protected
   */
  _formatDate(dateString) {
    try {
      // Handle various date formats commonly found on websites
      let dateStr = dateString.trim();
      
      // Remove common prefixes/suffixes
      dateStr = dateStr.replace(/^(for\s+|puzzle\s+for\s+|date:\s*)/i, '');
      dateStr = dateStr.replace(/\s*\(.*\)$/, ''); // Remove parenthetical info
      
      // Try to parse the date
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const formatted = `${year}-${month}-${day}`;
      console.log(`📅 [${this.sourceName}] Formatted date: "${dateString}" → "${formatted}"`);
      return formatted;
    } catch (error) {
      console.error(`❌ [${this.sourceName}] Date formatting error: ${error.message}`);
      throw new Error(`Failed to format date "${dateString}": ${error.message}`);
    }
  }

  /**
   * Implements retry logic for failed operations.
   * @param {Function} operation - The operation to retry.
   * @param {string} operationName - Name of the operation for logging.
   * @returns {Promise<any>} The result of the operation.
   * @protected
   */
  async _retryOperation(operation, operationName) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔄 [${this.sourceName}] ${operationName} - Attempt ${attempt}/${this.config.maxRetries}`);
        const result = await operation();
        console.log(`✅ [${this.sourceName}] ${operationName} succeeded on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ [${this.sourceName}] ${operationName} failed on attempt ${attempt}: ${error.message}`);
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt; // Exponential backoff
          console.log(`⏱️ [${this.sourceName}] Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`❌ [${this.sourceName}] ${operationName} failed after ${this.config.maxRetries} attempts`);
    throw lastError;
  }

  /**
   * Abstract method that must be implemented by subclasses to build the URL for a specific date.
   * @param {string} date - Date in YYYY-MM-DD format.
   * @returns {string} The URL to scrape for the given date.
   * @protected
   * @abstract
   */
  _buildUrl(date) {
    throw new Error("Method '_buildUrl()' must be implemented by subclasses.");
  }

  /**
   * Abstract method that must be implemented by subclasses to parse the scraped content.
   * @param {string} html - Raw HTML content from the website.
   * @param {string} date - Date in YYYY-MM-DD format.
   * @returns {Object} Parsed puzzle data.
   * @protected
   * @abstract
   */
  _parseContent(html, date) {
    throw new Error("Method '_parseContent()' must be implemented by subclasses.");
  }

  /**
   * Implementation of the fetchPuzzle method using web scraping.
   * @param {string} date - Date in YYYY-MM-DD format.
   * @returns {Promise<Object>} Parsed puzzle data.
   * @protected
   */
  async _executeFetch(date) {
    return await this._retryOperation(async () => {
      const url = this._buildUrl(date);
      const response = await this._makeRequest(url);
      const html = await response.text();
      return this._parseContent(html, date);
    }, `fetchPuzzle(${date})`);
  }
}

export default WebScraperBase;
