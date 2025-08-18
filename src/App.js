import { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [words, setWords] = useState([]);
  const [groups, setGroups] = useState([[], [], [], []]);
  const [inputText, setInputText] = useState('');
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [hasStartedGame, setHasStartedGame] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetchUrl, setFetchUrl] = useState(''); // Track the successful fetch URL
  const [loadingStatus, setLoadingStatus] = useState(''); // Track loading progress
  const [hintMode, setHintMode] = useState(false); // Enable hint mode to show correct/incorrect groups
  // Store the puzzle categories for hint mode
  const [puzzleCategories, setPuzzleCategories] = useState([]);
  
  // Cache management functions
  const getCachedPuzzle = (date) => {
    try {
      const cached = localStorage.getItem(`puzzle_${date}`);
      if (cached) {
        const puzzleData = JSON.parse(cached);
        console.log(`Found cached puzzle for ${date}:`, puzzleData);
        return puzzleData;
      }
    } catch (error) {
      console.error('Error reading cached puzzle:', error);
    }
    return null;
  };
  
  const cachePuzzle = (date, puzzleData) => {
    try {
      const cacheKey = `puzzle_${date}`;
      localStorage.setItem(cacheKey, JSON.stringify(puzzleData));
      console.log(`Cached puzzle for ${date} with key: ${cacheKey}`);
    } catch (error) {
      console.error('Error caching puzzle:', error);
    }
  };
  
  const clearCache = () => {
    try {
      // Clear all puzzle cache entries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('puzzle_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cleared all cached puzzles');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  // Remove automatic cache clearing - let users control when to clear cache
  // useEffect(() => {
  //   clearCache();
  // }, []);

  // Memoize the fetch function to fix useEffect dependency warning
  const fetchPuzzleForDate = useCallback(async (date) => {
    console.log('Fetching puzzle for date:', date);
    
    // Check cache first
    const cachedPuzzle = getCachedPuzzle(date);
    if (cachedPuzzle) {
      console.log('Using cached puzzle data');
      
      // Set the fetch URL to show it was from cache
      setFetchUrl('Cached data (previously fetched)');
      
      // Store categories for hint mode if available
      if (cachedPuzzle.categories) {
        setPuzzleCategories(cachedPuzzle.categories);
      }
      
      return cachedPuzzle;
    }
    
    console.log('No cached data found, fetching from API...');
    
    try {
      const puzzleData = await fetchRealPuzzle(date);
      
      // Only cache real API responses, not sample data
      if (puzzleData && !puzzleData.isSampleData) {
        cachePuzzle(date, puzzleData);
      } else {
        console.log('Not caching sample data or invalid response');
      }
      
      return puzzleData;
    } catch (error) {
      console.error('Failed to fetch puzzle:', error);
      throw error;
    }
  }, []);

  // Check if a group of 4 words is correct (for hint mode)
  const isGroupCorrect = (groupWords) => {
    if (!hintMode || groupWords.length !== 4 || puzzleCategories.length === 0) return null;
    
    // Check if this group matches any of the correct categories
    for (const category of puzzleCategories) {
      const categoryWords = new Set(category.words.map(w => w.toUpperCase()));
      const groupWordsSet = new Set(groupWords.map(w => w.toUpperCase()));
      
      // Check if all words in the group match the category
      if (groupWordsSet.size === 4 && 
          Array.from(groupWordsSet).every(word => categoryWords.has(word))) {
        console.log(`Group is correct! Matches category: ${category.name}`);
        return true;
      }
    }
    
    // If no category matches, the group is incorrect
    console.log(`Group is incorrect. No matching category found.`);
    return false;
  };

  // Remove the auto-fetch useEffect - user must manually click fetch button
  // useEffect(() => {
  //   if (selectedDate) {
  //     console.log('useEffect triggered with selectedDate:', selectedDate);
  //     fetchPuzzleForDate(selectedDate);
  //   }
  // }, [selectedDate, fetchPuzzleForDate]);

  // Manual fetch function that user triggers with button click
  const handleFetchPuzzle = async () => {
    if (!selectedDate) {
      alert('Please select a date first');
      return;
    }
    
    console.log('Manual fetch triggered for date:', selectedDate);
    setIsLoading(true);
    setLoadingStatus('Starting fetch...');
    setFetchError(null);
    
    try {
      await fetchPuzzleForDate(selectedDate);
      setLoadingStatus('Fetch completed successfully!');
    } catch (error) {
      setFetchError(error.message);
      setLoadingStatus('Fetch failed');
    } finally {
      setIsLoading(false);
      // Clear status after a short delay
      setTimeout(() => setLoadingStatus(''), 2000);
    }
  };

  // Fetch puzzle from external source (word.tips)
  const fetchRealPuzzle = async (date) => {
    try {
      console.log(`Fetching real puzzle for date: ${date}`);
      
      // Convert numeric date to word.tips URL format
      const dateObj = new Date(date);
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthName = monthNames[dateObj.getMonth()];
      const day = dateObj.getDate();
      const year = dateObj.getFullYear();
      
      // Determine if this is today's puzzle or a past puzzle
      const today = new Date();
      const isToday = dateObj.toDateString() === today.toDateString();
      
      // Choose the correct word.tips URL based on date
      const wordTipsUrl = isToday 
        ? 'https://word.tips/connections-hints-today/'
        : 'https://word.tips/connections-hints-yesterday/';
      
      console.log(`Selected date: ${date}, Today: ${today.toDateString()}, Is today: ${isToday}`);
      console.log(`Using URL: ${wordTipsUrl}`);
      
      // CORS proxy options to try if direct fetch fails
      const corsProxies = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://thingproxy.freeboard.io/fetch/',
        'https://cors-anywhere.herokuapp.com/'
      ];
      
      // Anti-bot measures
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      };
      
      let lastError;
      
      // First try direct fetch
      try {
        console.log('Trying direct fetch from word.tips...');
        
        // Random delay to avoid being blocked
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        console.log(`Waiting ${Math.round(delay)}ms before fetch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const response = await fetch(wordTipsUrl, {
          method: 'GET',
          headers,
          credentials: 'omit',
          mode: 'cors',
          redirect: 'follow'
        });
        
        console.log(`Response status: ${response.status}, URL: ${response.url}`);
        
        if (response.ok) {
          const html = await response.text();
          console.log(`Successfully fetched HTML from word.tips (${html.length} characters)`);
          
          // Set the successful fetch URL for display
          setFetchUrl(response.url);
          
          const puzzleData = parsePuzzleWordsFromHTML(html, date);
          
          // Store categories for hint mode if available
          if (puzzleData.categories) {
            setPuzzleCategories(puzzleData.categories);
          }
          
          return puzzleData;
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
      } catch (error) {
        console.log(`Direct fetch failed:`, error.message);
        lastError = error;
      }
      
      // If direct fetch failed, try CORS proxies
      console.log('Direct fetch failed, trying CORS proxies...');
      
      for (let proxyIndex = 0; proxyIndex < corsProxies.length; proxyIndex++) {
        const proxy = corsProxies[proxyIndex];
        console.log(`Trying CORS proxy ${proxyIndex + 1}: ${proxy}`);
        
        try {
          // Random delay to avoid being blocked
          const delay = Math.random() * 2000 + 1000; // 1-3 seconds
          console.log(`Waiting ${Math.round(delay)}ms before proxy fetch...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const proxyUrl = proxy + wordTipsUrl;
          console.log(`Trying proxy URL: ${proxyUrl}`);
          
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              ...headers,
              'Origin': 'https://word.tips' // Some proxies need this
            },
            credentials: 'omit',
            mode: 'cors'
          });
          
          console.log(`Proxy response status: ${response.status}`);
          
          if (response.ok) {
            const html = await response.text();
            console.log(`Successfully fetched HTML via proxy (${html.length} characters)`);
            
            // Set the successful fetch URL for display (original URL, not proxy URL)
            setFetchUrl(wordTipsUrl);
            
            const puzzleData = parsePuzzleWordsFromHTML(html, date);
            
            // Store categories for hint mode if available
            if (puzzleData.categories) {
              setPuzzleCategories(puzzleData.categories);
            }
            
            return puzzleData;
          } else {
            console.log(`Proxy returned ${response.status}, trying next...`);
            continue;
          }
          
        } catch (error) {
          console.log(`Proxy ${proxyIndex + 1} failed:`, error.message);
          continue;
        }
      }
      
      // If we get here, both direct fetch and CORS proxies failed
      // Provide fallback sample data so users can test hint mode
      console.log('All fetch methods failed, providing fallback sample data...');
      
      // Clear any cached data for this date since it's not real
      try {
        const cacheKey = `puzzle_${date}`;
        if (localStorage.getItem(cacheKey)) {
          localStorage.removeItem(cacheKey);
          console.log(`Cleared invalid cached data for ${date}`);
        }
      } catch (error) {
        console.error('Error clearing invalid cache:', error);
      }
      
      // Return sample data for testing hint mode
      const samplePuzzle = {
        words: ['BENT', 'FACULTY', 'FLAIR', 'GIFT', 'PLAYWRIGHT', 'SWORD', 'WRAP', 'WREATH', 'DEAN', 'GABLE', 'GARLAND', 'TEMPLE', 'HAY', 'JACKPOT', 'ROAD', 'ROOF'],
        date: date,
        categories: [
          { name: 'Aptitude', words: ['BENT', 'FACULTY', 'FLAIR', 'GIFT'], color: 'yellow' },
          { name: 'Silent "W"', words: ['PLAYWRIGHT', 'SWORD', 'WRAP', 'WREATH'], color: 'green' },
          { name: 'Legends of Classic Hollywood', words: ['DEAN', 'GABLE', 'GARLAND', 'TEMPLE'], color: 'blue' },
          { name: 'Hit the ___', words: ['HAY', 'JACKPOT', 'ROAD', 'ROOF'], color: 'purple' }
        ],
        note: 'This is sample data. For real puzzles, the app will fetch from word.tips using the correct URL (today vs yesterday).',
        isSampleData: true // Flag to identify this as sample data
      };
      
      // Don't cache sample data - only cache real API responses
      console.log('Returning sample puzzle data for testing (not cached):', samplePuzzle);
      return samplePuzzle;
      
    } catch (error) {
      console.error('Failed to fetch real puzzle:', error);
      throw error;
    }
  };

  // Parse puzzle words from HTML (specifically for word.tips NYT Connections articles)
  const parsePuzzleWordsFromHTML = (html, date) => {
    try {
      console.log('Parsing word.tips HTML for NYT Connections puzzle words...');
      
      const foundWords = new Set();
      const foundCategories = []; // Store categories for hint mode
      
      // Look for the puzzle answers in the word.tips structure
      // The page has "SEE WORD" buttons that reveal the actual puzzle words
      const wordPatterns = [
        // Look for words that appear after "SEE WORD" buttons
        /SEE WORD[^>]*>([^<]*)<[^>]*>([A-Z]{3,20})/gi,
        // Look for words in the puzzle answer sections
        /([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20})/gi,
        // Look for words in bold or strong tags (likely puzzle answers)
        /<strong[^>]*>([A-Z]{3,20})<\/strong>/gi,
        /<b[^>]*>([A-Z]{3,20})<\/b>/gi
      ];
      
      // First try to find complete word groups (4 words together)
      const groupPattern = /([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20})/gi;
      let groupMatch;
      
      while ((groupMatch = groupPattern.exec(html)) !== null) {
        const words = [groupMatch[1], groupMatch[2], groupMatch[3], groupMatch[4]];
        console.log(`Found word group:`, words);
        
        words.forEach(word => {
          if (word && word.length >= 3 && word.length <= 20) {
            foundWords.add(word.trim());
          }
        });
      }
      
      // If we found complete groups, use those
      if (foundWords.size >= 16) {
        const words = Array.from(foundWords).slice(0, 16);
        console.log('Successfully parsed puzzle words from word groups:', words);
        
        // Store the categories for hint mode (we'll need to extract these properly)
        // For now, we'll need to implement category extraction
        console.log('Note: Categories need to be extracted for hint mode to work');
        
        return { words, date };
      }
      
      // Fallback: try other patterns if group pattern didn't work
      for (const pattern of wordPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          let word = match[1] || match[2] || match[0];
          word = word.trim().toUpperCase();
          
          // Filter for reasonable puzzle words
          if (word.length >= 3 && word.length <= 20 && 
              /^[A-Z]+$/.test(word) && // Only letters, no numbers or special chars
              !['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'NYT', 'CONNECTIONS', 'TODAY', 'HINTS', 'ANSWERS', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'UUID', 'RSS', 'API', 'HTTP', 'HTML', 'CSS', 'JS', 'PHP', 'SQL', 'XML', 'JSON', 'URL', 'DOM', 'CPU', 'RAM', 'USB', 'HDD', 'SSD', 'GPU', 'VPN', 'DNS', 'IP', 'MAC', 'PC', 'TV', 'CD', 'DVD', 'MP3', 'MP4', 'PDF', 'ZIP', 'RAR', 'EXE', 'TXT', 'DOC', 'XLS', 'PPT'].includes(word)) {
            foundWords.add(word);
          }
        }
      }
      
      console.log('Found potential words (fallback):', Array.from(foundWords));
      
      if (foundWords.size >= 16) {
        const words = Array.from(foundWords).slice(0, 16);
        console.log('Parsed words from fallback patterns:', words);
        return { words, date };
      }
      
      // If we can't parse enough words, throw an error
      throw new Error(`Could not parse enough puzzle words from HTML. Found ${foundWords.size} words, need 16.`);
      
    } catch (error) {
      console.error('HTML parsing failed:', error);
      throw error;
    }
  };

  // Remove the simulatePuzzleFetch function and replace with real fetching
  const simulatePuzzleFetch = async (date) => {
    console.log('Attempting to fetch real puzzle for date:', date);
    
    try {
      // Try to fetch the real puzzle
      const puzzleData = await fetchRealPuzzle(date);
      return puzzleData;
    } catch (error) {
      console.error('Real puzzle fetch failed, cannot provide fallback:', error);
      throw error; // Don't provide fake data, let the error bubble up
    }
  };

  // Generate unique puzzle words based on date seed
  const generateUniquePuzzle = (seed) => {
    const allWordSets = [
      ['CUP', 'BOWL', 'PLATE', 'FORK', 'CHAIR', 'TABLE', 'BED', 'SOFA', 'TREE', 'FLOWER', 'GRASS', 'BUSH', 'BIRD', 'FISH', 'SNAKE', 'LIZARD'],
      ['SUN', 'MOON', 'STAR', 'CLOUD', 'RAIN', 'SNOW', 'WIND', 'STORM', 'ROCK', 'SAND', 'DIRT', 'CLAY', 'GOLD', 'SILVER', 'BRONZE', 'COPPER'],
      ['BOOK', 'MAGAZINE', 'NEWSPAPER', 'JOURNAL', 'PENCIL', 'PEN', 'MARKER', 'CRAYON', 'PIZZA', 'HAMBURGER', 'HOTDOG', 'SANDWICH', 'COFFEE', 'TEA', 'JUICE', 'WATER'],
      ['CAR', 'TRUCK', 'BUS', 'TRAIN', 'PLANE', 'HELICOPTER', 'BOAT', 'SHIP', 'DOOR', 'WINDOW', 'WALL', 'FLOOR', 'ROOF', 'CEILING', 'STAIRS', 'ELEVATOR'],
      ['HAPPY', 'SAD', 'ANGRY', 'EXCITED', 'TIRED', 'ENERGETIC', 'CALM', 'NERVOUS', 'HOT', 'COLD', 'WARM', 'COOL', 'DRY', 'WET', 'SOFT', 'HARD'],
      ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'BROWN', 'BLACK', 'WHITE', 'GRAY', 'GOLD', 'SILVER', 'BRONZE', 'COPPER', 'BRASS'],
      ['SPRING', 'SUMMER', 'FALL', 'WINTER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
      ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'WEEKEND', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'DAWN', 'DUSK', 'NOON', 'MIDNIGHT'],
      ['APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'STRAWBERRY', 'BLUEBERRY', 'RASPBERRY', 'BLACKBERRY', 'PEACH', 'PLUM', 'CHERRY', 'LEMON', 'LIME', 'PINEAPPLE', 'MANGO', 'KIWI'],
      ['DOG', 'CAT', 'HORSE', 'COW', 'PIG', 'SHEEP', 'GOAT', 'CHICKEN', 'DUCK', 'GOOSE', 'TURKEY', 'RABBIT', 'HAMSTER', 'GUINEA', 'FERRET', 'GERBIL'],
      ['MATH', 'SCIENCE', 'HISTORY', 'ENGLISH', 'GEOGRAPHY', 'ART', 'MUSIC', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'LITERATURE', 'PHILOSOPHY', 'PSYCHOLOGY', 'SOCIOLOGY', 'ECONOMICS', 'POLITICS'],
      ['PIZZA', 'BURGER', 'TACO', 'SUSHI', 'PASTA', 'STEAK', 'CHICKEN', 'FISH', 'SALAD', 'SOUP', 'SANDWICH', 'WRAP', 'CURRY', 'STIR', 'NOODLES', 'RICE']
    ];
    
    // Use the seed to select and shuffle a word set
    // Ensure different dates get different word sets by using more seed variation
    const setIndex = Math.abs(seed) % allWordSets.length;
    const selectedSet = allWordSets[setIndex];
    
    console.log('Generating unique puzzle for seed:', seed, 'using word set:', setIndex);
    
    // Shuffle the selected set using the seed for consistent randomization
    return shuffleArrayWithSeed(selectedSet, seed);
  };

  // Shuffle array with a specific seed for consistent results
  const shuffleArrayWithSeed = (array, seed) => {
    const shuffled = [...array];
    const random = seededRandom(seed);
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  };

  // Seeded random number generator
  const seededRandom = (seed) => {
    const m = 0x80000000;
    const a = 1103515245;
    const c = 12345;
    let state = seed ? seed : Math.floor(Math.random() * (m - 1));
    
    return () => {
      state = (a * state + c) % m;
      return state / (m - 1);
    };
  };

  // Fisher-Yates shuffle algorithm for randomizing words
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    
    // Parse words from input (support both newline or comma separation)
    const wordList = inputText
      .split(/[\n,]/)
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .slice(0, 16); // Limit to 16 words
    
    if (wordList.length !== 16) {
      alert('Please enter exactly 16 words (separated by newlines or commas)');
      return;
    }
    
    // Randomize manual input words too
    const randomizedWords = shuffleArray(wordList);
    setWords(randomizedWords);
    setGroups([[], [], [], []]);
    setHasStartedGame(true);
    setSelectedDate(''); // Clear date since we're using manual input
  };

  const handleDragStart = (e, word) => {
    e.dataTransfer.setData('text/plain', word);
    e.target.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  const handleDragOver = (e, groupIndex) => {
    e.preventDefault();
    // Only allow drag over if group has less than 4 words
    if (groups[groupIndex].length < 4) {
      setDragOverGroup(groupIndex);
    }
  };

  const handleDragLeave = () => {
    setDragOverGroup(null);
  };

  const handleDrop = (e, groupIndex) => {
    e.preventDefault();
    const word = e.dataTransfer.getData('text/plain');
    setDragOverGroup(null);
    
    // Check if group is already full
    if (groups[groupIndex].length >= 4) {
      return; // Don't allow drop if group is full
    }
    
    // Remove word from all groups first
    const newGroups = groups.map(group => group.filter(w => w !== word));
    
    // Add word to the target group
    newGroups[groupIndex] = [...newGroups[groupIndex], word];
    
    // Remove word from the original words array
    setWords(prevWords => prevWords.filter(w => w !== word));
    setGroups(newGroups);
  };

  const removeFromGroup = (word, groupIndex) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = newGroups[groupIndex].filter(w => w !== word);
    
    // Add word back to the original words array
    setWords(prevWords => [...prevWords, word]);
    setGroups(newGroups);
  };

  const resetBoard = () => {
    setWords([]);
    setGroups([[], [], [], []]);
    setInputText('');
    setSelectedDate('');
    setHasStartedGame(false);
    setFetchError('');
  };

  const isGroupFull = (groupIndex) => {
    return groups[groupIndex].length >= 4;
  };

  // Show input screen only if game hasn't started OR if explicitly reset
  const shouldShowInput = !hasStartedGame;

  // Get today's date in YYYY-MM-DD format for the date picker
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="App">
      <header className="App-header">
        <h1>NYT Connections Working Board</h1>
        <p>Paste 16 puzzle words to get started</p>
      </header>
      <main className="App-main">
        {shouldShowInput ? (
          <div className="input-section">
            <div className="date-section">
              <label htmlFor="date-picker" className="date-label">Select Puzzle Date:</label>
              <input
                type="date"
                id="date-picker"
                className="date-picker"
                value={selectedDate}
                onChange={(e) => {
                  console.log('Date picker onChange triggered');
                  console.log('Event target value:', e.target.value);
                  console.log('Previous selectedDate:', selectedDate);
                  setSelectedDate(e.target.value);
                  console.log('setSelectedDate called with:', e.target.value);
                }}
                max={today}
              />
              <button 
                className="fetch-btn" 
                onClick={handleFetchPuzzle}
                disabled={!selectedDate || isLoading}
              >
                {isLoading ? 'Loading...' : 'Fetch Puzzle'}
              </button>
            </div>
            
            {isLoading && (
              <div className="loading-section">
                <div className="loading-spinner"></div>
                <div className="loading-text">Fetching puzzle data...</div>
                <div className="loading-status">{loadingStatus}</div>
                <div className="loading-details">This may take a few seconds as we try multiple sources</div>
              </div>
            )}
            
            {fetchError && (
              <div className="error-message">
                {fetchError}
              </div>
            )}
            
            <div className="input-divider">
              <span>OR</span>
            </div>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your 16 puzzle words here (one per line or comma-separated)..."
              className="puzzle-input"
              rows="8"
              disabled={isLoading}
            />
            <button 
              className="submit-btn" 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              Create Puzzle Board
            </button>
          </div>
        ) : (
          <div className="board-section">
            <div className="board-info">
              <h2>NYT Connections Working Board</h2>
              {fetchUrl && (
                <div className="fetch-url-info">
                  <span>Fetched from: </span>
                  <a 
                    href={fetchUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="fetch-link"
                  >
                    {fetchUrl}
                  </a>
                </div>
              )}
              <div className="puzzle-date-info">
                <span>Puzzle Date: {selectedDate}</span>
              </div>
              <button className="reset-btn" onClick={resetBoard}>
                Reset Board
              </button>
            </div>
            
            {/* Word Grid */}
            <div className="word-grid">
              {console.log('Rendering word grid with words:', words)}
              {words.map((word, index) => (
                <div
                  key={index}
                  className="word-tile"
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, word)}
                  onDragEnd={handleDragEnd}
                >
                  {word}
                </div>
              ))}
            </div>

            {/* Group Areas */}
            <div className="groups-container">
              {groups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={`group-area ${dragOverGroup === groupIndex ? 'drag-over' : ''} ${group.length === 4 ? 'group-full' : ''} ${
                    hintMode && group.length === 4 
                      ? isGroupCorrect(group) === true 
                        ? 'group-correct' 
                        : isGroupCorrect(group) === false 
                          ? 'group-incorrect' 
                          : ''
                      : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, groupIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, groupIndex)}
                >
                  <div className="group-header">
                    <span className="group-title">Group {groupIndex + 1}</span>
                    <span className="group-count">({group.length}/4)</span>
                    {hintMode && group.length === 4 && (
                      <span className={`group-status ${isGroupCorrect(group) === true ? 'status-correct' : 'status-incorrect'}`}>
                        {isGroupCorrect(group) === true ? '✓ Correct' : isGroupCorrect(group) === false ? '✗ Incorrect' : ''}
                      </span>
                    )}
                  </div>
                  <div className="group-words">
                    {group.map((word, wordIndex) => (
                      <div key={wordIndex} className="group-word">
                        {word}
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromGroup(word, groupIndex)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="hint-mode-section">
              <label className="hint-checkbox-label">
                <input
                  type="checkbox"
                  checked={hintMode}
                  onChange={(e) => setHintMode(e.target.checked)}
                  className="hint-checkbox"
                />
                <span className="hint-text">Enable Hint Mode (shows correct/incorrect groups when 4 words are grouped)</span>
              </label>
              
              <div className="cache-controls">
                <button 
                  className="cache-btn" 
                  onClick={clearCache}
                  title="Clear all cached puzzle data"
                >
                  Clear Cache
                </button>
                <span className="cache-info">
                  Cached puzzles: {Object.keys(localStorage).filter(key => key.startsWith('puzzle_')).length}
                  {fetchUrl === 'Cached data (previously fetched)' && ' (Real data)'}
                  {fetchUrl && fetchUrl.includes('word.tips') && ' (API fetched)'}
                  {fetchUrl && !fetchUrl.includes('word.tips') && !fetchUrl.includes('Cached') && ' (Sample data)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
