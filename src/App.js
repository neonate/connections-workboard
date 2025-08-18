import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>NYT Connections Working Board</h1>
        <p>Paste 16 puzzle words to get started</p>
      </header>
      <main className="App-main">
        <div className="input-section">
          <textarea 
            placeholder="Paste your 16 puzzle words here (one per line or comma-separated)..."
            className="puzzle-input"
            rows="8"
          />
          <button className="submit-btn">Create Puzzle Board</button>
        </div>
        <div className="board-section">
          <h2>Puzzle Board</h2>
          <p>Your puzzle words will appear here as draggable notes</p>
        </div>
      </main>
    </div>
  );
}

export default App;
