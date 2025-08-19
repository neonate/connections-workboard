# NYT Connections Working Board

A web-based tool for solving NYT Connections puzzles by organizing words into groups without making guesses in the real game.

## Project Overview

The NYT Connections Working Board is a React-based web application that allows users to input the 16 words from a NYT Connections puzzle and organize them into groups of 4. This helps users work out the correct groupings before attempting the actual puzzle, avoiding the frustration of making incorrect guesses.

## Technology Stack

- **Frontend**: React.js with modern hooks
- **Styling**: CSS3 with responsive design
- **Testing**: Jest + React Testing Library
- **Deployment**: Digital Ocean App Platform
- **Build**: Create React App with npm

## Current Features

- **Manual Word Input**: Enter 16 words via textarea or paste from ChatGPT
- **Drag & Drop Grouping**: Organize words into 4 groups of 4
- **URL Persistence**: Game state survives page refreshes
- **Mobile Optimized**: Responsive design that works great on iPhone
- **Dynamic Font Sizing**: Automatically adjusts text size to fit long words
- **Smart Word Input**: ChatGPT integration for easy word extraction

## How to Use

### Method 1: ChatGPT + Screenshot (Recommended)
1. Take a screenshot of the NYT Connections puzzle grid
2. Upload it to ChatGPT and ask: "What are the 16 words in this NYT Connections puzzle? Please list them separated by commas."
3. Copy the response and paste it into the textarea
4. Click "Start Puzzle" to begin organizing!

### Method 2: Manual Entry
1. Type or paste the 16 words into the textarea
2. Separate words with commas or new lines
3. Click "Start Puzzle" to begin organizing!

## Screenshots

### 1. Input Screen - Getting Started
![Input Screen](screenshots/input-screen.png)

**Start here!** Enter the 16 words from your NYT Connections puzzle. You can either type them manually or use the ChatGPT method (recommended) by taking a screenshot and asking ChatGPT to identify the words. The app will validate that you have exactly 16 words before starting the puzzle.

### 2. Grouped Hints - Working Out the Connections
![Grouped Hints](screenshots/grouped-hints.png)

**Organize and solve!** Once you start the puzzle, drag and drop words into groups of 4. This screenshot shows how the app makes it easy to work out the correct groupings without having to make guesses in the real NYT Connections app. You can see that words like "BLABBERMOUTH", "CHATTERBOX", "WINDBAG", and "PRATTLER" are grouped together (likely meaning "talkative person"), while "PORT", "SHERRY", "MARSALA", and "VERMOUTH" form another group (types of wine).

## Smart Word Input

The app includes built-in ChatGPT integration to make word input effortless:

- **Screenshot Method**: Take a photo of the puzzle grid and ask ChatGPT to identify the words
- **Copy-to-Clipboard**: One-click copying of the perfect ChatGPT prompt
- **Automatic Parsing**: Handles various separators (commas, newlines, mixed)
- **Input Validation**: Ensures exactly 16 words before starting

## Development Phases

- ✅ **Phase 1 - Setup & Scaffolding**: Basic React app with header
- ✅ **Phase 2 - MVP: Manual Input + Dragging**: Core drag-and-drop functionality
- ✅ **Phase 3 - Smart Input Methods**: ChatGPT integration and copy-to-clipboard
- ✅ **Phase 4 - Mobile Optimization**: Responsive design and iPhone-friendly layout
- ✅ **Phase 5 - URL Persistence**: Game state survives page refreshes
- ✅ **Phase 6 - Dynamic Typography**: Smart font sizing for long words

## Deployment

The app is deployed on Digital Ocean App Platform:

1. **Automatic Builds**: GitHub Actions runs tests on every commit
2. **Live URL**: [Your App URL]
3. **Mobile Optimized**: Works great on iPhone and other mobile devices

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Testing

The app includes comprehensive tests that run automatically:

- **Unit Tests**: 18 tests covering core functionality
- **CI Integration**: Tests run on every commit via GitHub Actions
- **Coverage**: Tests cover input validation, drag-and-drop, and UI components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:ci`
5. Commit and push
6. Create a pull request

## License

This project is open source and available under the MIT License.
