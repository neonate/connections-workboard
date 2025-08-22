# NYT Connections Working Board

A comprehensive web application for solving NYT Connections puzzles with intelligent dynamic fetching, drag-and-drop word grouping, and an advanced hint system with descriptive clues.

## 🚀 Features

### Core Gameplay
- **Drag & Drop Interface**: Organize 16 words into 4 groups of 4 with smooth visual feedback
- **Advanced Hint System**: 
  - Color-coded descriptive clues shown before solving (e.g., "A clumsy mishap" for BLUNDER group)
  - Visual category reveals with distinct styling when groups are solved correctly
  - Toggle hints on/off as needed

### Puzzle Loading & Data
- **Dynamic Puzzle Fetching**: Automatically fetch puzzles for any date since June 12, 2023
- **Intelligent Cache Strategy**: Load from local cache first, fetch live data if missing
- **Multiple Data Sources**: TechRadar integration with extensible architecture for additional sources
- **Static Fallback**: Comprehensive puzzle library for offline use
- **Manual Entry**: Enter custom words or use ChatGPT workflow for practice

### User Experience
- **Today's Puzzle Default**: Date picker automatically selects today's date
- **Any Date Access**: Load puzzles from any valid date - no artificial limitations
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Feedback**: Instant validation and visual updates

## 🏗️ Architecture

### Frontend (React)
- **MainApp**: Core puzzle interface with drag & drop, hint system, and date selection
- **PuzzleFetcherManager**: Orchestrates multiple data sources with priority and fallback logic
- **Modular Fetchers**: Pluggable architecture supporting static data, backend API, and web scrapers
- **DataValidator**: Comprehensive validation ensuring puzzle data integrity
- **Date Utilities**: Timezone-safe date handling and manipulation

### Backend (Node.js + Express)
- **Web Scraping Proxy**: CORS-bypassing server for fetching from external sources
- **TechRadar Integration**: Automated parsing of puzzle data and descriptive hints
- **Health Monitoring**: Endpoint monitoring and circuit breaker patterns
- **CSV Data Management**: Bulk import/export tools for puzzle data

### Data Sources (Priority Order)
1. **Static Cache**: Fast local puzzle data for common dates
2. **Backend API**: Live web scraping via Node.js proxy server
3. **Manual Entry**: User-provided custom puzzles
4. **Graceful Fallback**: Clear error messages with retry options

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18.x or higher
- npm 8.x or higher

### ⚠️ Important for Apple/Corporate Environment Users
If you have `npm_config_registry` set to Apple's internal registry in your environment, this project includes `.npmrc` files that override it to use the standard npm registry. This prevents deployment issues and ensures all team members use consistent package sources.

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd connections-workboard
   ```

2. **Install frontend dependencies**
   ```bash
   NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm install
   cd ..
   ```

4. **Start all services**
   ```bash
   # Start both frontend and backend
   ./services.sh start

   # Or start individually  
   ./services.sh start backend
   ./services.sh start frontend
   ```

### Service Management

The application includes comprehensive service management scripts with robust port management and process verification:

#### Master Service Control (`services.sh`)
```bash
# Start all services
./services.sh start

# Stop all services  
./services.sh stop

# Restart all services
./services.sh restart

# Check service status
./services.sh status

# Development mode (foreground with logs)
./services.sh dev

# Build for production
./services.sh build

# Clean up orphaned processes
./services.sh cleanup
```

#### Individual Service Control
```bash
# Backend only
./backend/service.sh start
./backend/service.sh stop
./backend/service.sh status

# Frontend only  
./frontend-service.sh start
./frontend-service.sh stop
./frontend-service.sh status
```

#### Service Features
- **Port Conflict Detection**: Automatically detects and handles port conflicts
- **Process Verification**: Ensures services are actually running on expected ports
- **Health Checks**: Validates service health before reporting success
- **Cleanup Tools**: Removes orphaned processes and stale PID files
- **Background/Foreground Modes**: Choose between production and development modes
- **Robust Process Management**: Prevents zombie processes and port conflicts

### Frontend Only Mode
If you only want to use static puzzles without dynamic fetching:
```bash
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm install
./frontend-service.sh start
```
The app will run on `http://localhost:3000` with static puzzle data only.

