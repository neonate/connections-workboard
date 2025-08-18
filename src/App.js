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
    setIsLoading(true);
    setFetchError('');
    
    try {
      // For now, we'll simulate fetching with sample data
      // In the future, this would be a real API call
      const puzzleData = await simulatePuzzleFetch(date);
      
      if (puzzleData && puzzleData.words) {
        // Randomize the word order to prevent giving away answers
        const randomizedWords = shuffleArray([...puzzleData.words]);
        setWords(randomizedWords);
        setGroups([[], [], [], []]);
        setHasStartedGame(true);
        setInputText(''); // Clear manual input since we fetched automatically
      }
    } catch (error) {
      setFetchError(`Failed to fetch puzzle for ${date}: ${error.message}`);
      console.error('Puzzle fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch puzzle when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchPuzzleForDate(selectedDate);
    }
  }, [selectedDate, fetchPuzzleForDate]);

  // Simulate puzzle fetching - replace with real API call later
  const simulatePuzzleFetch = async (date) => {
    // Simulate network delay with realistic timing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Sample puzzle data - in reality, this would come from an API
    const samplePuzzles = {
      '2024-01-15': {
        words: ['CUE', 'STOP', 'BREAKFAST', 'SHOT', 'POOL', 'POCKET', 'PROMPT', 'PARKING', 'CHANCE', 'WI-FI', 'DIGITAL', 'OPENING', 'WRIST', 'NOD', 'BREAK', 'SIGNAL'],
        date: '2024-01-15'
      },
      '2024-01-16': {
        words: ['APPLE', 'ORANGE', 'BANANA', 'GRAPE', 'CAR', 'TRUCK', 'BIKE', 'BOAT', 'SUN', 'MOON', 'STAR', 'PLANET', 'BOOK', 'PEN', 'PAPER', 'PENCIL'],
        date: '2024-01-16'
      },
      '2024-01-17': {
        words: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'DOG', 'CAT', 'BIRD', 'FISH', 'PIZZA', 'BURGER', 'TACO', 'SUSHI', 'RUN', 'WALK', 'JUMP', 'SWIM'],
        date: '2024-01-17'
      },
      '2024-01-26': {
        words: ['MUSIC', 'ART', 'DANCE', 'POETRY', 'FIRE', 'WATER', 'EARTH', 'AIR', 'COFFEE', 'TEA', 'JUICE', 'MILK', 'SPRING', 'SUMMER', 'FALL', 'WINTER'],
        date: '2024-01-26'
      },
      '2024-01-27': {
        words: ['LION', 'TIGER', 'BEAR', 'WOLF', 'PENNY', 'NICKEL', 'DIME', 'QUARTER', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'MORNING', 'NOON', 'EVENING', 'NIGHT'],
        date: '2024-01-27'
      },
      '2024-01-28': {
        words: ['HAPPY', 'SAD', 'ANGRY', 'EXCITED', 'BIG', 'SMALL', 'TALL', 'SHORT', 'HOT', 'COLD', 'WARM', 'COOL', 'FAST', 'SLOW', 'QUICK', 'RAPID'],
        date: '2024-01-28'
      }
    };
    
    // Return puzzle for selected date or generate a unique one based on the date
    if (samplePuzzles[date]) {
      return samplePuzzles[date];
    } else {
      // Generate a unique puzzle for any other date using the date as a seed
      const dateSeed = new Date(date).getTime();
      const uniqueWords = generateUniquePuzzle(dateSeed);
      return {
        words: uniqueWords,
        date: date
      };
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
      ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', 'WEEKEND', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'DAWN', 'DUSK', 'NOON', 'MIDNIGHT']
    ];
    
    // Use the seed to select and shuffle a word set
    const setIndex = seed % allWordSets.length;
    const selectedSet = allWordSets[setIndex];
    
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

  // Real puzzle fetching function with anti-bot measures
  const fetchRealPuzzle = async (date) => {
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

    // Add realistic delays and randomization
    const baseDelay = 2000 + Math.random() * 3000; // 2-5 seconds
    await new Promise(resolve => setTimeout(resolve, baseDelay));

    try {
      // Example URL pattern for NYT Connections (would need actual URL)
      const url = `https://example.com/connections/${date}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        // Add other realistic browser behavior
        credentials: 'omit',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse the HTML to extract puzzle words
      // This would need to be implemented based on the actual page structure
      const words = parsePuzzleWordsFromHTML(html);
      
      return { words, date };
    } catch (error) {
      console.error('Real puzzle fetch failed:', error);
      // Fall back to sample data for now
      return simulatePuzzleFetch(date);
    }
  };

  // Parse puzzle words from HTML (placeholder implementation)
  const parsePuzzleWordsFromHTML = (html) => {
    // This would need to be implemented based on the actual page structure
    // For now, return sample data
    return ['CUE', 'STOP', 'BREAKFAST', 'SHOT', 'POOL', 'POCKET', 'PROMPT', 'PARKING', 'CHANCE', 'WI-FI', 'DIGITAL', 'OPENING', 'WRIST', 'NOD', 'BREAK', 'SIGNAL'];
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
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today}
                className="date-picker"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="loading-spinner">
                  <span>Fetching...</span>
                </div>
              )}
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
                  </span>
                )}
                <button className="reset-btn" onClick={resetBoard}>
                  Reset Board
                </button>
              </div>
            </div>
            
            {/* Word Grid */}
            <div className="word-grid">
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
