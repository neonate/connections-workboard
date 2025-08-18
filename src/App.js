import React, { useState } from 'react';
import './App.css';

function App() {
  const [words, setWords] = useState([]);
  const [groups, setGroups] = useState([[], [], [], []]);
  const [inputText, setInputText] = useState('');
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [hasStartedGame, setHasStartedGame] = useState(false);

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
  };

  const isGroupFull = (groupIndex) => {
    return groups[groupIndex].length >= 4;
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
          
          <div className="screenshot-plan">
            <h3>📸 Screenshot Plan (Coming Soon)</h3>
            <p>Future enhancement: Upload a screenshot of the NYT Connections puzzle to automatically extract the 16 words.</p>
            <ul>
              <li>Take a screenshot of the puzzle grid</li>
              <li>Upload the image to the app</li>
              <li>OCR technology will read and extract the words</li>
              <li>Words will be automatically loaded into the working board</li>
            </ul>
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
              className={`group-area ${dragOverGroup === groupIndex ? 'drag-over' : ''} ${isGroupFull(groupIndex) ? 'group-full' : ''}`}
              onDragOver={(e) => handleDragOver(e, groupIndex)}
              onDrop={(e) => handleDrop(e, groupIndex)}
            >
              <div className="group-header">
                <h3>Group {groupIndex + 1}</h3>
                <span className="group-count">{group.length}/4</span>
              </div>
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
              {group.length === 0 && (
                <p className="empty-group">Drag words here to group them</p>
              )}
            </div>
          ))}
        </div>

        <button className="reset-btn" onClick={resetBoard}>
          Reset Board
        </button>
      </div>
    </div>
  );
}

export default App;