### Production Mode
Test production deployment locally:
```bash
# Build for production
npm run build:full

# Start in production mode (unified server)
npm run start:prod
# OR
./frontend-service.sh prod
```

## 🚀 Running the Application

### Full Feature Mode (Recommended)
Start both frontend and backend for complete functionality:

```bash
# Terminal 1: Backend server (port 3001)
cd backend && npm start

# Terminal 2: Frontend app (port 3000)
npm start
```

- **Frontend**: `http://localhost:3000` - Main React application
- **Backend**: `http://localhost:3001` - API server for dynamic puzzle fetching

### Frontend Only Mode
For static puzzles without dynamic fetching:
```bash
npm start
```

### Production Build
```bash
# Build frontend
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm run build

# Build and prepare backend for deployment
cd backend && NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm install --production
```

## 📊 How It Works

### Puzzle Loading Process
1. **User selects date** - Date picker defaults to today
2. **Cache check** - System looks for puzzle in local static data first
3. **Dynamic fetch** - If not cached, backend fetches from TechRadar automatically
4. **Data validation** - All puzzle data is validated for completeness and format
5. **Display** - Words are shuffled and displayed for solving

### Hint System Workflow
1. **Check "Show Hints"** - Enables the hint display
2. **View descriptive clues** - Color-coded banner shows vague clues for each group
   - 🟡 **YELLOW**: Easiest difficulty - simple connections
   - 🟢 **GREEN**: Medium difficulty - clear themes  
   - 🔵 **BLUE**: Hard difficulty - abstract connections
   - 🟣 **PURPLE**: Hardest difficulty - wordplay or obscure links
3. **Solve groups** - Drag words into groups as normal
4. **Category reveals** - Correct groups show the actual category name in purple styling

### Supported Date Range
- **Start Date**: June 12, 2023 (when NYT Connections began)
- **End Date**: Today's date
- **Coverage**: 500+ puzzles available through dynamic fetching
- **Cache**: Most recent puzzles stored locally for fast loading

### Data Structure
Puzzles include comprehensive data:
```javascript
{
  date: '2025-08-21',
  gameId: 437,
  groups: [
    {
      name: 'BLUNDER',
      level: 0, // 0=Yellow, 1=Green, 2=Blue, 3=Purple
      words: ['ERROR', 'FAULT', 'LAPSE', 'MISTAKE'],
      hint: 'A clumsy mishap' // Descriptive clue
    }
    // ... 3 more groups
  ],
  words: ['ERROR', 'FAULT', ...], // All 16 words shuffled
  source: 'TechRadar',
  fetchedAt: '2025-08-21T10:30:00Z'
}
```

## 🎯 Advanced Hint System

### Two Types of Hints

**1. Descriptive Clues (Before Solving)**
- Appear immediately when "Show Hints" is checked
- Color-coded banner with vague descriptions
- Example: "A clumsy mishap" instead of revealing "BLUNDER"
- Help guide thinking without spoiling the answer

**2. Category Reveals (After Solving)**
- Show actual category names when groups are correctly formed
- Distinct purple gradient styling separate from word buttons
- Confirm your solution with the official category name

### Visual Design
- **Hint Banner**: Clean grid layout with color-coded difficulty levels
- **Responsive**: Adapts to mobile and desktop screens
- **Non-Intrusive**: Hints don't interfere with gameplay flow
- **Consistent**: Color coding matches NYT Connections difficulty progression

## 📁 Project Structure

