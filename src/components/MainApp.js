import { useState, useEffect } from 'react';
import '../App.css';
import { 
  fetchPuzzleForDate 
} from '../services/puzzleFetcher';
import { getAvailableDateRange } from '../services/puzzleData';
import puzzleStorageService from '../services/PuzzleStorageService';
import { ErrorDisplay, SuccessMessage } from './ErrorHandling';

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Main application component for the NYT Connections Working Board
 * Handles puzzle fetching, word management, and game logic
 */
function MainApp() {
  const [words, setWords] = useState([]);
  const [groups, setGroups] = useState([[], [], [], []]);
  const [inputText, setInputText] = useState('');
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [hasStartedGame, setHasStartedGame] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Set default date to today's date in local timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isFetching, setIsFetching] = useState(false);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(null);
  const [currentPuzzleDate, setCurrentPuzzleDate] = useState(null);
  const [hasUserSelectedDate, setHasUserSelectedDate] = useState(false);

  const [fetchError, setFetchError] = useState('');
  const [fetchSuccess, setFetchSuccess] = useState('');
  const [availableDateRange, setAvailableDateRange] = useState({
    minDate: null,
    maxDate: null
  });

  // Dynamic fetching state (simplified)
  const [fetchedPuzzleData, setFetchedPuzzleData] = useState(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [fetchSource, setFetchSource] = useState(null);

  /**
   * Load available date range on component mount
   */
  useEffect(() => {
    const loadDateRange = async () => {
      try {
        const dateRange = await getAvailableDateRange();
        setAvailableDateRange(dateRange);
      } catch (error) {
        console.error('❌ Failed to get date range:', error.message);
      }
    };

    loadDateRange();
  }, []);

  /**
   * Manages URL persistence for the selected date
   */
  useEffect(() => {
    // Read from URL on mount only if user hasn't made a selection
    const params = new URLSearchParams(window.location.search);
    const dateFromUrl = params.get('date');
    
    console.log('🔍 Debug: URL useEffect - dateFromUrl:', dateFromUrl, 'hasUserSelectedDate:', hasUserSelectedDate);
    
    // Only set from URL if user hasn't made a selection yet
    if (dateFromUrl && !hasUserSelectedDate) {
      console.log('🔍 Debug: Setting selectedDate from URL (user hasn\'t selected yet):', dateFromUrl);
      setSelectedDate(dateFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  useEffect(() => {
    // Update URL when selectedDate changes (but not on mount)
    if (selectedDate) {
      const params = new URLSearchParams(window.location.search);
      const currentDateInUrl = params.get('date');
      
      if (currentDateInUrl !== selectedDate) {
        params.set('date', selectedDate);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
      }
    }
  }, [selectedDate]);

  /**
   * Handles manual form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      // Split by commas or line breaks and clean up
      const wordsArray = inputText
        .split(/[,\n]/)
        .map(word => word.trim())
        .filter(word => word.length > 0);
      
      if (wordsArray.length === 16) {
        // Shuffle the manually entered words to make the puzzle challenging
        const shuffledWords = shuffleArray(wordsArray);
        setWords(shuffledWords);
        setHasStartedGame(true);
        setCurrentPuzzleDate('custom'); // Set to indicate custom puzzle
      } else {
        alert(`Please enter exactly 16 words. You entered ${wordsArray.length} words.`);
      }
    }
  };

  /**
   * Handles puzzle fetching by date - automatically tries static, then dynamic, then fails gracefully
   */
  const handleFetchPuzzle = async () => {
    if (!selectedDate) {
      setFetchError('❌ Please select a date');
      return;
    }
    
    console.log('🔍 Debug: handleFetchPuzzle called with selectedDate:', selectedDate);
    
    setIsFetching(true);
    setFetchError('');
    setFetchSuccess('');
    setShowSaveOptions(false);
    setFetchedPuzzleData(null);
    setFetchSource(null);

    try {
      // The puzzleFetcher will automatically try static first, then dynamic if needed
      const puzzleData = await fetchPuzzleForDate(selectedDate);
      
      console.log('🔍 Debug: fetchPuzzleForDate returned data for date:', puzzleData.date);
      console.log('🔍 Debug: Fetch source:', puzzleData.fetchSource);
      console.log('🔍 Debug: Puzzle words:', puzzleData.words);
      
      // Store the fetched data and source information
      setFetchedPuzzleData(puzzleData);
      setFetchSource(puzzleData.fetchSource);
      
      // Shuffle the words to make the puzzle challenging
      const shuffledWords = shuffleArray(puzzleData.words);
      setWords(shuffledWords);
      setHasStartedGame(true);
      setCurrentPuzzleDate(selectedDate);
      
      // Store correct answers for hint system
      if (puzzleData.groups) {
        const answers = {
          groups: puzzleData.groups.map(group => ({
            name: group.name,
            words: group.words,
            level: group.level,
            hint: group.hint // Include hints if available
          }))
        };
        setCorrectAnswers(answers);
        
        // Debug logging
        console.log('📋 Stored correct answers:', answers);
        answers.groups.forEach((group, index) => {
          console.log(`   Group ${index + 1}: ${group.name} - ${group.words.join(', ')} - Hint: "${group.hint || 'none'}"`);
        });
      }

      // Show appropriate success message based on source
      if (puzzleData.fetchSource === 'dynamic') {
        setFetchSuccess(`✅ Loaded puzzle for ${selectedDate} from online source`);
        
        // Show save options for dynamically fetched puzzles
        if (puzzleData.canBeSaved) {
          setShowSaveOptions(true);
          
          // Auto-save to local cache
          try {
            puzzleStorageService.savePuzzleToCache(selectedDate, puzzleData);
            console.log('💾 Auto-saved puzzle to local cache');
          } catch (cacheError) {
            console.warn('⚠️ Failed to save to cache:', cacheError.message);
          }
        }
      } else if (puzzleData.fetchSource === 'static') {
        setFetchSuccess(`✅ Loaded puzzle for ${selectedDate}`);
      } else if (puzzleData.fetchSource === 'cache') {
        setFetchSuccess(`✅ Loaded puzzle for ${selectedDate} from recent cache`);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setFetchSuccess(''), 5000);
      
    } catch (error) {
      console.error(`❌ Puzzle fetch failed for ${selectedDate}:`, error);
      setFetchError(error);
    } finally {
      setIsFetching(false);
    }
  };



  /**
   * Handle save puzzle to static data
   */
  const handleSavePuzzle = () => {
    if (!fetchedPuzzleData) return;
    
    try {
      const instructions = puzzleStorageService.generateSaveInstructions(selectedDate, fetchedPuzzleData);
      
      // Create a modal or dialog to show instructions
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h3>Save Puzzle to Static Data</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; white-space: pre-wrap; font-size: 12px;">${instructions}</pre>
            <div style="margin-top: 20px; text-align: right;">
              <button onclick="this.closest('div').parentElement.remove()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Failed to generate save instructions:', error);
      alert('Failed to generate save instructions: ' + error.message);
    }
  };

  /**
   * Pre-fills the textarea with known puzzle words for today's date
   */
  const handlePreFillToday = () => {
    const todaysPuzzleWords = [
      'DOMINO', 'PIANO KEYS', 'YIN-YANG SYMBOL', 'ZEBRA',
      'CHOPSTICKS', 'CLAVES', 'KNITTING NEEDLES', 'SKI POLES', 
      'BARBER POLE', 'CAROUSEL', 'CEILING FAN', 'LAZY SUSAN',
      'CANDY CANE', 'CROCHET HOOK', 'CROOK', 'CROWBAR'
    ];
    
    // Shuffle the words before pre-filling to make it challenging
    const shuffledWords = shuffleArray(todaysPuzzleWords);
    setInputText(shuffledWords.join(', '));
  };



  /**
   * Handle drag start event
   * @param {Event} e - Drag event
   * @param {string} word - Word being dragged
   */
  const handleDragStart = (e, word) => {
    e.dataTransfer.setData('text/plain', word);
  };

  /**
   * Handle drag over event for groups
   * @param {Event} e - Drag event
   * @param {number} groupIndex - Target group index
   */
  const handleDragOver = (e, groupIndex) => {
    e.preventDefault();
    setDragOverGroup(groupIndex);
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = () => {
    setDragOverGroup(null);
  };

  /**
   * Handle drop event
   * @param {Event} e - Drop event
   * @param {number} groupIndex - Target group index
   */
  const handleDrop = (e, groupIndex) => {
    e.preventDefault();
    const word = e.dataTransfer.getData('text/plain');
    
    // Remove word from its current location
    const newWords = words.filter(w => w !== word);
    const newGroups = groups.map(group => group.filter(w => w !== word));
    
    // Add word to the target group
    newGroups[groupIndex] = [...newGroups[groupIndex], word];
    
    setWords(newWords);
    setGroups(newGroups);
    setDragOverGroup(null);
  };

  /**
   * Move word back to unassigned words
   * @param {string} word - Word to move back
   * @param {number} groupIndex - Current group index
   */
  const moveWordBack = (word, groupIndex) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = newGroups[groupIndex].filter(w => w !== word);
    setGroups(newGroups);
    setWords([...words, word]);
  };

  /**
   * Copies all groups to clipboard as formatted text
   */
  const copyGroupsToClipboard = async () => {
    const groupTexts = groups.map((group, index) => {
      if (group.length === 0) return '';
      return `Group ${index + 1}: ${group.join(', ')}`;
    }).filter(text => text.length > 0);
    
    const finalText = groupTexts.join('\n');
    
    try {
      await navigator.clipboard.writeText(finalText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  /**
   * Checks if a group has the correct words
   * @param {Array} groupWords - Words in the current group
   * @param {number} groupIndex - Index of the group (0-3)
   * @returns {boolean} True if the group is correct
   */
  const isGroupCorrect = (groupWords, groupIndex) => {
    if (!hintEnabled || !correctAnswers || groupWords.length !== 4) {
      return false;
    }
    
    // Check if all 4 words match any of the correct groups (case-insensitive)
    const sortedGroupWords = [...groupWords].sort().map(w => w.toLowerCase());
    
    for (let i = 0; i < correctAnswers.groups.length; i++) {
      const correctGroup = correctAnswers.groups[i];
      const sortedCorrectWords = [...correctGroup.words].sort().map(w => w.toLowerCase());
      
      if (JSON.stringify(sortedGroupWords) === JSON.stringify(sortedCorrectWords)) {
        // Debug logging
        console.log(`🔍 Group ${groupIndex + 1} matches correct group ${i + 1}: ${correctGroup.name}`);
        console.log(`   User words: ${groupWords.join(', ')}`);
        console.log(`   Correct words: ${correctGroup.words.join(', ')}`);
        return true;
      }
    }
    
    // Debug logging for no match
    console.log(`🔍 Group ${groupIndex + 1} has no match:`);
    console.log(`   User words: ${groupWords.join(', ')}`);
    console.log(`   Available correct groups:`);
    correctAnswers.groups.forEach((group, i) => {
      console.log(`     Group ${i + 1}: ${group.name} - ${group.words.join(', ')}`);
    });
    
    return false;
  };

  /**
   * Gets the category name for a group
   * @param {number} groupIndex - Index of the group (0-3)
   * @returns {string} Category name or empty string
   */
  const getGroupCategory = (groupIndex) => {
    if (!correctAnswers || !groups[groupIndex] || groups[groupIndex].length !== 4) {
      return '';
    }
    
    // Find the matching correct group
    const sortedGroupWords = [...groups[groupIndex]].sort().map(w => w.toLowerCase());
    
    for (let i = 0; i < correctAnswers.groups.length; i++) {
      const correctGroup = correctAnswers.groups[i];
      const sortedCorrectWords = [...correctGroup.words].sort().map(w => w.toLowerCase());
      
      if (JSON.stringify(sortedGroupWords) === JSON.stringify(sortedCorrectWords)) {
        return correctGroup.name;
      }
    }
    
    return '';
  };

  /**
   * Get the descriptive hint for a group (if available)
   * @param {number} groupIndex - The index of the group
   * @returns {string} The hint text or empty string
   */
  const getGroupHint = (groupIndex) => {
    if (!correctAnswers || !groups[groupIndex] || groups[groupIndex].length !== 4) {
      return '';
    }
    
    // Find the matching correct group
    const sortedGroupWords = [...groups[groupIndex]].sort().map(w => w.toLowerCase());
    
    for (let i = 0; i < correctAnswers.groups.length; i++) {
      const correctGroup = correctAnswers.groups[i];
      const sortedCorrectWords = [...correctGroup.words].sort().map(w => w.toLowerCase());
      
      if (JSON.stringify(sortedGroupWords) === JSON.stringify(sortedCorrectWords)) {
        const hint = correctGroup.hint;

        // Only return if it's a descriptive hint (not just the group name)
        if (hint && hint !== correctGroup.name && hint.match(/[a-z]/)) {
          return hint;
        }
      }
    }
    
    return '';
  };

  /**
   * Copies ChatGPT prompt to clipboard
   */
  const copyPromptToClipboard = async () => {
    const prompt = `I have a screenshot of today's NYT Connections puzzle. Can you identify all 16 words in the grid and list them separated by commas? Just the words, nothing else.`;
    
    try {
      await navigator.clipboard.writeText(prompt);
      // Show brief success indication
      const button = document.querySelector('.copy-btn');
      const originalText = button.textContent;
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    } catch (err) {
      console.error('Failed to copy prompt: ', err);
    }
  };

  /**
   * Formats a date string for display
   * @param {string} dateString - Date string in YYYY-MM-DD format or 'custom'
   * @returns {string} Formatted date string (e.g., "August 20, 2025" or "Custom Puzzle")
   */
  const formatPuzzleDate = (dateString) => {
    if (dateString === 'custom') {
      return 'Custom Puzzle';
    }
    
    // Parse the date components to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day);
    
    console.log('🔍 Debug: formatPuzzleDate - input:', dateString, 'parsed:', { year, month, day }, 'created date:', date);
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>NYT Connections Working Board</h1>
      </header>

      {!hasStartedGame ? (
        <div className="input-section">
          <h2>Choose Your Input Method</h2>
          <div className="input-methods">
            <div className="method-section">
              <h3>📅 Method 1: Load Puzzle by Date</h3>
              <p className="method-note">✅ Load any date - cached puzzles for speed, or fetch live from the web!</p>
              <div className="date-fetch-section">

                
                <div className="date-input-controls">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setHasUserSelectedDate(true);
                    }}
                    min="2023-06-12"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <button
                    onClick={handleFetchPuzzle}
                    disabled={isFetching || !selectedDate}
                    className="fetch-btn"
                  >
                    {isFetching ? '🔄 Loading puzzle...' : '📥 Load Puzzle'}
                  </button>
                </div>

              </div>
              
              {fetchError && (
                <ErrorDisplay 
                  error={fetchError}
                  onRetry={() => handleFetchPuzzle()}
                  onDismiss={() => setFetchError('')}
                  context={`fetching puzzle for ${selectedDate}`}
                  suggestions={{
                    manualInput: () => {
                      setFetchError('');
                      // Focus on manual input section
                      document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                />
              )}
              
              {fetchSuccess && (
                <SuccessMessage 
                  message={fetchSuccess}
                  onDismiss={() => setFetchSuccess('')}
                  actions={showSaveOptions ? [
                    {
                      label: '💾 Save to Static Data',
                      onClick: handleSavePuzzle
                    }
                  ] : []}
                />
              )}
            </div>

            <div className="method-section">
              <h3>✏️ Method 2: Manual Entry</h3>
              <p>Enter 16 words from the NYT Connections puzzle, separated by commas or new lines:</p>
              <div className="manual-input-section">
                <button
                  onClick={handlePreFillToday}
                  className="prefill-btn"
                  title="Pre-fill with today's known puzzle words"
                >
                  📝 Pre-fill Today&apos;s Words
                </button>
                <form onSubmit={handleSubmit}>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter 16 words here..."
                    rows="8"
                    cols="50"
                  />
                  <br />
                  <button type="submit">Start Puzzle</button>
                </form>
              </div>
            </div>
          </div>

          <div className="chatgpt-instructions">
            <h3>💡 Pro Tip: Use ChatGPT to Get Words</h3>
            <p>Don&apos;t want to type all 16 words manually? Here&apos;s an easy way:</p>
            <ol>
              <li><strong>Take a screenshot</strong> of the NYT Connections puzzle grid</li>
              <li><strong>Upload it to ChatGPT</strong> and ask: &quot;What are the 16 words in this NYT Connections puzzle? Please list them separated by commas.&quot;</li>
              <li><strong>Copy the response</strong> and paste it into the textarea above</li>
              <li><strong>Click &quot;Start Puzzle&quot;</strong> to begin organizing!</li>
            </ol>
            <div className="example-prompt">
              <div className="prompt-header">
                <h4>Example ChatGPT Prompt:</h4>
                <button 
                  onClick={copyPromptToClipboard}
                  className="copy-btn"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
              <p>&quot;I have a screenshot of today&apos;s NYT Connections puzzle. Can you identify all 16 words in the grid and list them separated by commas? Just the words, nothing else.&quot;</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="game-section">
          {correctAnswers && (
            <div className="hint-controls">
              <label className="hint-checkbox">
                <input
                  type="checkbox"
                  checked={hintEnabled}
                  onChange={(e) => setHintEnabled(e.target.checked)}
                />
                <span className="checkmark"></span>
                Show Hints
              </label>
              {hintEnabled && (
                <div className="hint-banner">
                  <div className="hint-info">
                    💡 Look for these connections:
                  </div>
                  <div className="hint-grid">
                    {correctAnswers && correctAnswers.groups.map((group, index) => {
                      const colors = ['yellow', 'green', 'blue', 'purple'];
                      const hint = group.hint && group.hint !== group.name && group.hint.match(/[a-z]/) 
                        ? group.hint 
                        : `Theme: ${group.name.toLowerCase()}`;
                      
                      return (
                        <div key={index} className={`hint-item ${colors[group.level]}`}>
                          <span className="hint-color">{colors[group.level].toUpperCase()}:</span>
                          <span className="hint-text">{hint}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {currentPuzzleDate && (
            <div className="puzzle-date-display">
              <h3>📅 Playing Puzzle: {formatPuzzleDate(currentPuzzleDate)}</h3>
            </div>
          )}

          <div className="words-container">
            <h3>Unassigned Words ({words.length})</h3>
            <div className="words-grid">
              {words.map((word, index) => (
                <div
                  key={index}
                  className="word-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, word)}
                >
                  {word}
                </div>
              ))}
            </div>
          </div>

          <div className="groups-container">
            <h2>Group Your Words (4 groups of 4)</h2>
            <div className="groups-grid">
              {groups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={`group ${dragOverGroup === groupIndex ? 'drag-over' : ''} ${isGroupCorrect(group, groupIndex) ? 'correct' : ''}`}
                  onDragOver={(e) => handleDragOver(e, groupIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, groupIndex)}
                >
                  <h3>Group {groupIndex + 1} ({group.length}/4)</h3>
                  {hintEnabled && isGroupCorrect(group, groupIndex) && (
                    <div className="category-reveal">
                      🎯 {getGroupCategory(groupIndex)}
                    </div>
                  )}
                  <div className="group-words">
                    {group.map((word, wordIndex) => (
                      <div
                        key={wordIndex}
                        className="word-item assigned"
                        onClick={() => moveWordBack(word, groupIndex)}
                        title="Click to move back to unassigned"
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="controls">
            <button onClick={() => {
              setHasStartedGame(false);
              setWords([]);
              setGroups([[], [], [], []]);
              setInputText('');
              setCorrectAnswers(null);
              setHintEnabled(false);
              setCurrentPuzzleDate(null); // Reset current puzzle date
            }}>
              Start Over
            </button>
            <button onClick={copyGroupsToClipboard}>
              {copySuccess ? '✓ Copied!' : 'Copy Groups to Clipboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainApp;
