import WebScraperBase from '../WebScraperBase.js';

// Mock fetch
global.fetch = jest.fn();
global.DOMParser = jest.fn();

// Create a concrete implementation for testing
class TestWebScraper extends WebScraperBase {
  constructor(config) {
    super('TestScraper', config);
  }

  _buildUrl(date) {
    return `https://example.com/puzzle/${date}`;
  }

  _parseContent(html, date) {
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
  }
}

describe('WebScraperBase', () => {
  let scraper;
  let mockResponse;
  let mockDocument;

  beforeEach(() => {
    scraper = new TestWebScraper();
    
    mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: jest.fn().mockResolvedValue('<html><body>Test content</body></html>')
    };

    mockDocument = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn()
    };

    global.fetch.mockClear();
    global.DOMParser.mockClear();
    global.DOMParser.mockImplementation(() => ({
      parseFromString: jest.fn().mockReturnValue(mockDocument)
    }));
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(scraper.getSourceName()).toBe('TestScraper');
      expect(scraper.config.requestDelay).toBe(1000);
      expect(scraper.config.maxRetries).toBe(3);
    });

    it('should accept custom config', () => {
      const customScraper = new TestWebScraper({
        requestDelay: 2000,
        maxRetries: 5,
        timeout: 15000
      });

      expect(customScraper.config.requestDelay).toBe(2000);
      expect(customScraper.config.maxRetries).toBe(5);
      expect(customScraper.config.timeout).toBe(15000);
    });
  });

  describe('_makeRequest', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue(mockResponse);
    });

    it('should make successful direct request', async () => {
      const response = await scraper._makeRequest('https://example.com');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
            'Accept': expect.any(String)
          })
        })
      );
      expect(response).toBe(mockResponse);
    });

    it('should rotate user agents', async () => {
      await scraper._makeRequest('https://example.com');
      await scraper._makeRequest('https://example.com');

      const calls = global.fetch.mock.calls;
      const userAgent1 = calls[0][1].headers['User-Agent'];
      const userAgent2 = calls[1][1].headers['User-Agent'];
      
      // User agents should be different (rotation)
      expect(userAgent1).not.toBe(userAgent2);
    });

    it('should fallback to CORS proxy on direct request failure', async () => {
      // First call fails
      global.fetch.mockRejectedValueOnce(new Error('CORS error'));
      
      // Second call (proxy) succeeds
      const proxyResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ contents: '<html>Proxy content</html>' })
      };
      global.fetch.mockResolvedValueOnce(proxyResponse);

      const response = await scraper._makeRequest('https://example.com');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('api.allorigins.win'),
        expect.any(Object)
      );
      expect(response.ok).toBe(true);
    });

    it('should throw error when both direct and proxy fail', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(scraper._makeRequest('https://example.com')).rejects.toThrow(
        'Both direct request and CORS proxy failed'
      );
    });

    it('should enforce rate limiting', async () => {
      const startTime = Date.now();
      
      await scraper._makeRequest('https://example.com');
      await scraper._makeRequest('https://example.com');

      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should have waited at least the request delay
      expect(elapsed).toBeGreaterThanOrEqual(scraper.config.requestDelay);
    });
  });

  describe('_parseHTML', () => {
    it('should parse HTML successfully', () => {
      const html = '<html><body><p>Test</p></body></html>';
      const result = scraper._parseHTML(html);

      expect(DOMParser).toHaveBeenCalled();
      expect(result).toBe(mockDocument);
    });

    it('should throw error on parse failure', () => {
      const errorDoc = {
        querySelector: jest.fn().mockReturnValue({ tagName: 'parsererror' })
      };
      
      global.DOMParser.mockImplementation(() => ({
        parseFromString: jest.fn().mockReturnValue(errorDoc)
      }));

      expect(() => scraper._parseHTML('<invalid>')).toThrow('Failed to parse HTML');
    });
  });

  describe('_extractText', () => {
    it('should extract text using first successful selector', () => {
      const mockElement = { textContent: '  Test Text  ' };
      mockDocument.querySelector
        .mockReturnValueOnce(null) // First selector fails
        .mockReturnValueOnce(mockElement); // Second succeeds

      const result = scraper._extractText(mockDocument, ['h1', 'h2'], 'default');

      expect(result).toBe('Test Text');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('h1');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('h2');
    });

    it('should return default when no selectors match', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const result = scraper._extractText(mockDocument, ['h1', 'h2'], 'default');

      expect(result).toBe('default');
    });

    it('should skip empty text content', () => {
      const emptyElement = { textContent: '   ' };
      const validElement = { textContent: 'Valid Text' };
      
      mockDocument.querySelector
        .mockReturnValueOnce(emptyElement)
        .mockReturnValueOnce(validElement);

      const result = scraper._extractText(mockDocument, ['h1', 'h2'], 'default');

      expect(result).toBe('Valid Text');
    });
  });

  describe('_extractTextArray', () => {
    it('should extract array of text elements', () => {
      const mockElements = [
        { textContent: 'Text 1' },
        { textContent: '  Text 2  ' },
        { textContent: '' }, // Should be filtered out
        { textContent: 'Text 3' }
      ];
      
      mockDocument.querySelectorAll.mockReturnValue(mockElements);

      const result = scraper._extractTextArray(mockDocument, ['li']);

      expect(result).toEqual(['Text 1', 'Text 2', 'Text 3']);
    });

    it('should return empty array when no elements found', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const result = scraper._extractTextArray(mockDocument, ['li']);

      expect(result).toEqual([]);
    });
  });

  describe('_formatDate', () => {
    it('should format various date strings correctly', () => {
      expect(scraper._formatDate('January 1, 2025')).toBe('2025-01-01');
      expect(scraper._formatDate('2025-01-01')).toBe('2025-01-01');
      expect(scraper._formatDate('for January 1, 2025')).toBe('2025-01-01');
      expect(scraper._formatDate('puzzle for 2025-01-01 (Wednesday)')).toBe('2025-01-01');
    });

    it('should throw error for invalid dates', () => {
      expect(() => scraper._formatDate('invalid date')).toThrow('Failed to format date');
      expect(() => scraper._formatDate('')).toThrow('Failed to format date');
    });
  });

  describe('_retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await scraper._retryOperation(operation, 'test');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      jest.setTimeout(15000); // Increase timeout for retry tests
      
      // Mock faster retry delays for testing
      scraper.config.retryDelay = 100; // 100ms instead of 2000ms
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');

      const result = await scraper._retryOperation(operation, 'test');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should throw error after max retries', async () => {
      jest.setTimeout(15000); // Increase timeout for retry tests
      
      // Mock faster retry delays for testing
      scraper.config.retryDelay = 100; // 100ms instead of 2000ms
      
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(scraper._retryOperation(operation, 'test')).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(3);
    }, 15000);
  });

  describe('fetchPuzzle implementation', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue(mockResponse);
    });

    it('should fetch and parse puzzle data', async () => {
      const result = await scraper.fetchPuzzle('2025-01-01');

      expect(result).toEqual({
        date: '2025-01-01',
        gameId: 123,
        groups: expect.any(Array),
        source: 'TestScraper'
      });
    });

    it('should use retry logic for fetchPuzzle', async () => {
      // Mock faster retry delays for testing
      scraper.config.retryDelay = 10; // 10ms instead of 2000ms
      
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await scraper.fetchPuzzle('2025-01-01');

      expect(result.date).toBe('2025-01-01');
    }, 10000);
  });

  describe('abstract methods', () => {
    it('should throw error when _buildUrl not implemented', () => {
      const baseScraper = new WebScraperBase('Base');
      expect(() => baseScraper._buildUrl('2025-01-01')).toThrow(
        "Method '_buildUrl()' must be implemented by subclasses"
      );
    });

    it('should throw error when _parseContent not implemented', () => {
      const baseScraper = new WebScraperBase('Base');
      expect(() => baseScraper._parseContent('<html></html>', '2025-01-01')).toThrow(
        "Method '_parseContent()' must be implemented by subclasses"
      );
    });
  });

  describe('configuration options', () => {
    it('should use custom CORS proxy', async () => {
      const customScraper = new TestWebScraper({
        corsProxy: 'https://custom-proxy.com/?url='
      });

      global.fetch.mockRejectedValueOnce(new Error('CORS error'));
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ contents: '<html>content</html>' })
      });

      await customScraper._makeRequest('https://example.com');

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('custom-proxy.com'),
        expect.any(Object)
      );
    });

    it('should respect custom timeout', async () => {
      const customScraper = new TestWebScraper({
        timeout: 5000
      });

      global.fetch.mockImplementation((url, options) => {
        expect(options.timeout).toBe(5000);
        return Promise.resolve(mockResponse);
      });

      await customScraper._makeRequest('https://example.com');
    });
  });
});
