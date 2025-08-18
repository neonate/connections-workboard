# Connections Workboard

A React-based web application for managing connections and work items.

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
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
connections-workboard/
├── public/           # Static files
├── src/             # Source code
│   ├── components/  # React components
│   ├── App.js       # Main App component
│   └── index.js     # Application entry point
├── package.json     # Dependencies and scripts
├── .gitignore      # Git ignore rules
└── README.md       # This file
```

## Development

- The development server will automatically reload when you make changes
- ESLint is configured to maintain code quality
- Tests run automatically when files change

## Building for Production

To create a production build:

```bash
npm run build
```

This creates an optimized build in the `build/` folder.

## Testing

Run the test suite:

```bash
npm test
```

Tests will run in watch mode and automatically re-run when files change.

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new functionality
3. Ensure all tests pass before submitting changes
4. Use meaningful commit messages

## License

This project is private and proprietary.
