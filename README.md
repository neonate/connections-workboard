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

### Planned Features (Phase 2)
- **Screenshot Upload**: Upload a screenshot of the NYT Connections puzzle
- **OCR Integration**: Automatically extract words from puzzle images
- **Auto-population**: Load extracted words directly into the working board

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

1. **Enter Words**: On the input screen, enter the 16 words from your NYT Connections puzzle
   - Separate words with commas or new lines
   - Words will be automatically converted to uppercase
   - Click "Start Puzzle" when ready

2. **Organize Words**: 
   - Drag words from the top grid into the group areas below
   - Each group can hold up to 4 words
   - Visual feedback shows when groups are full

3. **Manage Groups**:
   - Remove words from groups using the × button
   - Words return to the main board when removed
   - Reset the entire board using the Reset button

## Screenshot Plan

The app is designed with future OCR integration in mind:

- **Image Upload**: Users will be able to upload screenshots of NYT Connections puzzles
- **Word Extraction**: OCR technology will automatically read and extract the 16 words
- **Auto-population**: Extracted words will be loaded directly into the working board
- **Validation**: Built-in checks to ensure exactly 16 words are extracted

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

### Phase 3 🔄 - Screenshot Integration
- [ ] Image upload functionality
- [ ] OCR integration for word extraction
- [ ] Auto-population of words
- [ ] Image validation and error handling

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

The app is currently in **Phase 2** with a fully functional MVP. Users can manually enter puzzle words and organize them using drag-and-drop. The next major milestone is implementing screenshot-based word extraction using OCR technology.