```
connections-workboard/
├── src/                              # React frontend
│   ├── components/
│   │   ├── MainApp.js               # Core puzzle interface & date picker
│   │   └── ErrorHandling.js         # User-friendly error display
│   ├── services/
│   │   ├── puzzleFetcher.js         # Main puzzle fetching orchestration
│   │   ├── PuzzleFetcherManager.js  # Multi-source coordinator
│   │   ├── DataValidator.js         # Puzzle data validation
│   │   ├── puzzleData.js            # Static puzzle cache
│   │   └── fetchers/                # Pluggable data sources
│   │       ├── BasePuzzleFetcher.js # Abstract base class
│   │       ├── StaticDataFetcher.js # Local cache fetcher
│   │       └── BackendApiFetcher.js # Backend API client
│   ├── utils/
│   │   └── dateUtils.js             # Timezone-safe date handling
│   └── App.js                       # Main React application
├── backend/                          # Node.js API server
│   ├── server.js                    # Express server & TechRadar scraper
│   └── package.json                 # Backend dependencies
├── scripts/                          # Data management tools
│   ├── update-puzzle-data.js        # Bulk puzzle import/validation
│   └── parsed-puzzles/              # Static puzzle JSON files
├── docs/                            # Technical documentation
│   ├── data-source-evaluation.md   # Source comparison analysis
│   └── data-source-decision.md     # Architecture decisions
└── tasks/                           # Development task tracking
    └── dynamic-puzzle-fetching-feature.md
```

## 🧪 Testing

### Comprehensive Test Suite
```bash
# Run all tests with coverage
npm run test:ci

# Run tests in watch mode during development
npm test

# Run specific test files
npm test -- --testNamePattern="DataValidator"
```

### Test Coverage
- **Frontend Services**: PuzzleFetcherManager, DataValidator, date utilities
- **Fetcher Classes**: Static data, backend API, base functionality
- **Data Models**: Puzzle data structures and validation
- **Integration Tests**: End-to-end fetching workflows
- **Error Handling**: Graceful failure scenarios

### Manual Testing Checklist
- [ ] Load today's puzzle (dynamic fetch)
- [ ] Load historical puzzle (cache or fetch)
- [ ] Toggle hints on/off
- [ ] Drag and drop word grouping
- [ ] Category reveals after correct grouping
- [ ] Error handling for invalid dates
- [ ] Backend server health check

## 🚀 Deployment

### Frontend-Only Deployment (Static Hosting)
For basic functionality with static puzzles only:

```bash
npm run build
```

Deploy the `build/` folder to:
- **Netlify**: Drag and drop deployment
- **Vercel**: GitHub integration for auto-deployment  
- **GitHub Pages**: Static site hosting
- **Firebase Hosting**: CDN deployment
- **Any static host**: Upload build contents

### Full-Stack Deployment (Recommended)
For dynamic puzzle fetching, deploy both frontend and backend:

**Frontend:**
- Build and deploy as above
- Set `REACT_APP_API_URL=https://your-backend-domain.com` (or `REACT_APP_BACKEND_URL` for compatibility)

**Backend Options:**
- **Railway**: `railway up` from `/backend` directory
- **Heroku**: Deploy with Procfile: `web: node server.js`
- **Render**: Auto-deploy from GitHub
- **DigitalOcean App Platform**: Docker or buildpack deployment
- **AWS/GCP/Azure**: Container or serverless deployment

### Environment Variables
```bash
# Frontend (.env)
REACT_APP_API_URL=http://localhost:3001  # Backend API URL (preferred)
REACT_APP_BACKEND_URL=http://localhost:3001  # Alternative name (compatibility)

# Backend (.env)
PORT=3001                    # Server port
NODE_ENV=production         # Environment mode
CORS_ORIGIN=http://localhost:3000  # Frontend URL for CORS
```

### Health Checks
- **Frontend**: `http://localhost:3000` - should load puzzle interface
- **Backend**: `http://localhost:3001/api/health` - should return `{"status":"ok"}`
- **Integration**: Date picker should fetch live puzzles when backend is running

## 🔒 Security & Privacy

### Data Privacy
- **No User Data Collection**: No personal information stored or transmitted
- **Local Processing**: All puzzle solving happens in browser memory
- **No Analytics**: No tracking or user behavior monitoring
- **Session-Based**: No persistent data storage

