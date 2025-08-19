import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [words, setWords] = useState([]);
  const [groups, setGroups] = useState([[], [], [], []]);
  const [inputText, setInputText] = useState('');
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [hasStartedGame, setHasStartedGame] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load game state from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedWords = urlParams.get('words');
    const savedGroups = urlParams.get('groups');
    
    if (savedWords) {
      try {
        const decodedWords = decodeURIComponent(savedWords);
        const wordArray = JSON.parse(decodedWords);
        if (Array.isArray(wordArray) && wordArray.length === 16) {
          setWords(wordArray);
          setHasStartedGame(true);
          
          // Load groups if they exist
          if (savedGroups) {
            try {
              const decodedGroups = decodeURIComponent(savedGroups);
              const groupsArray = JSON.parse(decodedGroups);
              if (Array.isArray(groupsArray) && groupsArray.length === 4) {
                setGroups(groupsArray);
              }
            } catch (e) {
              console.error('Failed to parse saved groups:', e);
              setGroups([[], [], [], []]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse saved words:', e);
      }
    }
  }, []);

  // Update URL when game state changes
  useEffect(() => {
    if (hasStartedGame && words.length > 0) {
      const urlParams = new URLSearchParams();
      urlParams.set('words', encodeURIComponent(JSON.stringify(words)));
      urlParams.set('groups', encodeURIComponent(JSON.stringify(groups)));
      
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [hasStartedGame, words, groups]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      // Parse the input text into words
      const wordList = inputText
        .split(/[,\n]+/)
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length > 0)
        .slice(0, 16); // Limit to 16 words

      if (wordList.length === 16) {
        // Shuffle the words for randomness
        const shuffledWords = [...wordList].sort(() => Math.random() - 0.5);
        setWords(shuffledWords);
        setGroups([[], [], [], []]);
        setHasStartedGame(true);
      } else {
        alert('Please enter exactly 16 words separated by commas or new lines.');
      }
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDragStart = (e, word) => {
    e.dataTransfer.setData('text/plain', word);
  };

  const handleDragOver = (e, groupIndex) => {
    e.preventDefault();
    setDragOverGroup(groupIndex);
  };

  const handleDrop = (e, groupIndex) => {
    e.preventDefault();
    const word = e.dataTransfer.getData('text/plain');
    
    // Check if group is full
    if (groups[groupIndex].length >= 4) {
      return; // Group is full, don't allow drop
    }

    // Remove word from main board
    setWords(prevWords => prevWords.filter(w => w !== word));
    
    // Add word to group
    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex] = [...newGroups[groupIndex], word];
      return newGroups;
    });
    
    setDragOverGroup(null);
  };

  const removeFromGroup = (word, groupIndex) => {
    // Remove word from group
    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex] = newGroups[groupIndex].filter(w => w !== word);
      return newGroups;
    });
    
    // Add word back to main board
    setWords(prevWords => [...prevWords, word]);
  };

  const resetBoard = () => {
    setWords([]);
    setGroups([[], [], [], []]);
    setInputText('');
    setHasStartedGame(false);
    setDragOverGroup(null);
    
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);
  };

  if (!hasStartedGame) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>NYT Connections Working Board</h1>
        </header>
        
        <div className="input-section">
          <h2>Enter Puzzle Words</h2>
          <p>Enter 16 words from the NYT Connections puzzle, separated by commas or new lines:</p>
          
          <form onSubmit={handleSubmit}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter 16 words here..."
              rows={8}
              cols={50}
            />
            <br />
            <button type="submit">Start Puzzle</button>
          </form>
          
          <div className="chatgpt-instructions">
            <h3>💡 Pro Tip: Use ChatGPT to Get Words</h3>
            <p>Don&apos;t want to type all 16 words manually? Here&apos;s an easy way:</p>
            <ol>
              <li><strong>Take a screenshot</strong> of the NYT Connections puzzle grid</li>
              <li><strong>Upload it to ChatGPT</strong> and ask: &ldquo;What are the 16 words in this NYT Connections puzzle? Please list them separated by commas.&rdquo;</li>
              <li><strong>Copy the response</strong> and paste it into the textarea above</li>
              <li><strong>Click &ldquo;Start Puzzle&rdquo;</strong> to begin organizing!</li>
            </ol>
            <div className="example-prompt">
              <div className="prompt-header">
                <h4>Example ChatGPT Prompt:</h4>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard("I have a screenshot of today's NYT Connections puzzle. Can you identify all 16 words in the grid and list them separated by commas? Just the words, nothing else.")}
                  title="Copy to clipboard"
                >
                  {copySuccess ? '✓ Copied!' : '📋'}
                </button>
              </div>
              <p>&ldquo;I have a screenshot of today&apos;s NYT Connections puzzle. Can you identify all 16 words in the grid and list them separated by commas? Just the words, nothing else.&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>NYT Connections Working Board</h1>
      </header>

      <div className="game-board">
        <div className="word-grid">
          {words.map((word, index) => (
            <div
              key={index}
              className="word-tile"
              draggable
              onDragStart={(e) => handleDragStart(e, word)}
            >
              {word}
            </div>
          ))}
        </div>

        <div className="groups-container">
          <h2>Group Your Words (4 groups of 4)</h2>
          {groups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className={`group-area ${dragOverGroup === groupIndex ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, groupIndex)}
              onDrop={(e) => handleDrop(e, groupIndex)}
            >
              <h3>Group {groupIndex + 1}</h3>
              {group.map((word, wordIndex) => (
                <span
                  key={wordIndex}
                  className="group-word"
                  onClick={() => removeFromGroup(word, groupIndex)}
                  title="Click to remove from group"
                >
                  {word}
                </span>
              ))}
            </div>
          ))}
        </div>

        <button className="reset-button" onClick={resetBoard}>
          Reset Board
        </button>
      </div>
    </div>
  );
}

export default App;
