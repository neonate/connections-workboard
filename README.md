# NYT Connections Working Board

A React-based web application for solving NYT Connections puzzles with an interactive drag-and-drop interface.

## Project Overview

This app allows users to:
- Paste 16 puzzle words from NYT Connections
- View words as draggable "post-it notes"
- Group words into sets of 4 by dragging and dropping
- Work through puzzles interactively

## Technology Stack

- **Frontend Framework**: React 18.2.0
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint with React-specific plugins
- **Package Manager**: npm

## Project Patterns

- Component-based architecture using React functional components and hooks
- Modern JavaScript (ES6+) features
- Responsive design principles
- Testing-driven development approach
- ESLint configuration for code quality

## Development Phases

### Phase 1 - Setup & Scaffolding ✅
- Basic React app structure
- NYT Connections header
- Input section for puzzle words
- Board section placeholder

### Phase 2 - MVP: Manual Input + Dragging (Next)
- Text input for 16 words
- Draggable post-it notes
- Drag-and-drop grouping
- Basic styling and layout

### Phase 3 - Puzzle Date Options
- Date picker functionality
- Manual input override option

### Phase 4 - Puzzle Fetching (Optional)
- Fetch today's puzzle data
- Parse external puzzle sources

### Phase 5 - Hint Mode (Extra Credit)
- Multiple hint levels
- Toggle functionality

### Phase 6 - Polish & UX
- Reset functionality
- Save/load state
- Enhanced styling
- Responsive design

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

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

The application will open in your browser at [http://localhost:3000](http://localhost:3000).

### Available Scripts

- `npm start` - Starts the development server
- `npm run build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm run lint` - Checks for linting errors
- `npm run lint:fix` - Automatically fixes linting errors

## Current Status

**Phase 1 Complete**: Basic app structure with header and input sections ready.
**Next**: Implement draggable post-it notes and drag-and-drop functionality.

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new functionality
3. Ensure all tests pass before submitting changes
4. Use meaningful commit messages

## License

This project is private and proprietary.
