# NYT Connections Working Board

A React-based web application for solving NYT Connections puzzles by manually entering words and organizing them into groups.

## Overview

This app provides a drag-and-drop interface for organizing NYT Connections puzzle words into logical groups. Users can manually input the 16 puzzle words and then drag them into groups of 4 to solve the puzzle.

## Technology Stack

- **Frontend**: React.js with functional components and hooks
- **Styling**: CSS3 with modern design principles
- **Drag & Drop**: HTML5 Drag and Drop API
- **State Management**: React useState hook
- **Build Tool**: Create React App

## Features

### Current Features
- **Manual Word Input**: Textarea for entering 16 puzzle words
- **Drag & Drop Interface**: Intuitive word organization
- **Group Management**: Create up to 4 groups with maximum 4 words each
- **Word Removal**: Remove words from groups and return them to the board
- **Responsive Design**: Works on desktop and mobile devices
- **Reset Functionality**: Clear the board and start over

### Smart Word Input
- **ChatGPT Integration**: Upload puzzle screenshots to ChatGPT for automatic word extraction
- **Easy Workflow**: Screenshot → ChatGPT → Copy words → Paste → Start solving
- **No Manual Typing**: Avoid typing all 16 words manually

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd connections-workboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts
- `npm start` - Start the development server
- `npm build` - Build the app for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (not recommended)

## How to Use

### Method 1: ChatGPT + Screenshot (Recommended)
1. **Take a Screenshot**: Capture the NYT Connections puzzle grid
2. **Upload to ChatGPT**: Ask: "What are the 16 words in this NYT Connections puzzle? Please list them separated by commas."
3. **Copy Response**: Get the comma-separated word list from ChatGPT
4. **Paste & Start**: Paste the words into the app and click "Start Puzzle"

### Method 2: Manual Entry
1. **Enter Words**: On the input screen, enter the 16 words from your NYT Connections puzzle
   - Separate words with commas or new lines
   - Words will be automatically converted to uppercase
   - Click "Start Puzzle" when ready

### Solving the Puzzle
1. **Organize Words**: 
   - Drag words from the top grid into the group areas below
   - Each group can hold up to 4 words
   - Visual feedback shows when groups are full

2. **Manage Groups**:
   - Remove words from groups using the × button
   - Words return to the main board when removed
   - Reset the entire board using the Reset button

## ChatGPT Integration

The app includes built-in instructions for using ChatGPT to extract puzzle words:

- **Simple Workflow**: Screenshot → ChatGPT → Copy → Paste
- **Clear Prompts**: Example ChatGPT prompts provided
- **No API Keys**: Uses ChatGPT's free web interface
- **Universal Access**: Works with any device that can access ChatGPT

### Example ChatGPT Prompt
> "I have a screenshot of today's NYT Connections puzzle. Can you identify all 16 words in the grid and list them separated by commas? Just the words, nothing else."

## Development Phases

### Phase 1 ✅ - Setup & Scaffolding
- [x] React project initialization
- [x] Basic file structure
- [x] Header and layout

### Phase 2 ✅ - MVP: Manual Input + Dragging
- [x] Text input for 16 words
- [x] Draggable word tiles
- [x] Drag-and-drop grouping
- [x] Group size restrictions
- [x] Basic styling and layout

### Phase 3 ✅ - Smart Input Methods
- [x] ChatGPT integration instructions
- [x] Screenshot workflow documentation
- [x] User-friendly prompts and examples

### Phase 4 🔄 - Enhanced Features
- [ ] Save/load game state (localStorage)
- [ ] Export board state
- [ ] Track solving attempts
- [ ] Share functionality

## Project Structure

```
src/
├── App.js          # Main application component
├── App.css         # Application styles
├── index.js        # React entry point
└── index.css       # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Current Status

The app is currently in **Phase 3** with a fully functional MVP and smart input methods. Users can either manually enter puzzle words or use ChatGPT to extract words from screenshots. The next phase focuses on enhanced features like save/load functionality and game state management.
