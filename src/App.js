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
  const [fetchError, setFetchError] = useState('');

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

  // Auto-fetch puzzle when date changes
  useEffect(() => {
    console.log('useEffect triggered with selectedDate:', selectedDate);
    if (selectedDate) {
      console.log('Selected date:', selectedDate);
      console.log('Selected date type:', typeof selectedDate);
      console.log('Selected date length:', selectedDate.length);
      console.log('Selected date split by T:', selectedDate.split('T'));
      fetchPuzzleForDate(selectedDate);
    }
  }, [selectedDate, fetchPuzzleForDate]);

  // Fetch puzzle from external source (Mashable)
  const fetchRealPuzzle = async (date) => {
    try {
      console.log(`Fetching real puzzle for date: ${date}`);
      
      // Convert numeric date to Mashable URL format (e.g., "2025-07-02" -> "july-2-2025")
      const dateObj = new Date(date);
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthName = monthNames[dateObj.getMonth()];
      const day = dateObj.getDate();
      const year = dateObj.getFullYear();
      
      console.log(`Date conversion debug:`);
      console.log(`  Input date: ${date}`);
      console.log(`  Date object: ${dateObj}`);
      console.log(`  Month index: ${dateObj.getMonth()}`);
      console.log(`  Month name: ${monthName}`);
      console.log(`  Day: ${day}`);
      console.log(`  Year: ${year}`);
      
      // Try multiple URL patterns that Mashable might use
      const urlPatterns = [
        `https://mashable.com/article/nyt-connections-hint-answer-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-hint-answer-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-answers-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-today-${monthName}-${day}-${year}`,
        `https://mashable.com/article/nyt-connections-${monthName}-${day}-${year}`
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
      
      // Try each URL pattern until one works
      for (let i = 0; i < urlPatterns.length; i++) {
        const url = urlPatterns[i];
        console.log(`Trying URL pattern ${i + 1}: ${url}`);
        
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
          console.log(`Error with ${url}:`, error.message);
          lastError = error;
          continue;
        }
      }
      
      // If we get here, none of the URL patterns worked
      throw new Error(`All URL patterns failed. Last error: ${lastError?.message}`);
      
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
      
      // Pattern 1: Newer format (July 2025 style) - * Category: WORD1, WORD2, WORD3, WORD4
      const newerFormatPattern = /\*\s*([^:]+):\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20}),\s*([A-Z]{3,20})/gi;
      let newerMatch;
      
      while ((newerMatch = newerFormatPattern.exec(html)) !== null) {
        const category = newerMatch[1];
        const words = [newerMatch[2], newerMatch[3], newerMatch[4], newerMatch[5]];
        
        console.log(`Found newer format category "${category}" with words:`, words);
        
        words.forEach(word => {
          if (word && word.length >= 3 && word.length <= 20) {
            foundWords.add(word.trim());
          }
        });
      }
      
      // Pattern 2: Older format (January 2024 style) - * Color - **CATEGORY - WORD1, WORD2, WORD3, WORD4**
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
      
      // If we found words in either format, use those
      if (foundWords.size >= 16) {
        const words = Array.from(foundWords).slice(0, 16);
        console.log('Successfully parsed puzzle words from Mashable format:', words);
        return { words, date };
      }
      
      // Fallback: try other patterns if the main formats didn't work
      const fallbackPatterns = [
        // Look for words in the solution section (usually in bold or strong tags)
        /<strong[^>]*>([A-Z]{3,20})<\/strong>/gi,
        /<b[^>]*>([A-Z]{3,20})<\/b>/gi,
        // Look for words in list items that contain puzzle solutions
        /<li[^>]*>([^<]*?([A-Z]{3,20})[^<]*?)<\/li>/gi,
        // Look for words in paragraphs that mention the categories
        /<p[^>]*>([^<]*?([A-Z]{3,20})[^<]*?)<\/p>/gi,
        // Look for words in headings that might contain puzzle information
        /<h[1-6][^>]*>([^<]*?([A-Z]{3,20})[^<]*?)<\/h[1-6]>/gi,
        // Look for words that appear in all caps (likely puzzle words)
        /\b([A-Z]{3,20})\b/g
      ];
      
      for (const pattern of fallbackPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          let word = match[1] || match[2] || match[0];
          word = word.trim().toUpperCase();
          
          // Filter for reasonable puzzle words
          if (word.length >= 3 && word.length <= 20 && 
              /^[A-Z]+$/.test(word) && // Only letters, no numbers or special chars
              !['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'NYT', 'CONNECTIONS', 'TODAY', 'HINTS', 'ANSWERS', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE'].includes(word)) {
            foundWords.add(word);
          }
        }
      }
      
      console.log('Found potential words:', Array.from(foundWords));
      
      if (foundWords.size >= 16) {
        const words = Array.from(foundWords).slice(0, 16);
        console.log('Parsed words from Mashable HTML fallback patterns:', words);
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
              <label htmlFor="puzzle-date" className="date-label">
                Select Puzzle Date:
              </label>
              <input
                type="date"
                id="puzzle-date"
                value={selectedDate}
                onChange={(e) => {
                  console.log('Date picker onChange triggered');
                  console.log('Event target value:', e.target.value);
                  console.log('Previous selectedDate:', selectedDate);
                  setSelectedDate(e.target.value);
                  console.log('setSelectedDate called with:', e.target.value);
                }}
                max={today}
                className="date-picker"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="loading-spinner">
                  <span>Fetching...</span>
                </div>
              )}
              <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                Current selectedDate: {selectedDate || 'none'}
              </div>
            </div>
            
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
            <div className="board-header">
              <h2>Create Four Groups of Four!</h2>
              <div className="board-info">
                {selectedDate && (
                  <span className="puzzle-date-info">
                    Puzzle Date: {new Date(selectedDate).toLocaleDateString()}
                    <br />
                    <small>Raw: {selectedDate}</small>
                  </span>
                )}
                <button className="reset-btn" onClick={resetBoard}>
                  Reset Board
                </button>
              </div>
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
