# TechRadar Parser Test Suite

This directory contains tools for testing and validating the TechRadar puzzle parser to prevent regressions when making changes.

## Purpose

The TechRadar parser is critical infrastructure that handles various HTML formats and edge cases. This test suite ensures that parser modifications don't break existing functionality.

## Files

- `capture-baseline.js` - Captures baseline data from known working dates
- `baseline-data.json` - Stored baseline results (generated)
- `README.md` - This documentation

## Usage

### 1. Capture Baseline (Before Making Parser Changes)

```bash
# Ensure backend server is running on localhost:3001
cd backend && node server.js &

# Capture current parser behavior as baseline
cd test-data/parser-samples
node capture-baseline.js
```

This will:
- Test multiple known working dates
- Validate data structure and content
- Save results to `baseline-data.json`

### 2. Make Parser Changes

Modify the parser code in `backend/server.js`

### 3. Test for Regressions

```bash
# Compare current parser against baseline
node capture-baseline.js compare
```

This will:
- Re-test all baseline dates
- Compare results against captured baseline
- Report any regressions

## Test Cases

### Known Working Dates

| Date | Description | Key Test |
|------|-------------|----------|
| 2024-06-12 | Complex movie titles | Tests parsing of "Hedwig and the Angry Inch" |
| 2024-07-18 | Standard format | Clean baseline example |
| 2024-08-21 | Duplicate HTML | Tests deduplication logic |
| 2024-06-01 | Coverage boundary | Early TechRadar coverage |
| 2024-11-13 | Different structure | Seasonal HTML variations |

### Validation Checks

- ✅ Exactly 4 groups returned
- ✅ Exactly 16 words total
- ✅ Each group has exactly 4 words
- ✅ No duplicate groups
- ✅ No duplicate words
- ✅ API success response
- ✅ Proper data structure

## HTML Format Documentation

### TechRadar Variations Observed

1. **Standard Format** (July 2024+)
   - Clean hint sections
   - Consistent list structure
   - Single answer section

2. **Duplicate Content** (August 2024)
   - Same data appears multiple times in HTML
   - Requires deduplication logic

3. **Complex Titles** (June 2024)
   - Multi-word movie/book titles
   - Can confuse group name parsing

4. **Early Coverage** (June 2024)
   - Different hint extraction patterns
   - Potential formatting inconsistencies

## Maintenance

### Adding New Test Cases

When encountering new HTML formats or edge cases:

1. Add the date to `KNOWN_WORKING_DATES` in `capture-baseline.js`
2. Re-capture baseline: `node capture-baseline.js`
3. Commit updated baseline data

### Before Parser Changes

Always run: `node capture-baseline.js` to establish current state

### After Parser Changes

Always run: `node capture-baseline.js compare` to check for regressions

## Emergency Rollback

If regressions are detected:

1. Review parser changes carefully
2. Fix issues or rollback changes
3. Re-test until no regressions remain
4. Update baseline if changes are intentional improvements
