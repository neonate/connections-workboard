import ConnectionsGameFetcher from '../ConnectionsGameFetcher';

// Mock the base class
jest.mock('../WebScraperBase');

describe('ConnectionsGameFetcher', () => {
  let fetcher;
  let mockRequest;
  let mockParseHTML;

  beforeEach(() => {
    fetcher = new ConnectionsGameFetcher();
    
    // Mock the _makeRequest method
    mockRequest = jest.fn();
    fetcher._makeRequest = mockRequest;
    
    // Mock the _parseHTML method
    mockParseHTML = jest.fn();
    fetcher._parseHTML = mockParseHTML;
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(fetcher.getSourceName()).toBe('ConnectionsGame');
      expect(fetcher.baseUrl).toBe('https://connectionsgame.io');
      expect(fetcher.newsUrl).toBe('https://connectionsgame.io/news/connections-answers');
    });

    it('should accept custom configuration', () => {
      const customFetcher = new ConnectionsGameFetcher({ 
        requestDelay: 5000,
        timeout: 20000 
      });
      
      expect(customFetcher.config.requestDelay).toBe(5000);
      expect(customFetcher.config.timeout).toBe(20000);
    });
  });

  describe('_buildUrl', () => {
    it('should return the news URL for any date', () => {
      expect(fetcher._buildUrl('2025-01-01')).toBe(fetcher.newsUrl);
      expect(fetcher._buildUrl('2024-12-25')).toBe(fetcher.newsUrl);
    });
  });

  describe('_parseContent', () => {
    const mockHtml = `
      <html>
        <body>
          <div class="puzzle-content">
            <h2>Connections #456</h2>
            <div class="date">2025-01-15</div>
            <div class="groups">
              <div class="group yellow" data-level="0">
                <h3>YELLOW GROUP</h3>
                <span class="word">APPLE</span>
                <span class="word">BANANA</span>
                <span class="word">CHERRY</span>
                <span class="word">DATE</span>
              </div>
              <div class="group green" data-level="1">
                <h3>GREEN GROUP</h3>
                <span class="word">DOG</span>
                <span class="word">CAT</span>
                <span class="word">BIRD</span>
                <span class="word">FISH</span>
              </div>
              <div class="group blue" data-level="2">
                <h3>BLUE GROUP</h3>
                <span class="word">RED</span>
                <span class="word">BLUE</span>
                <span class="word">GREEN</span>
                <span class="word">YELLOW</span>
              </div>
              <div class="group purple" data-level="3">
                <h3>PURPLE GROUP</h3>
                <span class="word">ONE</span>
                <span class="word">TWO</span>
                <span class="word">THREE</span>
                <span class="word">FOUR</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    beforeEach(() => {
      const mockDoc = {
        body: { textContent: mockHtml },
        querySelectorAll: jest.fn((selector) => {
          if (selector.includes('script')) return [];
          if (selector.includes('group')) return [
            {
              querySelector: jest.fn(() => ({ textContent: 'YELLOW GROUP' })),
              querySelectorAll: jest.fn(() => [
                { textContent: 'APPLE' },
                { textContent: 'BANANA' },
                { textContent: 'CHERRY' },
                { textContent: 'DATE' }
              ])
            },
            {
              querySelector: jest.fn(() => ({ textContent: 'GREEN GROUP' })),
              querySelectorAll: jest.fn(() => [
                { textContent: 'DOG' },
                { textContent: 'CAT' },
                { textContent: 'BIRD' },
                { textContent: 'FISH' }
              ])
            },
            {
              querySelector: jest.fn(() => ({ textContent: 'BLUE GROUP' })),
              querySelectorAll: jest.fn(() => [
                { textContent: 'RED' },
                { textContent: 'BLUE' },
                { textContent: 'GREEN' },
                { textContent: 'YELLOW' }
              ])
            },
            {
              querySelector: jest.fn(() => ({ textContent: 'PURPLE GROUP' })),
              querySelectorAll: jest.fn(() => [
                { textContent: 'ONE' },
                { textContent: 'TWO' },
                { textContent: 'THREE' },
                { textContent: 'FOUR' }
              ])
            }
          ];
          return [];
        }),
        querySelector: jest.fn()
      };

      mockParseHTML.mockReturnValue(mockDoc);
      
      // Mock the helper methods
      fetcher._extractText = jest.fn((doc, selectors, defaultValue) => {
        if (selectors.includes('.date')) return '2025-01-15';
        if (selectors.includes('.game-id')) return '456';
        return defaultValue;
      });
      
      fetcher._extractTextArray = jest.fn((element, selectors) => {
        return ['APPLE', 'BANANA', 'CHERRY', 'DATE'];
      });
    });

    it('should parse HTML structure successfully', () => {
      const result = fetcher._parseContent(mockHtml, '2025-01-15');
      
      expect(result).toBeDefined();
      expect(result.date).toBe('2025-01-15');
      expect(result.source).toBe('ConnectionsGame');
      expect(result.groups).toHaveLength(4);
    });

    it('should handle parsing failures gracefully', () => {
      mockParseHTML.mockImplementation(() => {
        throw new Error('Parse error');
      });
      
      expect(() => fetcher._parseContent('<invalid>', '2025-01-15'))
        .toThrow('Could not parse puzzle data from any known format');
    });
  });

  describe('_generateGameId', () => {
    it('should generate correct game ID for launch date', () => {
      const gameId = fetcher._generateGameId('2023-06-12');
      expect(gameId).toBe(1);
    });

    it('should generate correct game ID for date after launch', () => {
      const gameId = fetcher._generateGameId('2023-06-13');
      expect(gameId).toBe(2);
    });

    it('should handle dates before launch', () => {
      const gameId = fetcher._generateGameId('2023-06-11');
      expect(gameId).toBe(1); // Should return minimum of 1
    });

    it('should generate reasonable game ID for recent date', () => {
      const gameId = fetcher._generateGameId('2024-01-01');
      expect(gameId).toBeGreaterThan(200); // Should be reasonable number
      expect(gameId).toBeLessThan(1000);
    });
  });

  describe('_extractWordsFromText', () => {
    it('should extract and clean words correctly', () => {
      const text = 'Apple, Banana; Cherry & Date!';
      const words = fetcher._extractWordsFromText(text);
      
      expect(words).toEqual(['APPLE', 'BANANA', 'CHERRY', 'DATE']);
    });

    it('should handle empty text', () => {
      const words = fetcher._extractWordsFromText('');
      expect(words).toEqual([]);
    });

    it('should filter out single characters', () => {
      const text = 'A B WORD C ANOTHER D';
      const words = fetcher._extractWordsFromText(text);
      
      expect(words).toEqual(['WORD', 'ANOTHER']);
    });

    it('should limit to 4 words', () => {
      const text = 'ONE TWO THREE FOUR FIVE SIX';
      const words = fetcher._extractWordsFromText(text);
      
      expect(words).toHaveLength(4);
      expect(words).toEqual(['ONE', 'TWO', 'THREE', 'FOUR']);
    });
  });

  describe('_extractGameId', () => {
    it('should extract game ID from various formats', () => {
      expect(fetcher._extractGameId('Game #123')).toBe(123);
      expect(fetcher._extractGameId('Puzzle 456')).toBe(456);
      expect(fetcher._extractGameId('Connections #789')).toBe(789);
      expect(fetcher._extractGameId('#321')).toBe(321);
      expect(fetcher._extractGameId('654')).toBe(654);
    });

    it('should return null for invalid formats', () => {
      expect(fetcher._extractGameId('')).toBeNull();
      expect(fetcher._extractGameId('No numbers here')).toBeNull();
      expect(fetcher._extractGameId('Game #999999')).toBeNull(); // Too large
    });

    it('should return null for unreasonable IDs', () => {
      expect(fetcher._extractGameId('0')).toBeNull();
      expect(fetcher._extractGameId('-5')).toBeNull();
    });
  });

  describe('isAvailable', () => {
    it('should return true when connections content is found', async () => {
      mockRequest.mockResolvedValue({
        text: jest.fn().mockResolvedValue('Welcome to Connections! Yellow group contains...')
      });

      const result = await fetcher.isAvailable('2025-01-15');
      expect(result).toBe(true);
    });

    it('should return true when color groups are mentioned', async () => {
      mockRequest.mockResolvedValue({
        text: jest.fn().mockResolvedValue('Today\'s puzzle has yellow, green, blue, and purple groups.')
      });

      const result = await fetcher.isAvailable('2025-01-15');
      expect(result).toBe(true);
    });

    it('should return false when no connections content found', async () => {
      mockRequest.mockResolvedValue({
        text: jest.fn().mockResolvedValue('This is just a regular website with no puzzle content.')
      });

      const result = await fetcher.isAvailable('2025-01-15');
      expect(result).toBe(false);
    });

    it('should return false when request fails', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'));

      const result = await fetcher.isAvailable('2025-01-15');
      expect(result).toBe(false);
    });
  });

  describe('color group parsing', () => {
    it('should parse color-based groups from text', () => {
      const text = `
        Yellow: APPLE BANANA CHERRY DATE
        Green: DOG CAT BIRD FISH  
        Blue: RED BLUE GREEN YELLOW
        Purple: ONE TWO THREE FOUR
      `;
      
      const mockDoc = {
        body: { textContent: text },
        querySelectorAll: jest.fn(() => []),
        querySelector: jest.fn()
      };
      
      mockParseHTML.mockReturnValue(mockDoc);
      
      const result = fetcher._parseContent(text, '2025-01-15');
      
      expect(result).toBeDefined();
      expect(result.groups).toHaveLength(4);
      expect(result.groups[0].name).toBe('YELLOW GROUP');
      expect(result.groups[0].level).toBe(0);
      expect(result.groups[0].words).toEqual(['APPLE', 'BANANA', 'CHERRY', 'DATE']);
    });
  });

  describe('error handling', () => {
    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div><span>Incomplete';
      
      mockParseHTML.mockImplementation(() => {
        throw new Error('Invalid HTML');
      });
      
      expect(() => fetcher._parseContent(malformedHtml, '2025-01-15'))
        .toThrow('Could not parse puzzle data from any known format');
    });

    it('should handle missing group data', () => {
      const mockDoc = {
        body: { textContent: 'Some content but no groups' },
        querySelectorAll: jest.fn(() => []),
        querySelector: jest.fn()
      };
      
      mockParseHTML.mockReturnValue(mockDoc);
      
      expect(() => fetcher._parseContent('content', '2025-01-15'))
        .toThrow('Could not parse puzzle data from any known format');
    });
  });

  describe('integration scenarios', () => {
    it('should handle real-world HTML structure variations', () => {
      const realWorldHtml = `
        <article class="post">
          <h1>NYT Connections #456 Answers for January 15, 2025</h1>
          <div class="content">
            <p>Today's puzzle features these groups:</p>
            <ul class="puzzle-groups">
              <li data-level="0">Fruits: APPLE, BANANA, CHERRY, DATE</li>
              <li data-level="1">Animals: DOG, CAT, BIRD, FISH</li>  
              <li data-level="2">Colors: RED, BLUE, GREEN, YELLOW</li>
              <li data-level="3">Numbers: ONE, TWO, THREE, FOUR</li>
            </ul>
          </div>
        </article>
      `;
      
      const mockDoc = {
        body: { textContent: realWorldHtml },
        querySelectorAll: jest.fn((selector) => {
          if (selector.includes('li')) {
            return [
              { textContent: 'Fruits: APPLE, BANANA, CHERRY, DATE', getAttribute: () => '0' },
              { textContent: 'Animals: DOG, CAT, BIRD, FISH', getAttribute: () => '1' },
              { textContent: 'Colors: RED, BLUE, GREEN, YELLOW', getAttribute: () => '2' },
              { textContent: 'Numbers: ONE, TWO, THREE, FOUR', getAttribute: () => '3' }
            ];
          }
          return [];
        }),
        querySelector: jest.fn()
      };
      
      mockParseHTML.mockReturnValue(mockDoc);
      
      const result = fetcher._parseContent(realWorldHtml, '2025-01-15');
      
      expect(result).toBeDefined();
      expect(result.groups).toHaveLength(4);
    });
  });
});
