# NYT Connections Working Board

A web application for solving NYT Connections puzzles with drag-and-drop word grouping and intelligent hint system.

## 🚀 Features

- **Drag & Drop Interface**: Organize 16 words into 4 groups of 4
- **Smart Hint System**: Check if your groups are correct and reveal category names
- **Puzzle Loading**: Load puzzles from static CSV cache
- **Manual Entry**: Enter words manually or use ChatGPT workflow
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Frontend (React)
- **MainApp**: Core puzzle interface with drag & drop
- **puzzleCache**: Static CSV data loading
- **puzzleFetcher**: Fallback puzzle fetching logic

### Data Source
- **Static CSV**: Puzzle data stored in `src/services/puzzleCache.js`
- **Manual Updates**: CSV data updated out-of-band, not through the web app
- **Fallback Support**: Original puzzle fetching as backup

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18.x or higher
- npm 8.x or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd connections-workboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm start
```
The app will run on `http://localhost:3000`

### Production Build
```bash
npm run build
```
The built app will be in the `build/` folder

## 📊 Data Management

### Adding New Puzzles
Puzzles are managed through the static CSV data in `src/services/puzzleCache.js`:

1. **Update the CSV data** in the `EXTENDED_PUZZLES` object
2. **Rebuild the app** with `npm run build`
3. **Deploy the updated build**

### CSV Structure
The internal data structure follows this format:
```javascript
'2025-08-17': {
  groups: [
    {
      name: 'CONVENIENTLY LOCATED',
      level: 0,
      words: ['ACCESSIBLE', 'CLOSE', 'HANDY', 'NEARBY']
    },
    // ... 3 more groups
  ]
}
```

## 🎯 Hint System

The hint system provides real-time feedback:

1. **Enable Hints**: Check the "Show Hints" checkbox
2. **Group Words**: Drag words into groups as usual
3. **Visual Feedback**: 
   - ✅ **Green groups**: Correct word combinations
   - 🎯 **Category reveal**: Shows the actual category name
4. **Dynamic Updates**: Hints update in real-time as you modify groups

## 📁 File Structure

```
connections-workboard/
├── src/                    # React frontend source
│   ├── components/         # React components
│   │   └── MainApp.js     # Main puzzle interface
│   ├── services/          # Data services
│   │   ├── puzzleCache.js # Static CSV data
│   │   └── puzzleFetcher.js # Fallback fetching
│   └── App.js            # Main application
├── build/                 # Built React app (after npm run build)
└── package.json          # Dependencies
```

## 🧪 Testing

Run the test suite:
```bash
npm run test:ci
```

## 🚀 Deployment

### Static Hosting
The app is a static React build that works on any web hosting service:

1. **Build the app**: `npm run build`
2. **Deploy options**:
   - **Netlify**: Drag and drop the `build/` folder
   - **Vercel**: Connect your GitHub repo for automatic deployments
   - **GitHub Pages**: Enable Pages in your repo settings
   - **Firebase Hosting**: Use Firebase CLI to deploy
   - **Any static host**: Upload the `build/` folder contents

### Data Updates
To update puzzle data:
1. Edit `src/services/puzzleCache.js`
2. Run `npm run build`
3. Deploy the new build

## 🔒 Security Features

- **Static Data**: No server-side code or database
- **Client-Side Only**: All processing happens in the browser
- **No User Input Storage**: Data is not persisted or transmitted

## 🐛 Troubleshooting

### Common Issues

1. **Puzzle not loading**
   - Check CSV data format in `puzzleCache.js`
   - Verify date format (YYYY-MM-DD)
   - Check browser console for errors

2. **Hint system not working**
   - Ensure puzzle data has groups information
   - Check browser console for validation logs

3. **Build failures**
   - Verify all imports are correct
   - Check for syntax errors in JavaScript files

### Logs

- **Frontend logs**: Check browser developer console
- **Build logs**: Check terminal output during `npm run build`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