### Security Measures
- **CORS Protection**: Backend properly configured for cross-origin requests
- **Input Validation**: All external data validated before processing
- **Error Handling**: Graceful failures without exposing system details
- **Rate Limiting**: Backend prevents excessive API requests
- **Static Assets**: Frontend deployable as static files (no server vulnerabilities)

## 🐛 Troubleshooting

### Common Issues

1. **"Dynamic fetch failed" error**
   - **Check backend**: Ensure `http://localhost:3001` is running
   - **Network**: Verify internet connection for live puzzle fetching
   - **Date**: Confirm date is valid (June 12, 2023 - today)
   - **Solution**: Try restarting backend server or using static puzzles

2. **No hints displaying**
   - **Check puzzle data**: Ensure puzzle has hint information
   - **Toggle**: Try unchecking and rechecking "Show Hints"
   - **Console**: Look for validation errors in browser console
   - **Fallback**: Some static puzzles may not have descriptive hints

3. **Drag and drop not working**
   - **Browser compatibility**: Use Chrome, Firefox, or Safari
   - **Mobile**: Ensure touch events are enabled
   - **Console errors**: Check for JavaScript errors

4. **Backend won't start**
   - **Dependencies**: Run `cd backend && NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm install`
   - **Port conflict**: Ensure port 3001 is available
   - **Node version**: Verify Node.js 18+ is installed

### Debug Information

#### Frontend Logs
```bash
# Open browser console (F12) and look for:
🚀 Initializing PuzzleFetcherManager...
📝 Registering StaticDataFetcher...
📝 Registering BackendApiFetcher...
✅ Puzzle loaded successfully
```

#### Backend Logs
```bash
# Terminal running backend should show:
🚀 Backend server starting on port 3001...
✅ Server running at http://localhost:3001
📝 Health check endpoint: /api/health
🌐 CORS enabled for: http://localhost:3000
```

#### Health Checks
```bash
# Test backend connectivity
curl http://localhost:3001/api/health

# Test puzzle fetching
curl http://localhost:3001/api/fetch-puzzle/2025-08-21
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Install dependencies** for both frontend and backend
4. **Make changes** following existing code patterns
5. **Add tests** for new functionality
6. **Run test suite** to ensure all tests pass
   ```bash
   npm run test:ci
   ```
7. **Submit pull request** with clear description

## 🚀 Production Deployment

### Build for Production
```bash
# Build the React app
npm run build

# Install backend dependencies
cd backend && npm install && cd ..
```

### Production Mode
```bash
# Start in production mode (unified server)
npm run start:prod
```

**Production Features:**
- Unified server (backend API + frontend serving)
- Static asset serving with React Router support
- Environment-based configuration
- All dynamic puzzle fetching capabilities included

### Environment Variables
Set these environment variables for production:
```
NODE_ENV=production
PORT=8080
SERVE_FRONTEND=true
```

### Adding New Data Sources
The modular fetcher architecture makes it easy to add new puzzle sources:

1. **Create new fetcher** extending `BasePuzzleFetcher`
2. **Implement required methods**: `isAvailable()`, `_executeFetch()`
3. **Add validation** for the new source's data format
4. **Register in PuzzleFetcherManager** with appropriate priority
5. **Add tests** covering the new functionality

### Code Standards
- **ES6+ JavaScript** with modern React patterns
- **JSDoc comments** for all functions and classes
- **Comprehensive testing** with Jest and React Testing Library
- **Error handling** for all async operations
- **TypeScript-style JSDoc** for better IDE support

## 🏆 Acknowledgments

- **New York Times** for creating the original Connections puzzle
- **TechRadar** for providing puzzle data and hints
- **React Community** for the excellent development tools
- **Open Source Contributors** who make projects like this possible

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

**🎯 Ready to solve some puzzles?** Start both servers and visit `http://localhost:3000` to begin!

