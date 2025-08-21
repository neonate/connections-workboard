# NYT Connections Puzzle Data Update Script

This script provides a safe, validated way to update the puzzle data in your NYT Connections workboard application.

## 🚀 Quick Start

### List all available puzzles
```bash
node scripts/update-puzzle-data.js list
```

### Add a new puzzle from JSON file
```bash
node scripts/update-puzzle-data.js add --date 2025-08-21 --puzzle-file new-puzzle.json
```

### Add a puzzle interactively
```bash
node scripts/update-puzzle-data.js add --date 2025-08-21 --interactive
```

### Validate all existing data
```bash
node scripts/update-puzzle-data.js validate
```

## 📋 Commands

| Command | Description | Options |
|---------|-------------|---------|
| `add` | Add a new puzzle | `--date YYYY-MM-DD` + `--puzzle-file file.json` OR `--interactive` |
| `remove` | Remove an existing puzzle | `--date YYYY-MM-DD` |
| `list` | List all available puzzle dates | None |
| `validate` | Validate all existing puzzle data | None |

## 📝 Puzzle Data Format

The script expects JSON files with this structure:

```json
{
  "date": "2025-08-21",
  "gameId": 803,
  "groups": [
    {
      "name": "CATEGORY NAME",
      "level": 0,
      "words": ["WORD1", "WORD2", "WORD3", "WORD4"]
    },
    {
      "name": "ANOTHER CATEGORY",
      "level": 1,
      "words": ["WORD5", "WORD6", "WORD7", "WORD8"]
    },
    {
      "name": "THIRD CATEGORY",
      "level": 2,
      "words": ["WORD9", "WORD10", "WORD11", "WORD12"]
    },
    {
      "name": "FOURTH CATEGORY",
      "level": 3,
      "words": ["WORD13", "WORD14", "WORD15", "WORD16"]
    }
  ]
}
```

## 🔍 Validation Rules

The script enforces these rules:

- **Date**: Must be in `YYYY-MM-DD` format, cannot be in the future
- **Game ID**: Must be a positive integer
- **Groups**: Exactly 4 groups required
- **Words**: Each group must have exactly 4 words
- **Levels**: Must be 0, 1, 2, or 3 (yellow, green, blue, purple)
- **Uniqueness**: No duplicate words across all groups, no duplicate group names
- **Unicode Support**: Words can contain emojis and special characters

## 🛡️ Safety Features

### Atomic Updates
- Creates backup before making changes
- Writes to temporary file first
- Only moves to final location if validation passes
- Automatic rollback on any failure

### Data Validation
- Validates input data before processing
- Checks generated JavaScript syntax
- Ensures no data corruption

### Backup Management
- Automatic backup creation (`puzzleData.js.backup`)
- Cleanup after successful updates
- Restoration on failure

## 🤖 AI Agent Usage

This script is designed to be AI-agent friendly with:

- **Clear command structure** with predictable parameters
- **Comprehensive error messages** explaining what went wrong
- **Validation at every step** to prevent data corruption
- **Atomic operations** that either succeed completely or fail safely
- **Detailed logging** of all operations

### Example AI Workflow

1. **Extract puzzle data** from HTML/source
2. **Create JSON file** with proper format
3. **Run validation** to check data integrity
4. **Add puzzle** using the script
5. **Verify update** by listing dates

## 📁 File Structure

```
scripts/
├── update-puzzle-data.js    # Main script
├── example-puzzle.json      # Example data format
└── README.md               # This file
```

## 🔧 Technical Details

### How It Works

1. **Reads existing data** from `src/services/puzzleData.js`
2. **Parses the JavaScript** to extract puzzle objects
3. **Validates new data** against strict rules
4. **Generates new JavaScript** with updated data
5. **Performs atomic update** with backup/rollback

### Error Handling

- **Input validation errors** are caught and reported clearly
- **File system errors** trigger automatic rollback
- **JavaScript generation errors** prevent invalid output
- **All errors** include actionable information

### Performance

- **Efficient parsing** of existing JavaScript files
- **Minimal file I/O** operations
- **Fast validation** of data structures
- **Atomic operations** prevent partial updates

## 🚨 Troubleshooting

### Common Issues

**"Could not find EXTENDED_PUZZLES object"**
- The `puzzleData.js` file structure has changed
- Check that the file contains the expected object

**"Validation failed"**
- Check the specific validation error message
- Ensure your JSON follows the exact format
- Verify no duplicate words or group names

**"Update failed"**
- Check file permissions
- Ensure sufficient disk space
- Look for syntax errors in the generated JavaScript

### Recovery

If something goes wrong:
1. **Check for backup file** (`puzzleData.js.backup`)
2. **Restore manually** if needed
3. **Run validation** to check data integrity
4. **Check logs** for specific error details

## 📚 Examples

### Adding a Real Puzzle

```bash
# Create puzzle data file
cat > new-puzzle.json << 'EOF'
{
  "date": "2025-08-21",
  "gameId": 803,
  "groups": [
    {
      "name": "ANIMAL SOUNDS",
      "level": 0,
      "words": ["BARK", "MEOW", "MOO", "OINK"]
    },
    {
      "name": "COLORS",
      "level": 1,
      "words": ["RED", "BLUE", "GREEN", "YELLOW"]
    },
    {
      "name": "FRUITS",
      "level": 2,
      "words": ["APPLE", "BANANA", "ORANGE", "GRAPE"]
    },
    {
      "name": "COUNTRIES",
      "level": 3,
      "words": ["USA", "CANADA", "MEXICO", "BRAZIL"]
    }
  ]
}
EOF

# Add the puzzle
node scripts/update-puzzle-data.js add --date 2025-08-21 --puzzle-file new-puzzle.json
```

### Interactive Creation

```bash
node scripts/update-puzzle-data.js add --date 2025-08-21 --interactive
```

The script will prompt you for:
- Game ID
- Category names for each group
- 4 words for each group

## 🔄 Workflow Integration

### For Regular Updates

1. **Extract new puzzle data** from NYT sources
2. **Format as JSON** following the template
3. **Validate locally** before adding
4. **Add to system** using the script
5. **Test the application** to ensure it works

### For Bulk Updates

1. **Prepare multiple JSON files** for different dates
2. **Validate each file** individually
3. **Add puzzles one by one** to maintain data integrity
4. **Run full validation** after all updates

## 📊 Monitoring

### Check Current Status
```bash
node scripts/update-puzzle-data.js list
```

### Validate Data Integrity
```bash
node scripts/update-puzzle-data.js validate
```

### View Backup Files
```bash
ls -la src/services/puzzleData.js*
```

## 🎯 Best Practices

1. **Always validate** data before adding
2. **Use descriptive category names** for better user experience
3. **Keep game IDs sequential** when possible
4. **Test the application** after major updates
5. **Keep backups** of important data
6. **Use the interactive mode** for quick additions

## 🆘 Support

If you encounter issues:

1. **Check the error message** - it usually explains the problem
2. **Run validation** to identify data issues
3. **Check file permissions** and disk space
4. **Review the JSON format** against the example
5. **Use the list command** to verify current state

The script is designed to be self-documenting and provide clear guidance for any issues that arise.
