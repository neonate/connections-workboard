#!/bin/bash

# Script to add all valid puzzles from parsed-puzzles directory
# to the main puzzle data using update-puzzle-data.js

echo "🔍 Adding all valid puzzles to main puzzle data..."

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

# Process each puzzle file
for puzzle_file in "$PARSED_DIR"/puzzle-*.json; do
    if [ -f "$puzzle_file" ]; then
        COUNTER=$((COUNTER + 1))
        
        # Extract date from filename
        filename=$(basename "$puzzle_file")
        date=$(echo "$filename" | sed 's/puzzle-\(.*\)\.json/\1/')
        
        echo "📅 Processing puzzle $COUNTER: $date"
        
        # Validate that the puzzle has exactly 16 words (4 groups × 4 words)
        word_count=$(cat "$puzzle_file" | jq -r '.groups[] | .words | length' | awk '{sum += $1} END {print sum}')
        
        if [ "$word_count" = "16" ]; then
            echo "✅ Valid puzzle ($word_count words), adding..."
            
            # Add the puzzle using update-puzzle-data.js
            if node scripts/update-puzzle-data.js add --date "$date" --puzzle-file "$puzzle_file" > /dev/null 2>&1; then
                echo "✅ Successfully added puzzle for $date"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            else
                echo "❌ Failed to add puzzle for $date"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            fi
        else
            echo "⚠️  Skipping invalid puzzle ($word_count words, expected 16)"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
        
        echo "---"
    fi
done

echo "🎉 Processing complete!"
echo "📊 Summary:"
echo "   Total puzzles processed: $COUNTER"
echo "   Successfully added: $SUCCESS_COUNT"
echo "   Errors/Skipped: $ERROR_COUNT"

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "✅ Successfully added $SUCCESS_COUNT new puzzles to the main puzzle data!"
    echo "🌐 You can now test the web app with the new puzzle dates."
else
    echo "❌ No puzzles were successfully added."
fi
