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

  // Memoize the fetch function to fix useEffect dependency warning
  const fetchPuzzleForDate = useCallback(async (date) => {
    console.log('Fetching puzzle for date:', date);
    setIsLoading(true);
    setFetchError('');
    
    try {
      // For now, we'll simulate fetching with sample data
      // In the future, this would be a real API call
      const puzzleData = await simulatePuzzleFetch(date);
      console.log('Received puzzle data:', puzzleData);
      
      if (puzzleData && puzzleData.words && puzzleData.words.length === 16) {
        // Randomize the word order to prevent giving away answers
        const randomizedWords = shuffleArray([...puzzleData.words]);
        console.log('About to set words to:', randomizedWords);
        console.log('About to set groups to:', [[], [], [], []]);
        console.log('About to set hasStartedGame to:', true);
        
        setWords(randomizedWords);
        setGroups([[], [], [], []]);
        setHasStartedGame(true);
        setInputText(''); // Clear manual input since we fetched automatically
        
        console.log('State update calls completed');
      } else {
        // Invalid puzzle data received
        const errorMsg = `Invalid puzzle data received for ${date}. Expected 16 words, got ${puzzleData?.words?.length || 0}`;
        console.error(errorMsg);
        setFetchError(errorMsg);
        // Don't start the game, keep user on input screen
        setWords([]);
        setGroups([[], [], [], []]);
        setHasStartedGame(false);
      }
    } catch (error) {
      const errorMsg = `Failed to fetch puzzle for ${date}: ${error.message}`;
      console.error('Puzzle fetch error:', error);
      setFetchError(errorMsg);
      // Don't start the game, keep user on input screen
      setWords([]);
      setGroups([[], [], [], []]);
      setHasStartedGame(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Fetch puzzle from external source (Mashable)
  const fetchRealPuzzle = async (date) => {
    try {
      console.log(`Fetching real puzzle for date: ${date}`);
      
      // Convert numeric date to Mashable URL format (e.g., "2025-07-02" -> "july-2-2025")
      // Parse date as local time to avoid timezone conversion issues
      const [yearStr, monthStr, dayStr] = date.split('-');
      const monthIndex = parseInt(monthStr) - 1; // Month is 0-indexed in JavaScript
      const day = parseInt(dayStr);
      const year = parseInt(yearStr);
      
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthName = monthNames[monthIndex];
      
      console.log(`Date conversion debug:`);
      console.log(`  Input date: ${date}`);
      console.log(`  Parsed components: year=${year}, month=${monthStr} (index=${monthIndex}), day=${dayStr}`);
      console.log(`  Month name: ${monthName}`);
      console.log(`  Final URL date: ${monthName}-${day}-${year}`);
      
      // Try multiple URL patterns that Mashable might use
      const urlPatterns = [
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-hint-answer-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-answers-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-${monthName}-${day}-${year}`
      ];
      
      // CORS proxy options to try if direct fetch fails
      const corsProxies = [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://thingproxy.freeboard.io/fetch/'
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
      
      // First try direct fetch with all URL patterns
      for (let i = 0; i < urlPatterns.length; i++) {
        const url = urlPatterns[i];
        console.log(`Trying direct fetch - URL pattern ${i + 1}: ${url}`);
        
        try {
          // Random delay to avoid being blocked
          const delay = Math.random() * 2000 + 1000; // 1-3 seconds
          console.log(`Waiting ${Math.round(delay)}ms before fetch...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const response = await fetch(url, {
            method: 'GET',
            headers,
            credentials: 'omit',
            mode: 'cors',
            redirect: 'follow' // Follow redirects
          });
          
          console.log(`Response status: ${response.status}, URL: ${response.url}`);
          
          if (response.ok) {
            const html = await response.text();
            console.log(`Successfully fetched HTML from ${response.url} (${html.length} characters)`);
            
            // Check if we got redirected to a different page
            if (response.url !== url) {
              console.log(`Redirected from ${url} to ${response.url}`);
            }
            
            // Set the successful fetch URL for display
            setFetchUrl(response.url);
            
            return parsePuzzleWordsFromHTML(html, date);
          } else if (response.status === 404) {
            console.log(`404 for ${url}, trying next pattern...`);
            lastError = new Error(`Page not found: ${url}`);
            continue;
          } else {
            console.log(`HTTP ${response.status} for ${url}, trying next pattern...`);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            continue;
          }
          
        } catch (error) {
          console.log(`Direct fetch failed for ${url}:`, error.message);
          lastError = error;
          continue;
        }
      }
      
      // If direct fetch failed, try CORS proxies
      console.log('Direct fetch failed for all URLs, trying CORS proxies...');
      
      for (let proxyIndex = 0; proxyIndex < corsProxies.length; proxyIndex++) {
        const proxy = corsProxies[proxyIndex];
        console.log(`Trying CORS proxy ${proxyIndex + 1}: ${proxy}`);
        
        for (let urlIndex = 0; urlIndex < urlPatterns.length; urlIndex++) {
          const url = urlPatterns[urlIndex];
          const proxyUrl = proxy + url;
          
          console.log(`Trying proxy ${proxyIndex + 1} with URL pattern ${urlIndex + 1}: ${proxyUrl}`);
          
          try {
            // Random delay to avoid being blocked
            const delay = Math.random() * 2000 + 1000; // 1-3 seconds
            console.log(`Waiting ${Math.round(delay)}ms before proxy fetch...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const response = await fetch(proxyUrl, {
              method: 'GET',
              headers: {
                ...headers,
                'Origin': 'https://mashable.com' // Some proxies need this
              },
              credentials: 'omit',
              mode: 'cors'
            });
            
            console.log(`Proxy response status: ${response.status}`);
            
            if (response.ok) {
              const html = await response.text();
              console.log(`Successfully fetched HTML via proxy (${html.length} characters)`);
              
              // Set the successful fetch URL for display (original URL, not proxy URL)
              setFetchUrl(url);
              
              return parsePuzzleWordsFromHTML(html, date);
            } else {
              console.log(`Proxy returned ${response.status}, trying next...`);
              continue;
            }
            
          } catch (error) {
            console.log(`Proxy ${proxyIndex + 1} failed for ${url}:`, error.message);
            continue;
          }
        }
      }
      
      // If we get here, both direct fetch and CORS proxies failed
      throw new Error(`All fetch methods failed. Last error: ${lastError?.message}`);
      
    } catch (error) {
      console.error('Failed to fetch real puzzle:', error);
      throw error;
    }
  };

  // Parse puzzle words from HTML (specifically for Mashable NYT Connections articles)
  const parsePuzzleWordsFromHTML = (html, date) => {
    try {
      console.log('Parsing Mashable HTML for NYT Connections puzzle words...');
      
      const foundWords = new Set();
      
      // Pattern 1: Look for the specific solution section format that contains the actual puzzle answers
      // This should be the most reliable pattern - the actual solution section
      const solutionPattern = /\*\s*([^:]+):\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20})/gi;
      let solutionMatch;
      
      while ((solutionMatch = solutionPattern.exec(html)) !== null) {
        const category = solutionMatch[1];
        const words = [solutionMatch[2], solutionMatch[3], solutionMatch[4], solutionMatch[5]];
        
        console.log(`Found solution category "${category}" with words:`, words);
        
        words.forEach(word => {
          if (word && word.length >= 3 && word.length <= 20) {
            foundWords.add(word.trim());
          }
        });
      }
      
      // Pattern 2: Look for the older format used in some articles
      const olderFormatPattern = /\*\s*([A-Za-z]+)\s*-\s*\*\*([^*]+)\*\*\s*-\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20})/gi;
      let olderMatch;
      
      while ((olderMatch = olderFormatPattern.exec(html)) !== null) {
        const color = olderMatch[1];
        const category = olderMatch[2];
        const words = [olderMatch[3], olderMatch[4], olderMatch[5], olderMatch[6]];
        
        console.log(`Found older format category "${category}" (${color}) with words:`, words);
        
        words.forEach(word => {
          if (word && word.length >= 3 && word.length <= 20) {
            foundWords.add(word.trim());
          }
        });
      }
      
      // If we found words in the solution format, use those (most reliable)
      if (foundWords.size >= 16) {
        const words = Array.from(foundWords).slice(0, 16);
        console.log('Successfully parsed puzzle words from solution format:', words);
        return { words, date };
      }
      
      // Pattern 3: Look for words specifically in the "What is the answer to Connections today" section
      // This is usually the most reliable section for the actual puzzle answers
      const answerSectionPattern = /What is the answer to Connections today[^]*?(\*\s*[^:]+:\s*[A-Z]{3,20},\s*[A-Z]{3,20},\s*[A-Z]{3,20},\s*[A-Z]{3,20})/gi;
      let answerSectionMatch;
      
      while ((answerSectionMatch = answerSectionPattern.exec(html)) !== null) {
        const match = answerSectionMatch[1];
        const wordMatch = match.match(/([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20})/);
        
        if (wordMatch) {
          const words = [wordMatch[1], wordMatch[2], wordMatch[3], wordMatch[4]];
          console.log(`Found words in answer section:`, words);
          
          words.forEach(word => {
            if (word && word.length >= 3 && word.length <= 20) {
              foundWords.add(word.trim());
            }
          });
        }
      }
      
      // If we found words in the answer section, use those
      if (foundWords.size >= 16) {
        const words = Array.from(foundWords).slice(0, 16);
        console.log('Successfully parsed puzzle words from answer section:', words);
        return { words, date };
      }
      
      // Fallback: Only if we absolutely can't find the solution format, try other patterns
      // But be much more restrictive to avoid picking up random page content
      console.log('Solution format not found, trying restrictive fallback patterns...');
      
      const restrictivePatterns = [
        // Look for words that are likely puzzle answers (in specific contexts)
        /<strong[^>]*>([A-Z]{3,20})<\/strong>/gi,
        /<b[^>]*>([A-Z]{3,20})<\/b>/gi
      ];
      
      for (const pattern of restrictivePatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          let word = match[1];
          word = word.trim().toUpperCase();
          
          // Much more restrictive filtering - only words that look like puzzle answers
          if (word.length >= 3 && word.length <= 20 && 
              /^[A-Z]+$/.test(word) && // Only letters, no numbers or special chars
              !['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'NYT', 'CONNECTIONS', 'TODAY', 'HINTS', 'ANSWERS', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'UUID', 'RSS', 'API', 'HTTP', 'HTML', 'CSS', 'JS', 'PHP', 'SQL', 'XML', 'JSON', 'URL', 'DOM', 'CPU', 'RAM', 'USB', 'HDD', 'SSD', 'GPU', 'VPN', 'DNS', 'IP', 'MAC', 'PC', 'TV', 'CD', 'DVD', 'MP3', 'MP4', 'PDF', 'ZIP', 'RAR', 'EXE', 'TXT', 'DOC', 'XLS', 'PPT'].includes(word)) {
            foundWords.add(word);
          }
        }
      }
      
      console.log('Found potential words (restrictive fallback):', Array.from(foundWords));
      
      if (foundWords.size >= 16) {
        const words = Array.from(foundWords).slice(0, 16);
        console.log('Parsed words from restrictive fallback patterns:', words);
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
                  className={`group-area ${dragOverGroup === groupIndex ? 'drag-over' : ''} ${isGroupFull(groupIndex) ? 'group-full' : ''}`}
                  onDragOver={(e) => handleDragOver(e, groupIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, groupIndex)}
                >
                  <h3>
                    Group {groupIndex + 1} 
                    <span className="group-count">({group.length}/4)</span>
                  </h3>
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
