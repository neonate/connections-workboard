#!/bin/bash

# Script to replace all old March-July puzzles with commas
# with new clean ones from parsed-puzzles directory

echo "🔄 Replacing all old March-July puzzles with clean ones..."

# Directory containing parsed puzzles
PARSED_DIR="scripts/parsed-puzzles"
COUNTER=0
SUCCESS_COUNT=0
ERROR_COUNT=0

# Check if update-puzzle-data.js exists
if [ ! -f "scripts/update-puzzle-data.js" ]; then
    echo "❌ Error: scripts/update-puzzle-data.js not found!"
    exit 1
fi

# Check if parsed-puzzles directory exists
if [ ! -d "$PARSED_DIR" ]; then
    echo "❌ Error: $PARSED_DIR directory not found!"
    exit 1
fi

echo "📁 Processing puzzles from $PARSED_DIR..."

# First, remove all existing March-July puzzles
echo "🗑️  Removing old March-July puzzles..."
for date in {2025-03-01..2025-07-31}; do
    if node scripts/update-puzzle-data.js list | grep -q "$date"; then
        echo "Removing $date..."
        node scripts/update-puzzle-data.js remove --date "$date" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Removed $date"
        else
            echo "❌ Failed to remove $date"
        fi
    fi
done

echo "📥 Adding clean puzzles..."

# Process each puzzle file
for puzzle_file in "$PARSED_DIR"/puzzle-*.json; do
    if [ -f "$puzzle_file" ]; then
        COUNTER=$((COUNTER + 1))
        
        # Extract date from filename
        filename=$(basename "$puzzle_file")
        date=$(echo "$filename" | sed 's/puzzle-\(.*\)\.json/\1/')
        
        echo "Processing $date (${COUNTER}/153)..."
        
        # Add the puzzle
        if node scripts/update-puzzle-data.js add --date "$date" --puzzle-file "$puzzle_file" --force > /dev/null 2>&1; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            echo "✅ Added $date"
        else
            ERROR_COUNT=$((ERROR_COUNT + 1))
            echo "❌ Failed to add $date"
        fi
    fi
done

echo ""
echo "🎉 Replacement complete!"
echo "📊 Summary:"
echo "   Total processed: $COUNTER"
echo "   Successfully added: $SUCCESS_COUNT ✅"
echo "   Errors: $ERROR_COUNT ❌"

if [ $ERROR_COUNT -eq 0 ]; then
    echo "🎯 All puzzles replaced successfully!"
else
    echo "⚠️  Some puzzles failed to be replaced. Check the errors above."
fi
